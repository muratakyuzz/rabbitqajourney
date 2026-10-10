import { vi } from "vitest";
import type { MeetingCreate, MeetingPatch } from "@rabbitqa/shared";
import { ballForOwner } from "@rabbitqa/shared/domain/ball";
import { applyStepCompletion } from "@rabbitqa/shared/domain/completion";
import { advanceFlow, type MkAudit } from "@rabbitqa/shared/domain/flow";
import { applyMeetingHeldRules } from "@rabbitqa/shared/domain/rules";
import { createSeed, uid } from "@rabbitqa/shared/domain/seed";
import type { Action, Meeting, RqState, Step } from "@rabbitqa/shared/domain/types";

// In-memory stand-in for apps/api in web tests: serves the seed like a fresh API boot.
// `handlers` override routes by "METHOD /path" regex (path without the /api prefix).
// Meeting writes run the same shared rules as the API (no validation; tests of errors use handlers).

const noAudit: MkAudit = (e) => ({ ...e, id: "", at: "", userId: "" });

/** Applies a meeting write to the fake server state like apps/api changeProject; returns the changed steps. */
function meetingWrite(server: RqState, projectId: string, change: (s: RqState) => RqState) {
  const before = new Map(server.steps.map((x) => [x.id, JSON.stringify(x)]));
  let next = applyStepCompletion(change(server), projectId, noAudit, new Date(), { only: "meeting" });
  next = advanceFlow(next, projectId, noAudit, new Date());
  Object.assign(server, { meetings: next.meetings, actions: next.actions, steps: next.steps, phases: next.phases });
  return next.steps.filter((x) => before.get(x.id) !== JSON.stringify(x));
}

export interface Call { method: string; path: string; body: unknown }
type Handler = (call: Call) => Response | Promise<Response>;

export const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
export const apiError = (status: number, code: string, message: string) => json(status, { error: { code, message } });

export function fakeApi(handlers: Record<string, Handler> = {}) {
  const server = createSeed();
  const calls: Call[] = [];
  const fn = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const call: Call = {
      method: init?.method ?? "GET",
      path: String(input).replace(/^\/api/, ""),
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    };
    calls.push(call);
    const key = `${call.method} ${call.path}`;
    for (const [pattern, h] of Object.entries(handlers)) if (new RegExp(`^${pattern}$`).test(key)) return h(call);

    let m = key.match(/^GET \/projects\/([^/]+)\/phases$/);
    if (m) {
      const pid = m[1];
      if (!server.projects.some((p) => p.id === pid)) return apiError(404, "NOT_FOUND", "Proje bulunamadı.");
      return json(200, { phases: server.phases.filter((p) => p.projectId === pid), steps: server.steps.filter((s) => s.projectId === pid) });
    }
    m = key.match(/^GET \/projects\/([^/]+)\/actions$/);
    if (m) {
      const pid = m[1];
      if (!server.projects.some((p) => p.id === pid)) return apiError(404, "NOT_FOUND", "Proje bulunamadı.");
      return json(200, { items: server.actions.filter((a) => a.projectId === pid) });
    }
    m = key.match(/^GET \/projects\/([^/]+)\/meetings$/);
    if (m) {
      const pid = m[1];
      if (!server.projects.some((p) => p.id === pid)) return apiError(404, "NOT_FOUND", "Proje bulunamadı.");
      const items = server.meetings.filter((x) => x.projectId === pid).sort((a, b) => b.date.localeCompare(a.date))
        .map((x) => ({ ...x, actions: server.actions.filter((a) => a.meetingId === x.id) }));
      return json(200, { items });
    }
    m = key.match(/^POST \/projects\/([^/]+)\/meetings$/);
    if (m) {
      const pid = m[1];
      const { actions: drafts = [], isCustomerVisible, teamId, ...b } = call.body as MeetingCreate;
      const meeting: Meeting = { ...b, id: uid("m"), projectId: pid, isCustomerVisible: isCustomerVisible ?? false, ...(teamId != null ? { teamId } : {}) };
      const actions = drafts.map((a): Action => ({
        ...a, id: uid("a"), projectId: pid, ball: ballForOwner(a.ownerId, server.users, a.ball), source: "meeting", meetingId: meeting.id,
        createdAt: new Date().toISOString(), isCustomerVisible: a.isCustomerVisible ?? true,
      }));
      const steps = meetingWrite(server, pid, (s) => applyMeetingHeldRules({ ...s, meetings: [...s.meetings, meeting], actions: [...s.actions, ...actions] }, meeting, noAudit));
      return json(201, { phases: [], steps, actions, meetings: [meeting], meeting });
    }
    m = key.match(/^PATCH \/meetings\/([^/]+)$/);
    if (m) {
      const old = server.meetings.find((x) => x.id === m![1]);
      if (!old) return apiError(404, "NOT_FOUND", "Toplantı bulunamadı.");
      const { reason: _r, ...patch } = call.body as MeetingPatch;
      const next: Meeting = { ...old, ...patch } as Meeting;
      const held = old.status === "planned" && next.status === "held";
      const steps = meetingWrite(server, old.projectId, (s) => {
        const changed = { ...s, meetings: s.meetings.map((x) => (x.id === old.id ? next : x)) };
        return held ? applyMeetingHeldRules(changed, next, noAudit) : changed;
      });
      return json(200, { phases: [], steps, actions: [], meetings: [next] });
    }
    m = key.match(/^POST \/phases\/([^/]+)\/complete$/);
    if (m) {
      // like apps/api completePhase: no checks here (tests of errors use handlers), the flow engine runs after
      const phase = server.phases.find((p) => p.id === m![1]);
      if (!phase) return apiError(404, "NOT_FOUND", "Aşama bulunamadı.");
      const before = new Map([...server.phases, ...server.steps, ...server.actions].map((x) => [x.id, JSON.stringify(x)]));
      const done = { ...phase, status: "done" as const, approvedBy: "u_admin", approvedAt: new Date().toISOString(), actualEnd: new Date().toISOString().slice(0, 10) };
      const next = advanceFlow({ ...server, phases: server.phases.map((p) => (p.id === done.id ? done : p)) }, phase.projectId, noAudit, new Date());
      Object.assign(server, { phases: next.phases, steps: next.steps, actions: next.actions });
      const changed = <T extends { id: string }>(xs: T[]) => xs.filter((x) => before.get(x.id) !== JSON.stringify(x));
      return json(200, { phases: changed(next.phases), steps: changed(next.steps), actions: changed(next.actions), meetings: [] });
    }
    m = key.match(/^POST \/projects\/([^/]+)\/steps\/sync$/);
    if (m) {
      // stored as sent (upsert by id) and echoed, like the API for records it accepts
      const b = call.body as { steps?: Step[]; actions?: Action[] };
      const upsert = <T extends { id: string }>(list: T[], items: T[]) =>
        [...list.map((x) => items.find((i) => i.id === x.id) ?? x), ...items.filter((i) => !list.some((x) => x.id === i.id))];
      Object.assign(server, { steps: upsert(server.steps, b.steps ?? []), actions: upsert(server.actions, b.actions ?? []) });
      return json(200, { phases: [], steps: b.steps ?? [], actions: b.actions ?? [] });
    }
    return apiError(404, "NOT_FOUND", "Uç bulunamadı.");
  });
  vi.stubGlobal("fetch", fn);
  const callsTo = (method: string, path: RegExp) => calls.filter((c) => c.method === method && path.test(c.path));
  return { fn, calls, callsTo, server };
}
