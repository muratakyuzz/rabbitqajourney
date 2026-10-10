import { ActionListSchema, RuleEffectsSchema, type Action, type ActionCreate, type ActionPatch, type RuleEffects } from "@rabbitqa/shared";
import { api } from "./client";

// Actions (docs/PLAN.md M3). Writes return RuleEffects: the changed records, including flow effects.

export const getActions = async (projectId: string): Promise<Action[]> =>
  (await api(`/projects/${encodeURIComponent(projectId)}/actions`, { schema: ActionListSchema })).items;

export const createAction = (projectId: string, input: ActionCreate): Promise<RuleEffects> =>
  api(`/projects/${encodeURIComponent(projectId)}/actions`, { method: "POST", body: input, schema: RuleEffectsSchema });

export const patchAction = (id: string, patch: ActionPatch): Promise<RuleEffects> =>
  api(`/actions/${encodeURIComponent(id)}`, { method: "PATCH", body: patch, schema: RuleEffectsSchema });
