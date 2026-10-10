import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { apiError, fakeApi, json } from "@/test/fake-api";
import { STATE_KEY, createSeed } from "@rabbitqa/shared/domain/seed";
import { BRIDGE_DEBOUNCE_MS, RqProvider, useRq } from "./store";

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ user: { id: "u_manager", role: "manager", name: "Örnek Manager", email: "manager@virgosol.com" } }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const pause = (ms: number) => act(() => new Promise((r) => setTimeout(r, ms)));
const STEP = "st_garanti_18"; // manual, pending in p_garanti

async function setup(api: ReturnType<typeof fakeApi>) {
  const hook = renderHook(() => useRq(), { wrapper: RqProvider });
  const projects = hook.result.current.state.projects.length;
  await waitFor(() => expect(api.callsTo("GET", /^\/projects\/[^/]+\/phases$/)).toHaveLength(projects));
  await waitFor(() => expect(api.callsTo("GET", /^\/projects\/[^/]+\/actions$/)).toHaveLength(projects));
  await waitFor(() => expect(api.callsTo("GET", /^\/projects\/[^/]+\/meetings$/)).toHaveLength(projects));
  await pause(BRIDGE_DEBOUNCE_MS + 100); // anything hydration itself might cause has settled
  return hook;
}

beforeEach(() => {
  localStorage.clear();
  vi.mocked(toast.error).mockClear();
});
afterEach(() => vi.unstubAllGlobals());

