import type { PhasesWithSteps, ProjectCore, RuleEffects } from "@rabbitqa/shared";
import { currentRuleAction, currentRuleActions, isRuleAction } from "@rabbitqa/shared/domain/rule-actions";
import { DEFAULT_PROJECT_INTEGRATIONS } from "@rabbitqa/shared/domain/seed";
import type { Action, Project, RqState, Step } from "@rabbitqa/shared/domain/types";

// Store ↔ API bridge, pure part (docs/PLAN.md M2b, M3). The API owns phases, steps and actions of a project;
// the store keeps a copy. Per project we remember the last server picture ("view") and send whatever the
// mockup screens changed since then (POST steps/sync). Everything the server returns is merged back here.

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
  new Set([...(e.project ? [e.project.id] : []), ...e.phases.map((x) => x.projectId), ...e.steps.map((x) => x.projectId), ...e.actions.map((x) => x.projectId)]);

/** A store Project from the API's fields; the fields the API does not own get the store's defaults. */
export const projectFromCore = ({ templateVersion: _v, ...core }: ProjectCore): Project => ({
  ...core, health: "green", healthReason: "", desiredModules: [], discoveryAnswers: {}, teamInfo: {},
  integrations: structuredClone(DEFAULT_PROJECT_INTEGRATIONS), noCommitments: false,
});

const upsert = <T extends { id: string }>(list: T[], items: T[]) => {
  if (!items.length) return list;
  const byId = new Map(items.map((x) => [x.id, x]));
  const out = list.map((x) => byId.get(x.id) ?? x);
  const known = new Set(list.map((x) => x.id));
  return [...out, ...items.filter((x) => !known.has(x.id))];
};

/**
 * Puts a server response into the store. Phases/steps by id. Actions by id; a rule action the store has
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
  return { ...s, projects, phases: upsert(s.phases, e.phases), steps: upsert(s.steps, e.steps), actions };
}

/** Hydration / reload: the project's phases, steps and actions become exactly the server's (server wins). */
export function replaceProjectData(s: RqState, projectId: string, data: PhasesWithSteps & { actions: Action[] }): RqState {
  return {
    ...s,
    phases: [...s.phases.filter((p) => p.projectId !== projectId), ...data.phases],
    steps: [...s.steps.filter((x) => x.projectId !== projectId), ...data.steps],
    actions: [...s.actions.filter((a) => a.projectId !== projectId), ...data.actions],
  };
}
