import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import {
  ApiErrorBodySchema, PhasesWithStepsSchema, RuleEffectsSchema, TemplateVersionSchema,
  type PhaseTpl, type ProjectCreate, type RuleEffects, type Step,
} from "@rabbitqa/shared";
import { addBusinessDays } from "@rabbitqa/shared/domain/business-days";
import { PHASE_TEMPLATE } from "@rabbitqa/shared/domain/seed";
import { createApp } from "../../app";
import { createDb, type Db, type Queryable } from "../../db";

const NOW = new Date("2026-10-12T09:00:00.000Z"); // Monday
const TODAY = "2026-10-12";

let db: Db;
let app: ReturnType<typeof createApp>;
beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  db = await createDb();
  app = createApp({ db, bootId: "b", startedAt: "" });
});
afterEach(() => {
  vi.useRealTimers();
});

const input = (over: Partial<ProjectCreate> = {}): ProjectCreate => ({
  customerName: "Yeni Müşteri A.Ş.", name: "RabbitQA Customer Onboarding", csmId: "u_deniz", salespersonId: "s_1",
  licenseModel: "Yıllık abonelik", purchasedModules: ["TestPilot"], startDate: TODAY, goLiveDate: "2026-12-15", ...over,
});
const effects = (res: request.Response) => RuleEffectsSchema.parse(res.body);
const errorOf = (res: request.Response) => ApiErrorBodySchema.parse(res.body).error;
const phasesOf = async (projectId: string, a = app) => PhasesWithStepsSchema.parse((await request(a).get(`/api/projects/${projectId}/phases`)).body);
const stepOf = async (projectId: string, id: string) => (await phasesOf(projectId)).steps.find((s) => s.id === id)!;
const create = async (over: Partial<ProjectCreate> = {}) => {
  const res = await request(app).post("/api/projects").send(input(over));
  expect(res.status).toBe(201);
  return effects(res) as RuleEffects & { project: NonNullable<RuleEffects["project"]> };
};

describe("POST /api/projects", () => {
  it("copies the active template, plans dates and starts the flow", async () => {
    const out = await create();
    const p = out.project;
    expect(p).toMatchObject({ customerName: "Yeni Müşteri A.Ş.", templateVersion: 1, installType: null, teams: [] });
    expect(out.phases.map((ph) => ph.code)).toEqual(PHASE_TEMPLATE.map((t) => t.code));
    expect(out.steps).toHaveLength(PHASE_TEMPLATE.reduce((n, t) => n + t.steps.length, 0));
    for (const ph of out.phases) {
      expect(ph.planStart).not.toBeNull();
      expect(ph.planEnd).toBe(ph.baselineEnd);
    }
    const [first, second] = out.phases;
    expect(first).toMatchObject({ status: "in_progress", activatedAt: NOW.toISOString(), actualStart: TODAY });
    expect(second.status).toBe("locked");

    // flow: first step and independent steps of 00 open with a business-day due date; "previous" steps wait
    const s00 = out.steps.filter((s) => s.phaseId === first.id).sort((a, b) => a.order - b.order);
    expect(s00[0]).toMatchObject({ status: "pending", due: addBusinessDays(TODAY, s00[0].durationDays) });
    expect(s00[1]).toMatchObject({ dependency: "previous", status: "locked" });
    expect(s00.filter((s) => s.dependency === "independent").every((s) => s.status === "pending")).toBe(true);

    // persisted exactly as returned
    const stored = await phasesOf(p.id);
    expect(stored.phases).toEqual(out.phases);
    expect(stored.steps).toEqual([...out.steps].sort((a, b) =>
      out.phases.findIndex((x) => x.id === a.phaseId) - out.phases.findIndex((x) => x.id === b.phaseId) || a.order - b.order));
  });

  it("a project opened after a template change gets the new version's steps", async () => {
    const tpl: PhaseTpl[] = structuredClone(PHASE_TEMPLATE);
    tpl[6].steps.push({ title: "Sürüm 2 adımı", ball: "csm", required: false, dependency: "independent", durationDays: 3, completion: "manual" });
    const put = await request(app).put("/api/config/template").send({ baseVersion: 1, phases: tpl });
    expect(TemplateVersionSchema.parse(put.body).version).toBe(2);

    const out = await create();
    expect(out.project.templateVersion).toBe(2);
    expect(out.steps.some((s) => s.title === "Sürüm 2 adımı")).toBe(true);
  });

  it("due dates skip the holidays in the DB calendar (29 Ekim)", async () => {
    vi.setSystemTime(new Date("2026-10-27T09:00:00.000Z")); // Tuesday
    const out = await create({ startDate: "2026-10-27" });
    const modules = out.steps.find((s) => s.key === "modules")!; // independent, 2 business days
    expect(modules).toMatchObject({ status: "pending", durationDays: 2 });
    expect(modules.due).toBe("2026-10-30"); // 28 (half day) counts, 29 is skipped

    await db.query("DELETE FROM holidays WHERE date = '2026-10-29'");
    const other = await create({ customerName: "Tatilsiz A.Ş.", startDate: "2026-10-27" });
    expect(other.steps.find((s) => s.key === "modules")!.due).toBe("2026-10-29");
  });

  it("409 when the customer already has a project (case-insensitive, trimmed)", async () => {
    const res = await request(app).post("/api/projects").send(input({ customerName: "  iş yatırım " }));
    expect(res.status).toBe(409);
    expect(errorOf(res).field).toBe("customerName");
  });

  it("400 when goLiveDate is not after startDate", async () => {
    const res = await request(app).post("/api/projects").send(input({ goLiveDate: TODAY }));
    expect(res.status).toBe(400);
    expect(errorOf(res)).toMatchObject({ code: "VALIDATION", field: "goLiveDate" });
  });
});

