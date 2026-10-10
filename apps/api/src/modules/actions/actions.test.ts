import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { ActionListSchema, ApiErrorBodySchema, PhasesWithStepsSchema, RuleEffectsSchema, type Action, type ActionCreate } from "@rabbitqa/shared";
import { createApp } from "../../app";
import { createDb, type Db } from "../../db";

const NOW = new Date("2026-10-12T09:00:00.000Z"); // Monday

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

const effects = (res: request.Response) => RuleEffectsSchema.parse(res.body);
const errorOf = (res: request.Response) => ApiErrorBodySchema.parse(res.body).error;
const list = async (projectId: string) => ActionListSchema.parse((await request(app).get(`/api/projects/${projectId}/actions`).expect(200)).body).items;
const draft = (over: Partial<ActionCreate> = {}): ActionCreate => ({
  title: "Test ortamı erişiminin açılması", ownerId: "u_deniz", ball: "csm", due: "2026-10-20", priority: "medium", status: "open", ...over,
});
const create = async (over: Partial<ActionCreate> = {}, projectId = "p_garanti") => {
  const res = await request(app).post(`/api/projects/${projectId}/actions`).send(draft(over));
  expect(res.status).toBe(201);
  return effects(res).actions[0];
};
const patch = (id: string, body: Record<string, unknown>) => request(app).patch(`/api/actions/${id}`).send(body);
const lastReason = async (id: string) => (await db.query<{ last_reason: string | null }>("SELECT last_reason FROM actions WHERE id = $1", [id])).rows[0].last_reason;
const devopsId = async () => (await db.query<{ id: string }>("SELECT id FROM users WHERE role = 'devops' ORDER BY id LIMIT 1")).rows[0].id;

describe("GET /api/projects/:projectId/actions", () => {
  it("returns the project's actions ordered by due date, no due date last", async () => {
    await create({ title: "Terminsiz", due: null });
    await create({ title: "Erken", due: "2026-10-13" });
    const items = await list("p_garanti");
    expect(items.every((a) => a.projectId === "p_garanti")).toBe(true);
    const dues = items.map((a) => a.due ?? "9999");
    expect(dues).toEqual([...dues].sort());
    expect(items.at(-1)?.title).toBe("Terminsiz");
  });

  it("seed actions come back as seeded (meeting action with its meetingId, contact owner)", async () => {
    const items = await list("p_isyatirim");
    expect(items.find((a) => a.id === "a_1")).toMatchObject({ source: "meeting", meetingId: "m_2", ownerId: "c_2", ball: "customer" });
  });

  it("404 for an unknown project", async () => {
    const res = await request(app).get("/api/projects/p_yok/actions");
    expect(res.status).toBe(404);
  });
});

