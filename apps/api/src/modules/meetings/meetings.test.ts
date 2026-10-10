import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import {
  ApiErrorBodySchema, MeetingCreatedSchema, MeetingListSchema, PhasesWithStepsSchema, RuleEffectsSchema, type MeetingCreate,
} from "@rabbitqa/shared";
import { createApp } from "../../app";
import { createDb, type Db } from "../../db";
import * as rows from "../../db/rows";

// a write failure in the middle of a transaction (INV-28): the flag makes inserting into `failOn` throw
const fail = vi.hoisted(() => ({ table: null as string | null }));
vi.mock("../../db/rows", async (orig) => {
  const mod = await orig<typeof rows>();
  return {
    ...mod,
    insertRow: async (q: Parameters<typeof mod.insertRow>[0], table: string, row: Record<string, unknown>) => {
      if (table === fail.table) throw new Error(`test: insert into ${table} failed`);
      return mod.insertRow(q, table, row);
    },
  };
});

const NOW = new Date("2026-10-12T09:00:00.000Z"); // Monday
const TODAY = "2026-10-12";

let db: Db;
let app: ReturnType<typeof createApp>;
beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  fail.table = null;
  db = await createDb();
  app = createApp({ db, bootId: "b", startedAt: "" });
});
afterEach(() => {
  vi.useRealTimers();
});

const errorOf = (res: request.Response) => ApiErrorBodySchema.parse(res.body).error;
const effects = (res: request.Response) => RuleEffectsSchema.parse(res.body);
const list = async (projectId: string) => MeetingListSchema.parse((await request(app).get(`/api/projects/${projectId}/meetings`).expect(200)).body).items;
const stepOf = async (projectId: string, key: string) =>
  PhasesWithStepsSchema.parse((await request(app).get(`/api/projects/${projectId}/phases`)).body).steps.find((s) => s.key === key)!;
const draft = (over: Partial<MeetingCreate> = {}): Partial<MeetingCreate> => ({
  type: "checkin", date: TODAY, status: "held", internalIds: ["u_deniz"], contactIds: [], notes: "Notlar", decisions: "Kararlar", ...over,
});
const post = (body: unknown, projectId = "p_garanti") => request(app).post(`/api/projects/${projectId}/meetings`).send(body as object);
const create = async (over: Partial<MeetingCreate> = {}, projectId = "p_garanti") => {
  const res = await post(draft(over), projectId);
  expect(res.status).toBe(201);
  return MeetingCreatedSchema.parse(res.body);
};
const patch = (id: string, body: Record<string, unknown>) => request(app).patch(`/api/meetings/${id}`).send(body);
const counts = async () => {
  const n = async (table: string) => (await db.query<{ n: number }>(`SELECT count(*)::int AS n FROM ${table}`)).rows[0].n;
  return { meetings: await n("meetings"), participants: await n("meeting_participants"), actions: await n("actions"), steps: await n("steps") };
};
const lastReason = async (id: string) => (await db.query<{ last_reason: string | null }>("SELECT last_reason FROM meetings WHERE id = $1", [id])).rows[0].last_reason;

describe("GET /api/projects/:projectId/meetings", () => {
  it("newest first, with participants and the actions each meeting gave rise to", async () => {
    const items = await list("p_isyatirim");
    const dates = items.map((m) => m.date);
    expect(dates).toEqual([...dates].sort().reverse());
    const m2 = items.find((m) => m.id === "m_2")!;
    expect(m2).toMatchObject({ type: "discovery", status: "held", internalIds: ["u_deniz"], contactIds: ["c_1", "c_2"] });
    expect(m2.actions.map((a) => a.id)).toContain("a_1");
    expect(items.find((m) => m.id === "m_tr_1")?.training).toMatchObject({ trainerId: "u_deniz" });
  });

  it("404 for an unknown project", async () => {
    expect((await request(app).get("/api/projects/p_yok/meetings")).status).toBe(404);
  });
});

