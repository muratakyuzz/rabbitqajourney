import type { Action } from "./types";

// Rule actions (source "rule", ruleKey set) are identified by projectId + ruleKey, not by id: web and API
// each run the same rules and open their own copy (docs/PLAN.md M2b). One ruleKey may have history
// (a done phase_approval and a newer open one), so "the" action of a ruleKey is the open one, else the newest.

export const isRuleAction = (a: Action): a is Action & { ruleKey: string } => a.source === "rule" && !!a.ruleKey;

const isOpen = (a: Action) => a.status === "open" || a.status === "in_progress";

/** The current action among actions sharing one projectId + ruleKey. */
export function currentRuleAction<T extends Action>(same: T[]): T | undefined {
  return [...same].sort((a, b) => Number(isOpen(b)) - Number(isOpen(a)) || b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id))[0];
}

/** ruleKey → current rule action of the project. */
export function currentRuleActions(actions: Action[], projectId: string): Map<string, Action> {
  const groups = new Map<string, Action[]>();
  for (const a of actions) {
    if (a.projectId !== projectId || !isRuleAction(a)) continue;
    groups.set(a.ruleKey, [...(groups.get(a.ruleKey) ?? []), a]);
  }
  return new Map([...groups].map(([k, list]) => [k, currentRuleAction(list)!]));
}