describe("GET /api/projects/:projectId/phases", () => {
  it("returns every phase and step of the project in order", async () => {
    const { phases, steps } = await phasesOf("p_garanti");
    expect(phases.map((p) => p.code)).toEqual(["00", "01", "02", "03", "04", "05", "06", "07", "08"]);
    expect(steps.every((s) => s.projectId === "p_garanti")).toBe(true);
    expect(steps[0].id).toBe("st_garanti_01");
  });

  it("404 for an unknown project", async () => {
    expect((await request(app).get("/api/projects/p_nope/phases")).status).toBe(404);
  });
});

describe("PATCH /api/steps/:id", () => {
  it("manual step done without a reason → the next step opens in order", async () => {
    const res = await request(app).patch("/api/steps/st_garanti_18").send({ status: "done" });
    expect(res.status).toBe(200);
    const e = effects(res);
    expect(e.steps.find((s) => s.id === "st_garanti_18")?.status).toBe("done");
    const next = e.steps.find((s) => s.id === "st_garanti_19")!;
    expect(next).toMatchObject({ status: "pending", activatedAt: NOW.toISOString(), due: addBusinessDays(TODAY, next.durationDays) });
    expect((await stepOf("p_garanti", "st_garanti_19")).status).toBe("pending");
  });

  it("409 on a locked step", async () => {
    const res = await request(app).patch("/api/steps/st_garanti_19").send({ status: "pending", reason: "x" });
    expect(res.status).toBe(409);
    expect(errorOf(res).message).toBe("Adımın sırası gelmedi; durumu elle değiştirilemez");
  });

  it("409 when a data step is marked done by hand", async () => {
    const res = await request(app).patch("/api/steps/st_garanti_17").send({ status: "done" });
    expect(res.status).toBe(409);
    expect(errorOf(res).message).toBe("Bu adım veriyle tamamlanır");
  });

  it("reason is required for a due change and for out-of-scope", async () => {
    const due = await request(app).patch("/api/steps/st_garanti_18").send({ due: "2026-10-30" });
    expect(due.status).toBe(400);
    expect(errorOf(due)).toMatchObject({ code: "REASON_REQUIRED", field: "reason" });
    const oos = await request(app).patch("/api/steps/st_garanti_18").send({ status: "out_of_scope", reason: "   " });
    expect(oos.status).toBe(400);

    const ok = await request(app).patch("/api/steps/st_garanti_18").send({ due: "2026-10-30", reason: "Müşteri talebi" });
    expect(ok.status).toBe(200);
    expect((await stepOf("p_garanti", "st_garanti_18")).due).toBe("2026-10-30");
    const row = (await db.query<{ last_reason: string }>("SELECT last_reason FROM steps WHERE id = 'st_garanti_18'")).rows[0];
    expect(row.last_reason).toBe("Müşteri talebi");
  });

  it("ball change stamps ballSince; an unchanged patch writes nothing", async () => {
    const ball = (await stepOf("p_garanti", "st_garanti_18")).ball === "care" ? "devops" : "care";
    const res = await request(app).patch("/api/steps/st_garanti_18").send({ ball });
    expect(effects(res).steps[0]).toMatchObject({ ball, ballSince: NOW.toISOString() });
    const same = await request(app).patch("/api/steps/st_garanti_18").send({ ball });
    expect(effects(same)).toEqual({ phases: [], steps: [], actions: [] });
  });
});

