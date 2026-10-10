import { z } from "zod";
import {
  ActionSourceSchema, ActionStatusSchema, BallSchema, DependencySchema, InstallTypeSchema, LlmChoiceSchema,
  MeetingTypeSchema, PhaseStatusSchema, PrioritySchema, StepCompletionSchema, StepStatusSchema,
} from "../enums";
import { IdSchema, IsoDateSchema, IsoDateTimeSchema, requiredText } from "./common";
import { MeetingSchema } from "./meeting";

// Projects, phases, steps and the actions the flow engine opens (docs/PLAN.md M2).
// Phase/Step/Action in domain/types are these types.

export const PhaseSchema = z.object({
  id: IdSchema,
  projectId: IdSchema,
  code: requiredText("Aşama kodu boş olamaz."),
  name: requiredText("Aşama adı boş olamaz."),
  order: z.number().int(),
  status: PhaseStatusSchema,
  planStart: IsoDateSchema.nullable(),
  planEnd: IsoDateSchema.nullable(),
  baselineEnd: IsoDateSchema.nullable(),
  actualStart: IsoDateSchema.nullable(),
  actualEnd: IsoDateSchema.nullable(),
  approvedBy: IdSchema.nullable(),
  approvedAt: IsoDateTimeSchema.nullable(),
  dependency: DependencySchema,
  activatedAt: IsoDateTimeSchema.nullable(),
});
export type Phase = z.infer<typeof PhaseSchema>;

export const StepSchema = z.object({
  id: IdSchema,
  projectId: IdSchema,
  phaseId: IdSchema,
  title: requiredText("Adım başlığı boş olamaz."),
  required: z.boolean(),
  ownerId: IdSchema.nullable(), // user id or contact id
  ball: BallSchema,
  ballSince: IsoDateTimeSchema,
  due: IsoDateSchema.nullable(),
  status: StepStatusSchema,
  order: z.number().int(),
  key: z.string().min(1).optional(),
  dependency: DependencySchema,
  durationDays: z.number().int().min(1).max(60),
  activatedAt: IsoDateTimeSchema.nullable(),
  completion: StepCompletionSchema,
  meetingType: MeetingTypeSchema.optional(),
});
export type Step = z.infer<typeof StepSchema>;

export const ActionSchema = z.object({
  id: IdSchema,
  projectId: IdSchema,
  title: requiredText("Aksiyon başlığı boş olamaz."),
  ownerId: IdSchema.nullable(), // user id or contact id
  ball: BallSchema,
  due: IsoDateSchema.nullable(),
  priority: PrioritySchema,
  status: ActionStatusSchema,
  source: ActionSourceSchema,
  meetingId: IdSchema.nullable(),
  createdAt: IsoDateTimeSchema,
  ruleKey: z.string().optional(),
  insightId: z.string().optional(),
  isCustomerVisible: z.boolean(),
});
export type Action = z.infer<typeof ActionSchema>;

/** GET /api/projects/:projectId/actions — ordered by due date (no due date last), then creation. */
export const ActionListSchema = z.object({ items: z.array(ActionSchema) });
export type ActionList = z.infer<typeof ActionListSchema>;

/** The project fields the API owns. Health, handover, discovery, integrations … stay in the web store (Faz 1). */
export const ProjectCoreSchema = z.object({
  id: IdSchema,
  customerName: requiredText("Müşteri adı boş olamaz."),
  name: requiredText("Proje adı boş olamaz."),
  csmId: IdSchema.nullable(),
  salespersonId: IdSchema.nullable(),
  licenseModel: z.string(),
  purchasedModules: z.array(z.string()),
  startDate: IsoDateSchema,
  goLiveDate: IsoDateSchema,
  installType: InstallTypeSchema.nullable(),
  llmChoice: LlmChoiceSchema.nullable(),
  teams: z.array(z.string()),
  /** Template version the phases and steps were copied from (INV-10). */
  templateVersion: z.number().int().positive().nullable(),
  createdAt: IsoDateTimeSchema,
});
export type ProjectCore = z.infer<typeof ProjectCoreSchema>;

