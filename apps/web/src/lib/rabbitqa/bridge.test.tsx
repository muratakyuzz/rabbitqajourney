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

  it("an action from the meeting dialog (store addMeeting) goes to the server through sync, once", async () => {
    const api = fakeApi();
    const { result } = await setup(api);
    act(() => {
      result.current.addMeeting(
        { projectId: "p_garanti", type: "checkin", date: "2026-10-12", internalIds: ["u_deniz"], contactIds: [], notes: "", decisions: "", status: "held" },
        [{ title: "Toplantıdan doğan aksiyon", ownerId: "u_deniz", ball: "csm", due: "2026-10-20", priority: "high", status: "open" }],
      );
    });
    await waitFor(() => expect(api.callsTo("POST", /p_garanti\/steps\/sync$/)).toHaveLength(1));
    const body = api.callsTo("POST", /p_garanti\/steps\/sync$/)[0].body as { actions: { title: string; source: string; meetingId: string | null }[] };
    expect(body.actions).toEqual([expect.objectContaining({ title: "Toplantıdan doğan aksiyon", source: "meeting", meetingId: expect.any(String) })]);
    await pause(BRIDGE_DEBOUNCE_MS + 100);
    expect(api.callsTo("POST", /steps\/sync$/)).toHaveLength(1);
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