describe("PATCH /api/phases/:id", () => {
  it("planEnd change needs a reason; baselineEnd stays", async () => {
    const before = (await phasesOf("p_akbank")).phases.find((p) => p.id === "ph_akbank_03")!;
    const noReason = await request(app).patch("/api/phases/ph_akbank_03").send({ planEnd: "2026-10-30" });
    expect(noReason.status).toBe(400);
    expect(errorOf(noReason).code).toBe("REASON_REQUIRED");

    const res = await request(app).patch("/api/phases/ph_akbank_03").send({ planEnd: "2026-10-30", baselineEnd: "2030-01-01", reason: "Keşif uzadı" });
    expect(res.status).toBe(200);
    const ph = effects(res).phases[0];
    expect(ph).toMatchObject({ planEnd: "2026-10-30", baselineEnd: before.baselineEnd });
  });

  it("409 for locked phases and for statuses that are not set by hand", async () => {
    expect((await request(app).patch("/api/phases/ph_akbank_04").send({ status: "in_progress", reason: "x" })).status).toBe(409);
    for (const status of ["late", "at_risk", "locked", "done"]) {
      expect((await request(app).patch("/api/phases/ph_akbank_03").send({ status, reason: "x" })).status).toBe(409);
    }
  });

  it("out of scope (with reason) → the flow opens the next phase", async () => {
    const res = await request(app).patch("/api/phases/ph_akbank_03").send({ status: "out_of_scope", reason: "Keşif yapılmayacak" });
    expect(res.status).toBe(200);
    const e = effects(res);
    expect(e.phases.find((p) => p.id === "ph_akbank_03")?.status).toBe("out_of_scope");
    expect(e.phases.find((p) => p.id === "ph_akbank_04")).toMatchObject({ status: "in_progress", activatedAt: NOW.toISOString() });
  });
});

describe("POST /api/phases/:id/complete", () => {
  it("approves the phase: approver + dates, next phase opens, the approval action is done", async () => {
    const res = await request(app).post("/api/phases/ph_isyatirim_07/complete");
    expect(res.status).toBe(200);
    const e = effects(res);
    expect(e.phases.find((p) => p.id === "ph_isyatirim_07")).toMatchObject({
      status: "done", approvedBy: "u_admin", approvedAt: NOW.toISOString(), actualEnd: TODAY,
    });
    expect(e.phases.find((p) => p.id === "ph_isyatirim_08")).toMatchObject({ status: "in_progress", activatedAt: NOW.toISOString() });
    expect(e.steps.some((s) => s.phaseId === "ph_isyatirim_08" && s.status === "pending")).toBe(true);
    expect(e.actions.find((a) => a.ruleKey === "phase_approval:ph_isyatirim_07")?.status).toBe("done");
  });

  it("409 with open required steps, on a locked phase and when already done", async () => {
    const open = await request(app).post("/api/phases/ph_garanti_04/complete");
    expect(open.status).toBe(409);
    expect(errorOf(open).message).toBe("7 zorunlu adım tamamlanmadı");
    expect((await request(app).post("/api/phases/ph_isyatirim_08/complete")).status).toBe(409);
    expect((await request(app).post("/api/phases/ph_isyatirim_01/complete")).status).toBe(409);
  });

  it("404 for an unknown phase", async () => {
    expect((await request(app).post("/api/phases/ph_nope/complete")).status).toBe(404);
  });
});