describe("POST /api/projects/:projectId/actions (#6)", () => {
  it("creates a manual action, visible to the customer by default, and persists it", async () => {
    const a = await create();
    expect(a).toMatchObject({
      projectId: "p_garanti", title: "Test ortamı erişiminin açılması", source: "manual", meetingId: null,
      isCustomerVisible: true, createdAt: NOW.toISOString(), status: "open",
    });
    expect(a.ruleKey).toBeUndefined();
    expect((await list("p_garanti")).find((x) => x.id === a.id)).toEqual(a);
  });

  it("isCustomerVisible: false is kept; title is trimmed", async () => {
    const a = await create({ isCustomerVisible: false, title: "  İç not  " });
    expect(a).toMatchObject({ isCustomerVisible: false, title: "İç not" });
  });

  it("the ball follows the owner: contact → customer, DevOps user → devops; no owner keeps the given ball", async () => {
    expect((await create({ ownerId: "c_kisi", ball: "csm" })).ball).toBe("customer");
    expect((await create({ ownerId: await devopsId(), ball: "csm" })).ball).toBe("devops");
    expect((await create({ ownerId: null, ball: "care" })).ball).toBe("care");
  });

  it("source, ruleKey and meetingId cannot be set by the client", async () => {
    const res = await request(app).post("/api/projects/p_garanti/actions").send({ ...draft(), source: "rule", ruleKey: "x", meetingId: "m_1" });
    expect(res.status).toBe(201);
    expect(effects(res).actions[0]).toMatchObject({ source: "manual", meetingId: null });
    expect(effects(res).actions[0].ruleKey).toBeUndefined();
  });

  it("400 for an empty title or a bad due date; 404 for an unknown project", async () => {
    expect((await request(app).post("/api/projects/p_garanti/actions").send(draft({ title: "" }))).status).toBe(400);
    const bad = await request(app).post("/api/projects/p_garanti/actions").send({ ...draft(), due: "20.10.2026" });
    expect(bad.status).toBe(400);
    expect(errorOf(bad).field).toBe("due");
    expect((await request(app).post("/api/projects/p_yok/actions").send(draft())).status).toBe(404);
  });

  it("an action is not created as cancelled (cancelling needs a reason) → 400 status (review D3)", async () => {
    const before = await list("p_garanti");
    const res = await request(app).post("/api/projects/p_garanti/actions").send(draft({ status: "cancelled" }));
    expect(res.status).toBe(400);
    expect(errorOf(res)).toEqual({ code: "VALIDATION", message: "Aksiyon İptal durumunda oluşturulamaz.", field: "status" });
    expect(await list("p_garanti")).toEqual(before);
    for (const status of ["open", "in_progress", "done"] as const) expect((await create({ status })).status).toBe(status);
  });

  it("a whitespace-only title → 400 with field title, nothing written (review O1)", async () => {
    const before = await list("p_garanti");
    const res = await request(app).post("/api/projects/p_garanti/actions").send(draft({ title: "   " }));
    expect(res.status).toBe(400);
    expect(errorOf(res)).toEqual({ code: "VALIDATION", message: "Aksiyon başlığı boş olamaz.", field: "title" });
    expect(await list("p_garanti")).toEqual(before);
  });
});

