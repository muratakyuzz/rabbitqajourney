import type { PhasesWithSteps, RuleEffects } from "@rabbitqa/shared";
import { currentRuleAction, currentRuleActions, isRuleAction } from "@rabbitqa/shared/domain/rule-actions";
import { projectFromCore } from "@rabbitqa/shared/domain/seed";
import type { Action, Meeting, RqState, Step } from "@rabbitqa/shared/domain/types";

// Store ↔ API bridge, pure part (docs/PLAN.md M2b, M3, M4). The API owns phases, steps, actions and meetings of a
// project; the store keeps a copy. Per project we remember the last server picture ("view") and send whatever the
// mockup screens changed since then (POST steps/sync). Meetings are not bridged: the screens write them through
// the API directly. Everything the server returns is merged back here.

/**
 * A send that fails on the network or with a 5xx is retried after these pauses (review O2); tests shorten them.
 * After the last one the project's bridge is paused until the next successful API response or hydration.
 */
export const bridgeRetry = { delaysMs: [1000, 3000, 10000] };

/** Stable JSON: sorted keys, undefined dropped — so field order and missing optionals do not count as changes. */
export function canon(v: unknown): string {
  return JSON.stringify(v, (_k, x) =>
    x && typeof x === "object" && !Array.isArray(x)
      ? Object.fromEntries(Object.keys(x).sort().filter((k) => x[k] !== undefined).map((k) => [k, x[k]]))
      : x);
}

/**
 * Last server picture of one project: step id → canon(step); rule actions by ruleKey → canon(fields the server
 * takes over); every other action by id → canon(action).
 */
export interface ServerView { steps: Map<string, string>; rule: Map<string, string>; actions: Map<string, string> }

export const emptyView = (): ServerView => ({ steps: new Map(), rule: new Map(), actions: new Map() });

/** The server matches rule actions by ruleKey and takes over only these fields. */
const ruleFields = (a: Action) => canon({ status: a.status, title: a.title, due: a.due, ownerId: a.ownerId });

export function recordSteps(view: ServerView, steps: Step[]) {
  for (const s of steps) view.steps.set(s.id, canon(s));
}
export function recordActions(view: ServerView, actions: Action[]) {
  for (const a of actions) {
    if (isRuleAction(a)) view.rule.set(a.ruleKey, ruleFields(a));
    else view.actions.set(a.id, canon(a));
  }
}

/** What the store has and the server has not seen: changed/new steps, current rule actions and other actions. */
export function diffProject(s: RqState, projectId: string, view: ServerView): { steps: Step[]; actions: Action[] } {
  const steps = s.steps.filter((x) => x.projectId === projectId && view.steps.get(x.id) !== canon(x));
  const rule = [...currentRuleActions(s.actions, projectId).values()].filter((a) => view.rule.get(a.ruleKey!) !== ruleFields(a));
  const other = s.actions.filter((a) => a.projectId === projectId && !isRuleAction(a) && view.actions.get(a.id) !== canon(a));
  return { steps, actions: [...rule, ...other] };
}

/** Project ids touched by a server response. */
export const projectsIn = (e: RuleEffects) =>
  new Set([
    ...(e.project ? [e.project.id] : []), ...e.phases.map((x) => x.projectId), ...e.steps.map((x) => x.projectId),
    ...e.actions.map((x) => x.projectId), ...(e.meetings ?? []).map((x) => x.projectId),
  ]);

const upsert = <T extends { id: string }>(list: T[], items: T[]) => {
  if (!items.length) return list;
  const byId = new Map(items.map((x) => [x.id, x]));
  const out = list.map((x) => byId.get(x.id) ?? x);
  const known = new Set(list.map((x) => x.id));
  return [...out, ...items.filter((x) => !known.has(x.id))];
};

/**
 * Puts a server response into the store. Phases/steps/meetings by id. Actions by id; a rule action the store has
 * under another id (same project + ruleKey) is replaced by the server's, so no duplicate remains.
 * A new project is added; for a known one only the API's fields are merged, except installType,
 * llmChoice and teams, which the store still owns in Faz 1.
 */