describe("POST /api/projects/:projectId/steps/sync (client-rule bridge)", () => {
  it("upserts steps without lock checks; the flow then moves on", async () => {
    const { project, phases, steps } = await create();
    const p00 = phases[0].id;
    const ordered = steps.filter((s) => s.phaseId === p00).sort((a, b) => a.order - b.order);
    const added: Step = {
      ...ordered[0], id: "st_added", title: "Uyarlama: Takım X", key: "adapt:Takım X", status: "locked",
      dependency: "independent", due: null, activatedAt: null, order: 99, completion: "data",
    };
    const res = await request(app).post(`/api/projects/${project.id}/steps/sync`).send({ steps: [{ ...ordered[0], status: "done" }, added] });
    expect(res.status).toBe(200);
    const e = effects(res);
    expect(e.steps.find((s) => s.id === ordered[0].id)?.status).toBe("done");
    expect(e.steps.find((s) => s.id === ordered[1].id)).toMatchObject({ status: "pending", due: addBusinessDays(TODAY, ordered[1].durationDays) });
    expect(e.steps.find((s) => s.id === "st_added")).toMatchObject({ status: "pending", activatedAt: NOW.toISOString() });
    expect((await stepOf(project.id, "st_added")).status).toBe("pending");
  });

  it("in a done phase a step asked back into scope stays out of scope and gets a review action", async () => {
    const st = await stepOf("p_perakende", "st_perakende_16");
    const res = await request(app).post("/api/projects/p_perakende/steps/sync").send({ steps: [{ ...st, status: "locked" }] });
    expect(res.status).toBe(200);
    const e = effects(res);
    expect(e.steps).toEqual([]);
    expect(e.actions).toHaveLength(1);
    expect(e.actions[0]).toMatchObject({ ruleKey: "rule_review:st_perakende_16", status: "open", source: "rule" });
    expect((await stepOf("p_perakende", "st_perakende_16")).status).toBe("out_of_scope");
  });

  it("400 for a step of another project", async () => {
    const st = await stepOf("p_garanti", "st_garanti_18");
    const res = await request(app).post("/api/projects/p_akbank/steps/sync").send({ steps: [{ ...st, projectId: "p_akbank" }] });
    expect(res.status).toBe(400);
  });

  it("an error halfway through writes nothing", async () => {
    const { project, phases, steps } = await create();
    const first = steps.find((s) => s.phaseId === phases[0].id && s.order === 0)!;
    const added: Step = { ...first, id: "st_added", order: 99, dependency: "independent", status: "locked", due: null, activatedAt: null };

    // the second step write inside the transaction fails
    let n = 0;
    const failing: Db = {
      query: db.query,
      transaction: (fn) => db.transaction((tx) => fn({
        query: ((sql: string, params?: unknown[]) => {
          if (/^(INSERT INTO|UPDATE) steps/.test(sql) && ++n === 2) throw new Error("disk full");
          return tx.query(sql, params);
        }) as Queryable["query"],
      })),
    };
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await request(createApp({ db: failing, bootId: "b", startedAt: "" }))
      .post(`/api/projects/${project.id}/steps/sync`).send({ steps: [{ ...first, status: "done" }, added] });
    spy.mockRestore();
    expect(res.status).toBe(500);
    expect(n).toBe(2);

    const after = await phasesOf(project.id);
    expect(after.steps.find((s) => s.id === first.id)?.status).toBe(first.status);
    expect(after.steps.some((s) => s.id === "st_added")).toBe(false);
  });
});