describe("POST /api/projects/:projectId/meetings (#8)", () => {
  it("writes the meeting, its participants and its actions; meeting hidden from the customer, actions visible by default", async () => {
    const res = await create({
      contactIds: ["c_3", "c_3"],
      actions: [
        { title: "  Test ortamını aç  ", ownerId: "c_3", ball: "csm", due: "2026-10-20", priority: "high", status: "open" },
        { title: "İç not", ownerId: "u_deniz", ball: "customer", due: null, priority: "low", status: "open", isCustomerVisible: false },
      ],
    });
    expect(res.meeting).toMatchObject({
      projectId: "p_garanti", type: "checkin", date: TODAY, status: "held", internalIds: ["u_deniz"], contactIds: ["c_3"],
      notes: "Notlar", decisions: "Kararlar", isCustomerVisible: false,
    });
    expect(res.meetings).toEqual([res.meeting]);
    expect(res.actions).toHaveLength(2);
    expect(res.actions[0]).toMatchObject({
      title: "Test ortamını aç", source: "meeting", meetingId: res.meeting.id, ownerId: "c_3", ball: "customer", isCustomerVisible: true,
      createdAt: NOW.toISOString(),
    });
    expect(res.actions[1]).toMatchObject({ title: "İç not", ball: "csm", isCustomerVisible: false });

    const stored = (await list("p_garanti")).find((m) => m.id === res.meeting.id)!;
    const { actions, ...meeting } = stored;
    expect(meeting).toEqual(res.meeting);
    expect(actions.map((a) => a.id).sort()).toEqual(res.actions.map((a) => a.id).sort());
  });

  it("isCustomerVisible: true and training / team fields are kept", async () => {
    const tr = await create({ type: "training", status: "planned", date: "2026-10-20", isCustomerVisible: true, training: { trainerId: "u_deniz", modules: ["TestPilot"], recordingUrl: "" } });
    expect(tr.meeting).toMatchObject({ isCustomerVisible: true, training: { trainerId: "u_deniz", modules: ["TestPilot"] } });
    expect(tr.meeting.teamId).toBeUndefined();
    const ad = await create({ type: "adaptation", teamId: "Mobil Bankacılık" });
    expect(ad.meeting.teamId).toBe("Mobil Bankacılık");
  });

  describe("all or nothing (INV-28)", () => {
    it("an invalid action (blank title) → 400 and neither the meeting nor any action is written", async () => {
      const before = await counts();
      const res = await post(draft({
        actions: [
          { title: "Geçerli", ownerId: null, ball: "csm", due: null, priority: "medium", status: "open" },
          { title: "   ", ownerId: null, ball: "csm", due: null, priority: "medium", status: "open" },
        ],
      }));
      expect(res.status).toBe(400);
      expect(errorOf(res).field).toBe("actions.1.title");
      expect(await counts()).toEqual(before);
    });

    it("an action created as cancelled → 400 (actions.N.status), nothing written (review D3)", async () => {
      const before = await counts();
      const res = await post(draft({ actions: [{ title: "X", ownerId: null, ball: "csm", due: null, priority: "medium", status: "cancelled" }] }));
      expect(res.status).toBe(400);
      expect(errorOf(res).field).toBe("actions.0.status");
      expect(await counts()).toEqual(before);
    });

    it("a schema-invalid action (bad due date) → 400, nothing written", async () => {
      const before = await counts();
      const res = await post(draft({ actions: [{ title: "X", ownerId: null, ball: "csm", due: "20.10.2026", priority: "medium", status: "open" }] }));
      expect(res.status).toBe(400);
      expect(errorOf(res).field).toBe("actions.0.due");
      expect(await counts()).toEqual(before);
    });

    it("a write failing after the meeting row (action insert) rolls back the meeting, its participants and the steps", async () => {
      const before = await counts();
      const gonogo = await stepOf("p_garanti", "gonogo");
      fail.table = "actions";
      const res = await post(draft({ type: "go_no_go", actions: [{ title: "X", ownerId: null, ball: "csm", due: null, priority: "medium", status: "open" }] }));
      expect(res.status).toBe(500);
      fail.table = null;
      expect(await counts()).toEqual(before);
      expect(await stepOf("p_garanti", "gonogo")).toEqual(gonogo);
      expect((await list("p_garanti")).some((m) => m.type === "go_no_go")).toBe(false);
    });
  });

  describe("\"Yapıldı\" needs date ≤ today and an internal participant", () => {
    it("a future date → 400 (date); planned is fine", async () => {
      const res = await post(draft({ date: "2026-10-13" }));
      expect(res.status).toBe(400);
      expect(errorOf(res)).toMatchObject({ code: "VALIDATION", field: "date" });
      await create({ date: "2026-10-13", status: "planned" });
    });

    it("no internal participant → 400 (internalIds); planned is fine", async () => {
      const before = await counts();
      const res = await post(draft({ internalIds: [], contactIds: ["c_3"] }));
      expect(res.status).toBe(400);
      expect(errorOf(res).field).toBe("internalIds");
      expect(await counts()).toEqual(before);
      await create({ internalIds: [], status: "planned", date: "2026-10-20" });
    });
  });

  it("400 for an unknown type or status; 404 for an unknown project", async () => {
    expect((await post(draft({ type: "lunch" as never }))).status).toBe(400);
    expect((await post(draft({ status: "done" as never }))).status).toBe(400);
    expect((await post(draft(), "p_yok")).status).toBe(404);
  });

  describe("held-meeting rules and meeting steps", () => {
    it("Go/No-Go held → the gonogo step is done (although locked)", async () => {
      expect((await stepOf("p_garanti", "gonogo")).status).toBe("locked");
      const res = await create({ type: "go_no_go" });
      expect(res.steps.find((s) => s.key === "gonogo")?.status).toBe("done");
      expect((await stepOf("p_garanti", "gonogo")).status).toBe("done");
    });

    it("Go/No-Go planned → gonogo untouched", async () => {
      const res = await create({ type: "go_no_go", status: "planned", date: "2026-10-20" });
      expect(res.steps.find((s) => s.key === "gonogo")).toBeUndefined();
      expect((await stepOf("p_garanti", "gonogo")).status).toBe("locked");
    });

    it("DevOps handover held → the step's ball goes to DevOps and the meeting step is done", async () => {
      const before = await stepOf("p_garanti", "devops_handover");
      expect(before).toMatchObject({ ball: "customer", status: "locked" });
      const res = await create({ type: "devops_handover" });
      expect(res.steps.find((s) => s.key === "devops_handover")).toMatchObject({ ball: "devops", status: "done", ballSince: NOW.toISOString() });
      expect(await stepOf("p_garanti", "devops_handover")).toMatchObject({ ball: "devops", status: "done" });
    });

    it("a held brief completes the brief step (meeting completion on the server); the flow opens what follows", async () => {
      expect((await stepOf("p_ornek", "brief")).status).toBe("locked");
      const res = await create({ type: "brief" }, "p_ornek");
      expect(res.steps.find((s) => s.key === "brief")?.status).toBe("done");
      expect((await stepOf("p_ornek", "brief")).status).toBe("done");
    });

    it("data steps stay with the client: a planned training does not complete training_plan on the server", async () => {
      await create({ type: "training", status: "planned", date: "2026-10-20" });
      expect((await stepOf("p_garanti", "training_plan")).status).toBe("locked");
    });
  });
});