describe("API bridge", () => {
  it("hydration from the API, no change → no sync request", async () => {
    const api = fakeApi();
    await setup(api);
    await pause(BRIDGE_DEBOUNCE_MS + 100);
    expect(api.callsTo("POST", /steps\/sync$/)).toEqual([]);
  });

  it("a mockup change is sent once after the debounce, with the last value", async () => {
    const api = fakeApi();
    const { result } = await setup(api);
    for (const ball of ["care", "devops", "customer"] as const) {
      act(() => { result.current.updateStep(STEP, { ball }); });
      await pause(50);
    }
    expect(api.callsTo("POST", /steps\/sync$/)).toHaveLength(0);
    await waitFor(() => expect(api.callsTo("POST", /steps\/sync$/)).toHaveLength(1));
    const [call] = api.callsTo("POST", /steps\/sync$/);
    expect(call.path).toBe("/projects/p_garanti/steps/sync");
    const body = call.body as { steps: { id: string; ball: string }[] };
    expect(body.steps.map((s) => [s.id, s.ball])).toEqual([[STEP, "customer"]]);

    // the response is applied and becomes the new server view: nothing more to send
    await pause(BRIDGE_DEBOUNCE_MS + 100);
    expect(api.callsTo("POST", /steps\/sync$/)).toHaveLength(1);
  });

  it("server effects in the response are applied to the store", async () => {
    const api = fakeApi({
      "POST /projects/p_garanti/steps/sync": (c) => {
        const step = (c.body as { steps: { id: string }[] }).steps[0];
        return new Response(JSON.stringify({ phases: [], steps: [{ ...step, title: "Sunucunun başlığı" }], actions: [] }), { status: 200 });
      },
    });
    const { result } = await setup(api);
    act(() => { result.current.updateStep(STEP, { ball: "care" }); });
    await waitFor(() => expect(result.current.state.steps.find((s) => s.id === STEP)?.title).toBe("Sunucunun başlığı"));
    await pause(BRIDGE_DEBOUNCE_MS + 100);
    expect(api.callsTo("POST", /steps\/sync$/)).toHaveLength(1);
  });

  it("the server keeps its own value (done phase) → the echoed step corrects the store, nothing is resent", async () => {
    const OOS = "st_perakende_16"; // out of scope, phase 04 done
    const api = fakeApi({
      // like the API: the step stays out of scope and comes back in the response although nothing was written
      "POST /projects/p_perakende/steps/sync": () => json(200, { phases: [], steps: [api.server.steps.find((s) => s.id === OOS)], actions: [] }),
    });
    const { result } = await setup(api);
    act(() => { expect(result.current.updateStep(OOS, { status: "pending" }, "Geri al")).toBeNull(); });
    expect(result.current.state.steps.find((s) => s.id === OOS)?.status).toBe("pending");
    await waitFor(() => expect(api.callsTo("POST", /p_perakende\/steps\/sync$/)).toHaveLength(1));
    await waitFor(() => expect(result.current.state.steps.find((s) => s.id === OOS)?.status).toBe("out_of_scope"));
    await pause(BRIDGE_DEBOUNCE_MS + 100);
    expect(api.callsTo("POST", /steps\/sync$/)).toHaveLength(1);
  });

  it("error → toast and the project is reloaded from the API (server wins)", async () => {
    const api = fakeApi({ "POST /projects/p_garanti/steps/sync": () => apiError(409, "CONFLICT", "Çakışma") });
    const { result } = await setup(api);
    const serverBall = api.server.steps.find((s) => s.id === STEP)!.ball;
    act(() => { result.current.updateStep(STEP, { ball: serverBall === "care" ? "devops" : "care" }); });

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Değişiklik sunucuya yazılamadı: Çakışma"));
    await waitFor(() => expect(api.callsTo("GET", /^\/projects\/p_garanti\/phases$/)).toHaveLength(2));
    await waitFor(() => expect(api.callsTo("GET", /^\/projects\/p_garanti\/actions$/)).toHaveLength(2)); // the reload covers actions
    await waitFor(() => expect(api.callsTo("GET", /^\/projects\/p_garanti\/meetings$/)).toHaveLength(2)); // … and meetings
    await waitFor(() => expect(result.current.state.steps.find((s) => s.id === STEP)?.ball).toBe(serverBall));
    await pause(BRIDGE_DEBOUNCE_MS + 100);
    expect(api.callsTo("POST", /steps\/sync$/)).toHaveLength(1);
  });

  it("hydration: the project's actions become the server's (server wins)", async () => {
    // the store has a local-only action and an old title; the server has neither
    const seed = createSeed();
    const local = { ...seed.actions.find((a) => a.id === "a_2")!, id: "a_local_only", title: "Yalnız yerelde" };
    localStorage.setItem(STATE_KEY, JSON.stringify({ ...seed, actions: [...seed.actions, local] }));
    const api = fakeApi({
      "GET /projects/p_isyatirim/actions": () => json(200, {
        items: api.server.actions.filter((a) => a.projectId === "p_isyatirim").map((a) => (a.id === "a_2" ? { ...a, title: "Sunucudaki başlık" } : a)),
      }),
    });
    const { result } = await setup(api);
    const mine = result.current.state.actions.filter((a) => a.projectId === "p_isyatirim");
    expect(mine.map((a) => a.id).sort()).toEqual(seed.actions.filter((a) => a.projectId === "p_isyatirim").map((a) => a.id).sort());
    expect(mine.find((a) => a.id === "a_2")?.title).toBe("Sunucudaki başlık");
    // what came from the server is the server view: nothing to send back
    expect(api.callsTo("POST", /p_isyatirim\/steps\/sync$/)).toEqual([]);
  });

  it("hydration: the project's meetings become the server's (server wins)", async () => {
    const seed = createSeed();
    const local = { ...seed.meetings.find((m) => m.id === "m_2")!, id: "m_local_only" };
    localStorage.setItem(STATE_KEY, JSON.stringify({ ...seed, meetings: [...seed.meetings, local] }));
    const api = fakeApi({
      "GET /projects/p_isyatirim/meetings": () => json(200, {
        items: api.server.meetings.filter((m) => m.projectId === "p_isyatirim")
          .map((m) => ({ ...m, notes: m.id === "m_2" ? "Sunucudaki not" : m.notes, actions: [] })),
      }),
    });
    const { result } = await setup(api);
    const mine = result.current.state.meetings.filter((m) => m.projectId === "p_isyatirim");
    expect(mine.map((m) => m.id).sort()).toEqual(seed.meetings.filter((m) => m.projectId === "p_isyatirim").map((m) => m.id).sort());
    expect(mine.find((m) => m.id === "m_2")?.notes).toBe("Sunucudaki not");
    expect(mine.find((m) => m.id === "m_2")).not.toHaveProperty("actions");
  });

  it("a meeting and its actions from the API response are not sent back through sync", async () => {
    const api = fakeApi();
    const { result } = await setup(api);
    const meeting = { id: "m_api", projectId: "p_garanti", type: "checkin" as const, date: "2026-10-12", internalIds: ["u_deniz"], contactIds: [], notes: "", decisions: "", isCustomerVisible: false, status: "held" as const };
    const action = { ...api.server.actions.find((a) => a.projectId === "p_garanti" && !a.ruleKey)!, id: "a_api", source: "meeting" as const, meetingId: "m_api" };
    act(() => { result.current.applyServerEffects({ phases: [], steps: [], actions: [action], meetings: [meeting] }); });
    expect(result.current.state.meetings.find((m) => m.id === "m_api")).toEqual(meeting);
    await pause(BRIDGE_DEBOUNCE_MS + 100);
    expect(api.callsTo("POST", /steps\/sync$/)).toEqual([]);
  });

  it("hydration: a response that breaks the schema is not silent — console names the field, a toast is shown (review O1)", async () => {
    const api = fakeApi({
      "GET /projects/p_garanti/actions": () => json(200, {
        items: api.server.actions.filter((a) => a.projectId === "p_garanti").map((a, i) => (i === 0 ? { ...a, title: "" } : a)),
      }),
    });
    const bad = api.server.actions.find((a) => a.projectId === "p_garanti")!;
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { result } = await setup(api);
    expect(error).toHaveBeenCalledWith(expect.stringMatching(new RegExp(`^Proje p_garanti: sunucu yanıtı şemaya uymuyor — items\\.0\\.title — .+ \\(id ${bad.id}\\)`)));
    expect(toast.error).toHaveBeenCalledWith("Garanti Teknoloji: sunucudan gelen veri okunamadı (items.0.title). Bu projedeki değişiklikler sunucuya yazılmıyor.");
    // not bridged: a change is not sent
    act(() => { result.current.updateStep(STEP, { ball: "care" }); });
    await pause(BRIDGE_DEBOUNCE_MS + 150);
    expect(api.callsTo("POST", /p_garanti\/steps\/sync$/)).toEqual([]);
    error.mockRestore();
  });

  describe("Go-Live approval (review Y1)", () => {
    /** p_garanti with 07 open on the server: Go/No-Go and the commitment check done, customer approval pending. */
    function goLiveApi(complete?: () => Response) {
      const api = fakeApi(complete ? { "POST /phases/[^/]+/complete": complete } : {});
      const p07 = api.server.phases.find((p) => p.projectId === "p_garanti" && p.code === "07")!;
      api.server.phases = api.server.phases.map((p) => (p.id === p07.id ? { ...p, status: "in_progress", activatedAt: "2026-10-01T09:00:00.000Z" } : p));
      const status = { gonogo: "done", commit_check: "done", customer_approval: "pending" } as const;
      api.server.steps = api.server.steps.map((st) => {
        const k = st.phaseId === p07.id ? (st as { key?: keyof typeof status }).key : undefined;
        return k && status[k] ? { ...st, status: status[k], activatedAt: "2026-10-01T09:00:00.000Z" } : st;
      });
      return { api, p07 };
    }

    /** Not inside act(): approveGoLive waits for the store commit, which act() would hold back until it returns. */
    async function approve(rq: ReturnType<typeof useRq>) {
      let out: Awaited<ReturnType<typeof rq.approveGoLive>> | undefined;
      void rq.approveGoLive("p_garanti", "c_3", "2026-10-12", "Müşteri onayladı").then((r) => { out = r; });
      await waitFor(() => expect(out).toBeDefined());
      return out!;
    }

    it("07 is not closed locally: the bridge is sent at once, then POST /phases/:id/complete, then its effects are applied", async () => {
      const { api, p07 } = goLiveApi();
      const { result } = await setup(api);
      const out = await approve(result.current);

      expect(out).toEqual({ error: null, notice: null });
      const writes = api.calls.filter((c) => c.method !== "GET");
      expect(writes.map((c) => `${c.method} ${c.path}`)).toEqual(["POST /projects/p_garanti/steps/sync", `POST /phases/${p07.id}/complete`]);
      const synced = (writes[0].body as { steps: { id: string; status: string }[] }).steps;
      const approval = result.current.state.steps.find((st) => st.phaseId === p07.id && (st as { key?: string }).key === "customer_approval")!;
      expect(synced.find((st) => st.id === approval.id)?.status).toBe("done");
      expect(result.current.state.phases.find((p) => p.id === p07.id)).toMatchObject({ status: "done", approvedBy: "u_admin" });
      expect(result.current.state.projects.find((p) => p.id === "p_garanti")?.goLiveApproval).toMatchObject({ contactId: "c_3", approvedAt: "2026-10-12" });
      await pause(BRIDGE_DEBOUNCE_MS + 100);
      expect(api.callsTo("POST", /steps\/sync$/)).toHaveLength(1); // the debounced send was replaced by the immediate one
    });

    it("complete answers 409 → the message comes back as a notice, 07 stays open, the approval is kept", async () => {
      const { api, p07 } = goLiveApi(() => apiError(409, "CONFLICT", "1 zorunlu adım tamamlanmadı"));
      const { result } = await setup(api);
      const out = await approve(result.current);

      expect(out).toEqual({ error: null, notice: `Onay kaydedildi; 07 ${p07.name} kapatılmadı: 1 zorunlu adım tamamlanmadı` });
      expect(result.current.state.phases.find((p) => p.id === p07.id)?.status).toBe("in_progress");
      expect(result.current.state.projects.find((p) => p.id === "p_garanti")?.goLiveApproval).toBeDefined();
    });
  });

  it("a project the API does not know stays local-only and is never synced", async () => {
    const api = fakeApi({ "GET /projects/p_ornek/phases": () => apiError(404, "NOT_FOUND", "Proje bulunamadı.") });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { result } = await setup(api);
    expect(result.current.isLocalOnly("p_ornek")).toBe(true);
    const step = result.current.state.steps.find((s) => s.projectId === "p_ornek" && s.status === "pending" && s.completion === "manual")
      ?? result.current.state.steps.find((s) => s.projectId === "p_ornek" && s.status === "pending")!;
    act(() => { result.current.updateStep(step.id, { ball: step.ball === "care" ? "devops" : "care" }); });
    await pause(BRIDGE_DEBOUNCE_MS + 150);
    expect(api.callsTo("POST", /p_ornek\/steps\/sync$/)).toEqual([]);
    warn.mockRestore();
  });
});