/** POST /api/projects (#1). */
export const ProjectCreateSchema = z.object({
  customerName: requiredText("Müşteri adı boş olamaz."),
  name: requiredText("Proje adı boş olamaz."),
  csmId: IdSchema.nullable(),
  salespersonId: IdSchema.nullable(),
  licenseModel: z.string(),
  purchasedModules: z.array(z.string()),
  startDate: IsoDateSchema,
  goLiveDate: IsoDateSchema,
}).refine((p) => p.goLiveDate > p.startDate, { message: "Hedef Go-Live tarihi başlangıç tarihinden sonra olmalı.", path: ["goLiveDate"] });
export type ProjectCreate = z.infer<typeof ProjectCreateSchema>;

const ReasonSchema = z.string().optional();

/** PATCH /api/phases/:id (#3). `baselineEnd` is not patchable; the server fills it once from planEnd (INV-07). */
export const PhasePatchSchema = z.object({
  status: PhaseStatusSchema.optional(),
  planStart: IsoDateSchema.nullable().optional(),
  planEnd: IsoDateSchema.nullable().optional(),
  actualStart: IsoDateSchema.nullable().optional(),
  actualEnd: IsoDateSchema.nullable().optional(),
  reason: ReasonSchema,
});
export type PhasePatch = z.infer<typeof PhasePatchSchema>;

/** PATCH /api/steps/:id (#5). */
export const StepPatchSchema = z.object({
  ownerId: IdSchema.nullable().optional(),
  ball: BallSchema.optional(),
  due: IsoDateSchema.nullable().optional(),
  status: StepStatusSchema.optional(),
  dependency: DependencySchema.optional(),
  durationDays: z.number().int().min(1).max(60).optional(),
  reason: ReasonSchema,
});
export type StepPatch = z.infer<typeof StepPatchSchema>;

/**
 * POST /api/projects/:projectId/steps/sync — bridge for changes made by mockup screens (client-side rules,
 * meeting dialog, AI approvals). `actions`: any source. Rule actions (source "rule" + ruleKey) are matched by
 * projectId + ruleKey, all others are upserted by id (a client-made id is accepted).
 */
export const StepsSyncSchema = z.object({
  steps: z.array(StepSchema).default([]),
  actions: z.array(ActionSchema).default([]),
}).refine((b) => b.steps.length + b.actions.length > 0, { message: "Gönderilecek adım veya aksiyon yok.", path: ["steps"] });
export type StepsSync = z.infer<typeof StepsSyncSchema>;

/**
 * Response of every project write: only the records that changed (including rule/flow effects).
 * `meetings` is sent by every API write since M4; optional so a response without it still parses.
 */
export const RuleEffectsSchema = z.object({
  project: ProjectCoreSchema.optional(),
  phases: z.array(PhaseSchema),
  steps: z.array(StepSchema),
  actions: z.array(ActionSchema),
  meetings: z.array(MeetingSchema).optional(),
});
export type RuleEffects = z.infer<typeof RuleEffectsSchema>;

/** GET /api/projects/:projectId/meetings: newest first, each with the actions it gave rise to. */
export const MeetingDetailSchema = MeetingSchema.extend({ actions: z.array(ActionSchema) });
export type MeetingDetail = z.infer<typeof MeetingDetailSchema>;
export const MeetingListSchema = z.object({ items: z.array(MeetingDetailSchema) });
export type MeetingList = z.infer<typeof MeetingListSchema>;

/** POST /api/projects/:projectId/meetings (#8): the new meeting plus everything written with it. */
export const MeetingCreatedSchema = RuleEffectsSchema.extend({ meeting: MeetingSchema });
export type MeetingCreated = z.infer<typeof MeetingCreatedSchema>;

/** GET /api/projects/:projectId/phases. */
export const PhasesWithStepsSchema = z.object({
  phases: z.array(PhaseSchema),
  steps: z.array(StepSchema),
});
export type PhasesWithSteps = z.infer<typeof PhasesWithStepsSchema>;