describe("PATCH /api/actions/:id (#7)", () => {
  it("a due change needs a reason; the reason is stored as last_reason", async () => {
    const a = await create();
    const without = await patch(a.id, { due: "2026-10-30" });
    expect(without.status).toBe(400);
    expect(errorOf(without)).toMatchObject({ code: "REASON_REQUIRED", field: "reason" });
    expect((await list("p_garanti")).find((x) => x.id === a.id)?.due).toBe("2026-10-20");

    const res = await patch(a.id, { due: "2026-10-30", reason: "  Müşteri tatilde  " });
    expect(res.status).toBe(200);
    expect(effects(res).actions).toEqual([{ ...a, due: "2026-10-30" }]);
    expect(await lastReason(a.id)).toBe("Müşteri tatilde");
  });

  it("cancelling needs a reason; completing and reopening do not", async () => {
    const a = await create();
    expect((await patch(a.id, { status: "cancelled", reason: " " })).status).toBe(400);
    const done = await patch(a.id, { status: "done" });
    expect(done.status).toBe(200);
    expect(effects(done).actions[0].status).toBe("done");
    expect(await lastReason(a.id)).toBeNull();
    expect((await patch(a.id, { status: "open" })).status).toBe(200);
    const cancelled = await patch(a.id, { status: "cancelled", reason: "Gerek kalmadı" });
    expect(effects(cancelled).actions[0].status).toBe("cancelled");
    expect(await lastReason(a.id)).toBe("Gerek kalmadı");
  });

  it("a new owner sets the ball: contact → customer, back to a CSM user → csm", async () => {
    const a = await create();
    const toContact = await patch(a.id, { ownerId: "c_kisi" });
    expect(effects(toContact).actions[0]).toMatchObject({ ownerId: "c_kisi", ball: "customer" });
    const back = await patch(a.id, { ownerId: "u_deniz", ball: "devops" });
    expect(effects(back).actions[0]).toMatchObject({ ownerId: "u_deniz", ball: "csm" });
  });

  it("an unchanged owner keeps the ball; without an owner the ball can be set directly", async () => {
    const a = await create();
    expect(effects(await patch(a.id, { ball: "devops", title: "Yeni başlık" })).actions[0]).toMatchObject({ ball: "csm", title: "Yeni başlık" });
    const noOwner = await create({ ownerId: null, ball: "csm" });
    expect(effects(await patch(noOwner.id, { ball: "care" })).actions[0].ball).toBe("care");
  });

  it("an unchanged patch writes nothing", async () => {
    const a = await create();
    const res = await patch(a.id, { title: a.title, due: a.due, status: "open" });
    expect(res.status).toBe(200);
    expect(effects(res).actions).toEqual([]);
  });

  it("a blank title → 400 with field title; a padded title is trimmed (review O1)", async () => {
    const a = await create();
    const blank = await patch(a.id, { title: "  " });
    expect(blank.status).toBe(400);
    expect(errorOf(blank)).toMatchObject({ code: "VALIDATION", field: "title" });
    expect(effects(await patch(a.id, { title: "  Yeni başlık " })).actions[0].title).toBe("Yeni başlık");
  });

  it("404 for an unknown action; 400 for an unknown status", async () => {
    expect((await patch("a_yok", { status: "done" })).status).toBe(404);
    const a = await create();
    expect((await patch(a.id, { status: "finished" })).status).toBe(400);
  });

  describe("rule action \"Aşama onayı bekliyor\" (phase_approval)", () => {
    const phasesOf = async (projectId: string) => PhasesWithStepsSchema.parse((await request(app).get(`/api/projects/${projectId}/phases`)).body);
    const approvals = (items: Action[], phaseId: string) => items.filter((a) => a.ruleKey === `phase_approval:${phaseId}`);

    it("opens when the last required step is done, is cancelled when a required step reopens", async () => {
      const { phases, steps } = await phasesOf("p_garanti");
      const active = [...phases].sort((a, b) => a.order - b.order).find((p) => p.status === "in_progress")!;
      const open = steps.filter((s) => s.phaseId === active.id && s.required && s.status !== "done" && s.status !== "out_of_scope");
      expect(approvals(await list("p_garanti"), active.id).filter((a) => a.status === "open")).toEqual([]);

      // finish the phase's required steps through the bridge (no lock checks), like the mockup rules do
      const res = await request(app).post("/api/projects/p_garanti/steps/sync").send({ steps: open.map((s) => ({ ...s, status: "done" })) });
      expect(res.status).toBe(200);
      const opened = approvals(effects(res).actions, active.id);
      expect(opened).toHaveLength(1);
      expect(opened[0]).toMatchObject({ status: "open", source: "rule", isCustomerVisible: false });

      const reopen = await request(app).post("/api/projects/p_garanti/steps/sync").send({ steps: [{ ...open[0], status: "pending" }] });
      expect(approvals(effects(reopen).actions, active.id)[0]).toMatchObject({ id: opened[0].id, status: "cancelled" });
    });

    it("can be edited by hand like any action: a due change needs a reason", async () => {
      const { phases, steps } = await phasesOf("p_garanti");
      const active = [...phases].sort((a, b) => a.order - b.order).find((p) => p.status === "in_progress")!;
      const open = steps.filter((s) => s.phaseId === active.id && s.required && s.status !== "done" && s.status !== "out_of_scope");
      const res = await request(app).post("/api/projects/p_garanti/steps/sync").send({ steps: open.map((s) => ({ ...s, status: "done" })) });
      const approval = approvals(effects(res).actions, active.id)[0];

      expect((await patch(approval.id, { due: "2026-10-30" })).status).toBe(400);
      const moved = await patch(approval.id, { due: "2026-10-30", reason: "CSM izinde" });
      expect(effects(moved).actions).toEqual([{ ...approval, due: "2026-10-30" }]);
    });
  });
});
