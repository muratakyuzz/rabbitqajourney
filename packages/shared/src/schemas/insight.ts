import { z } from "zod";
import { BallSchema, HealthSchema, InsightSourceSchema, StepStatusSchema, type InsightKind } from "../enums";
import { ActionCreateSchema } from "./action";
import { IdSchema, IsoDateSchema, IsoDateTimeSchema } from "./common";
import { RiskDecisionCreateSchema } from "./risk-decision";

// API_CONTRACT #44: fields an AI proposal (`proposed` + `edited`) may carry, per kind. Every schema is strict,
// so any other field (`dependency`, `durationDays`, `required`, server-assigned fields, unknown keys) is rejected.
// action_create / risk_create / decision_create derive from the request schemas; no second field list (INV-19).
// Context checks (kind enabled, confidence threshold, target belongs to the project) are runtime work (INV-23, F8).

const RiskDecisionProposedSchema = RiskDecisionCreateSchema.omit({ kind: true, meetingId: true }).partial().strict();

export const InsightProposedSchemaByKind = {
  step_update: z
    .object({ status: StepStatusSchema, due: IsoDateSchema.nullable(), ball: BallSchema, ownerId: IdSchema.nullable() })
    .partial()
    .strict(),
  action_update: ActionCreateSchema.pick({ status: true, due: true, ownerId: true }).partial().strict(),
  health_change: z.object({ health: HealthSchema, healthReason: z.string() }).partial().strict(),
  // Either the target phase's planEnd or the project's goLiveDate; mixing the two is rejected.
  date_change: z.union([
    z.object({ phaseId: IdSchema, planEnd: IsoDateSchema }).strict(),
    z.object({ goLiveDate: IsoDateSchema }).strict(),
  ]),
  action_create: ActionCreateSchema.partial().strict(),
  // `kind` comes from the proposal kind; `meetingId` is server-assigned.
  risk_create: RiskDecisionProposedSchema,
  decision_create: RiskDecisionProposedSchema,
} satisfies Record<InsightKind, z.ZodType>;

export type InsightProposedByKind = { [K in InsightKind]: z.infer<(typeof InsightProposedSchemaByKind)[K]> };

type ProposedUnion = InsightProposedByKind[InsightKind];
type KeysOfUnion<T> = T extends unknown ? keyof T : never;
type ValueOfUnion<T, K extends PropertyKey> = T extends unknown ? (K extends keyof T ? Exclude<T[K], undefined> : never) : never;

/** Every field any kind may propose, all optional; derived from the per-kind schemas (edit dialog, mock store). */
export type InsightProposedAny = { [K in KeysOfUnion<ProposedUnion>]?: ValueOfUnion<ProposedUnion, K> };

export const InsightSourceRefSchema = z.object({
  title: z.string(),
  from: z.string(),
  at: IsoDateTimeSchema,
  excerpt: z.string(),
  link: z.string(),
  direction: z.enum(["in", "out"]).optional(),
});

const InsightProposalBaseSchema = z.object({
  projectId: IdSchema,
  source: InsightSourceSchema,
  sourceRef: InsightSourceRefSchema,
  targetId: IdSchema.nullable(),
  current: z.record(z.string(), z.unknown()).nullable(),
  rationale: z.string(),
  confidence: z.number().min(0).max(100),
});

/** AI analyzer output (INV-23): discriminated on `kind`, `proposed` limited to that kind's fields. */
export const InsightProposalSchema = z.discriminatedUnion("kind", [
  InsightProposalBaseSchema.extend({ kind: z.literal("step_update"), proposed: InsightProposedSchemaByKind.step_update }),
  InsightProposalBaseSchema.extend({ kind: z.literal("action_update"), proposed: InsightProposedSchemaByKind.action_update }),
  InsightProposalBaseSchema.extend({ kind: z.literal("health_change"), proposed: InsightProposedSchemaByKind.health_change }),
  InsightProposalBaseSchema.extend({ kind: z.literal("date_change"), proposed: InsightProposedSchemaByKind.date_change }),
  InsightProposalBaseSchema.extend({ kind: z.literal("action_create"), proposed: InsightProposedSchemaByKind.action_create }),
  InsightProposalBaseSchema.extend({ kind: z.literal("risk_create"), proposed: InsightProposedSchemaByKind.risk_create }),
  InsightProposalBaseSchema.extend({ kind: z.literal("decision_create"), proposed: InsightProposedSchemaByKind.decision_create }),
]);
export type InsightProposal = z.infer<typeof InsightProposalSchema>;