export function mergeEffects(s: RqState, e: RuleEffects): RqState {
  let actions = s.actions;
  for (const a of e.actions) {
    if (actions.some((x) => x.id === a.id)) {
      actions = actions.map((x) => (x.id === a.id ? a : x));
    } else if (isRuleAction(a)) {
      const same = actions.filter((x) => x.projectId === a.projectId && x.ruleKey === a.ruleKey);
      const local = currentRuleAction(same);
      actions = local ? actions.map((x) => (x.id === local.id ? a : x)) : [...actions, a];
    } else {
      actions = [...actions, a];
    }
    if (isRuleAction(a) && (a.status === "open" || a.status === "in_progress")) {
      // a second open local copy of the same rule would be a duplicate
      actions = actions.filter((x) => x.id === a.id || x.projectId !== a.projectId || x.ruleKey !== a.ruleKey || !(x.status === "open" || x.status === "in_progress"));
    }
  }
  let projects = s.projects;
  if (e.project) {
    const known = projects.find((p) => p.id === e.project!.id);
    const { templateVersion: _v, installType: _i, llmChoice: _l, teams: _t, ...owned } = e.project;
    projects = known ? projects.map((p) => (p.id === known.id ? { ...p, ...owned } : p)) : [...projects, projectFromCore(e.project)];
  }
  return {
    ...s, projects, phases: upsert(s.phases, e.phases), steps: upsert(s.steps, e.steps), actions,
    meetings: upsert(s.meetings, e.meetings ?? []),
  };
}

/** Hydration / reload: the project's phases, steps, actions and meetings become exactly the server's (server wins). */
export function replaceProjectData(s: RqState, projectId: string, data: PhasesWithSteps & { actions: Action[]; meetings: Meeting[] }): RqState {
  return {
    ...s,
    phases: [...s.phases.filter((p) => p.projectId !== projectId), ...data.phases],
    steps: [...s.steps.filter((x) => x.projectId !== projectId), ...data.steps],
    actions: [...s.actions.filter((a) => a.projectId !== projectId), ...data.actions],
    meetings: [...s.meetings.filter((m) => m.projectId !== projectId), ...data.meetings],
  };
}

/**
 * Remembers the view entries a send is about to overwrite (the send records its diff optimistically).
 * The returned function puts them back, so a send that never reached the server is diffed and sent again.
 */
export function snapshotView(view: ServerView, diff: { steps: Step[]; actions: Action[] }): () => void {
  const saved: [Map<string, string>, string, string | undefined][] = [
    ...diff.steps.map((x): [Map<string, string>, string, string | undefined] => [view.steps, x.id, view.steps.get(x.id)]),
    ...diff.actions.map((a): [Map<string, string>, string, string | undefined] =>
      isRuleAction(a) ? [view.rule, a.ruleKey, view.rule.get(a.ruleKey)] : [view.actions, a.id, view.actions.get(a.id)]),
  ];
  return () => {
    for (const [map, key, value] of saved) {
      if (value === undefined) map.delete(key);
      else map.set(key, value);
    }
  };
}

/**
 * What a rejected send was, for the toast: the record the error field points at (`steps.N…`, `actions.N…`),
 * else up to three titles of what was sent.
 */
export function describeSent(diff: { steps: Step[]; actions: Action[] }, field?: string): string {
  const one = (kind: "steps" | "actions", i: number) => {
    const x = diff[kind][i];
    return x ? `"${x.title}" ${kind === "steps" ? "adımı" : "aksiyonu"}` : null;
  };
  const m = field?.match(/^(steps|actions)\.(\d+)/);
  const pointed = m ? one(m[1] as "steps" | "actions", Number(m[2])) : null;
  if (pointed) return pointed;
  const all = [...diff.steps.map((_, i) => one("steps", i)!), ...diff.actions.map((_, i) => one("actions", i)!)];
  return all.length > 3 ? `${all.slice(0, 3).join(", ")} ve ${all.length - 3} kayıt daha` : all.join(", ");
}
