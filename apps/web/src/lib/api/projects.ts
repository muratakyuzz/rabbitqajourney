import {
  PhasesWithStepsSchema, RuleEffectsSchema,
  type PhasePatch, type PhasesWithSteps, type ProjectCreate, type RuleEffects, type StepPatch, type StepsSyncSchema,
} from "@rabbitqa/shared";
import type { z } from "zod";
import { api } from "./client";

// Projects, phases and steps (docs/PLAN.md M2). Every write returns RuleEffects: only the changed records.

export type CreatedProject = RuleEffects & { project: NonNullable<RuleEffects["project"]> };

export const createProject = (input: ProjectCreate) =>
  api("/projects", { method: "POST", body: input, schema: RuleEffectsSchema }) as Promise<CreatedProject>;

export const getPhases = (projectId: string): Promise<PhasesWithSteps> =>
  api(`/projects/${encodeURIComponent(projectId)}/phases`, { schema: PhasesWithStepsSchema });

export const patchPhase = (id: string, patch: PhasePatch): Promise<RuleEffects> =>
  api(`/phases/${encodeURIComponent(id)}`, { method: "PATCH", body: patch, schema: RuleEffectsSchema });

export const completePhase = (id: string): Promise<RuleEffects> =>
  api(`/phases/${encodeURIComponent(id)}/complete`, { method: "POST", schema: RuleEffectsSchema });

export const patchStep = (id: string, patch: StepPatch): Promise<RuleEffects> =>
  api(`/steps/${encodeURIComponent(id)}`, { method: "PATCH", body: patch, schema: RuleEffectsSchema });

/** Body of the bridge call; both lists optional, at least one non-empty. */
export type SyncBody = z.input<typeof StepsSyncSchema>;

/** Client-rule bridge: steps and rule actions computed by mockup screens. */
export const syncProject = (projectId: string, body: SyncBody): Promise<RuleEffects> =>
  api(`/projects/${encodeURIComponent(projectId)}/steps/sync`, { method: "POST", body, schema: RuleEffectsSchema });