describe("PATCH /api/meetings/:id (#19)", () => {
  it("planned → held runs the rules and completes the step; a future date must be moved in the same request", async () => {
    // m_brief_ornek: planned brief, a week ahead
    const future = await patch("m_brief_ornek", { status: "held" });
    expect(future.status).toBe(400);
    expect(errorOf(future).field).toBe("date");
    expect((await stepOf("p_ornek", "brief")).status).toBe("locked");

    const res = await patch("m_brief_ornek", { status: "held", date: TODAY });
    expect(res.status).toBe(200);
    expect(effects(res).meetings).toEqual([expect.objectContaining({ id: "m_brief_ornek", status: "held", date: TODAY })]);
    expect(effects(res).steps.find((s) => s.key === "brief")?.status).toBe("done");
    expect(await lastReason("m_brief_ornek")).toBeNull();
  });

  it("planned → held without an internal participant → 400", async () => {
    const { meeting } = await create({ status: "planned", date: "2026-10-20", internalIds: [] });
    const res = await patch(meeting.id, { status: "held", date: TODAY });
    expect(res.status).toBe(400);
    expect(errorOf(res).field).toBe("internalIds");
    expect((await patch(meeting.id, { status: "held", date: TODAY, internalIds: ["u_deniz"] })).status).toBe(200);
  });

  it("Go/No-Go planned → held → gonogo done", async () => {
    const { meeting } = await create({ type: "go_no_go", status: "planned", date: "2026-10-20" });
    const res = await patch(meeting.id, { status: "held", date: TODAY });
    expect(effects(res).steps.find((s) => s.key === "gonogo")?.status).toBe("done");
  });

  it("cancelling needs a reason, kept as last_reason; a cancelled meeting completes nothing", async () => {
    const without = await patch("m_brief_ornek", { status: "cancelled", reason: "  " });
    expect(without.status).toBe(400);
    expect(errorOf(without)).toMatchObject({ code: "REASON_REQUIRED", field: "reason" });
    const res = await patch("m_brief_ornek", { status: "cancelled", reason: " Müşteri iptal etti " });
    expect(res.status).toBe(200);
    expect(effects(res).meetings?.[0].status).toBe("cancelled");
    expect(await lastReason("m_brief_ornek")).toBe("Müşteri iptal etti");
    expect((await stepOf("p_ornek", "brief")).status).toBe("locked");
  });

  it("only a planned meeting changes status (409)", async () => {
    const { meeting } = await create();
    const res = await patch(meeting.id, { status: "cancelled", reason: "Yanlış kayıt" });
    expect(res.status).toBe(409);
    expect(errorOf(res).message).toBe("Yalnızca Planlandı toplantının durumu değiştirilebilir");
    const cancelled = (await patch("m_brief_ornek", { status: "cancelled", reason: "x" }));
    expect(cancelled.status).toBe(200);
    expect((await patch("m_brief_ornek", { status: "planned" })).status).toBe(409);
  });

  it("a held meeting's type or date change needs a reason; other fields do not", async () => {
    const { meeting } = await create();
    expect(errorOf(await patch(meeting.id, { date: "2026-10-09" })).code).toBe("REASON_REQUIRED");
    expect(errorOf(await patch(meeting.id, { type: "other" })).code).toBe("REASON_REQUIRED");
    const moved = await patch(meeting.id, { date: "2026-10-09", reason: "Tarih yanlış girilmiş" });
    expect(moved.status).toBe(200);
    expect(await lastReason(meeting.id)).toBe("Tarih yanlış girilmiş");

    const visible = await patch(meeting.id, { isCustomerVisible: true, notes: "Güncel not" });
    expect(visible.status).toBe(200);
    expect(effects(visible).meetings).toEqual([expect.objectContaining({ isCustomerVisible: true, notes: "Güncel not" })]);
    expect(await lastReason(meeting.id)).toBe("Tarih yanlış girilmiş");
  });

  it("a planned meeting's date changes without a reason", async () => {
    expect((await patch("m_brief_ornek", { date: "2026-10-30" })).status).toBe(200);
  });

  it("a held discovery's type changed (with reason) → the discovery step reopens", async () => {
    expect((await stepOf("p_akbank", "discovery")).status).toBe("pending");
    const { meeting, steps } = await create({ type: "discovery" }, "p_akbank");
    expect(steps.find((s) => s.key === "discovery")?.status).toBe("done");
    const res = await patch(meeting.id, { type: "checkin", reason: "Tür yanlış seçilmiş" });
    expect(effects(res).steps.find((s) => s.key === "discovery")?.status).toBe("pending");
  });

  it("an unchanged patch writes nothing", async () => {
    const res = await patch("m_brief_ornek", { notes: "", isCustomerVisible: false });
    expect(effects(res)).toEqual({ phases: [], steps: [], actions: [], meetings: [] });
  });

  it("404 for an unknown meeting", async () => {
    expect((await patch("m_yok", { notes: "x" })).status).toBe(404);
  });
});
