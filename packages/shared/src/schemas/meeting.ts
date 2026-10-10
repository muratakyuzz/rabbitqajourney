import { z } from "zod";
import { MeetingStatusSchema, MeetingTypeSchema } from "../enums";
import { ActionCreateSchema } from "./action";
import { IdSchema, IsoDateSchema } from "./common";

// Meetings (docs/PLAN.md M4, API_CONTRACT #8, #19). Meeting in domain/types is this type.
// The list and the create response are in project.ts (they need ActionSchema / RuleEffectsSchema).
// Participant ids are users (internalIds) and contacts (contactIds); contacts stay in the web store, so no FK.

export const MeetingTrainingSchema = z.object({
  trainerId: IdSchema.nullable(),
  modules: z.array(z.string()),
  recordingUrl: z.string(),
});
export type MeetingTraining = z.infer<typeof MeetingTrainingSchema>;

export const MeetingSchema = z.object({
  id: IdSchema,
  projectId: IdSchema,
  type: MeetingTypeSchema,
  date: IsoDateSchema,
  internalIds: z.array(IdSchema),
  contactIds: z.array(IdSchema),
  notes: z.string(),
  decisions: z.string(),
  isCustomerVisible: z.boolean(),
  status: MeetingStatusSchema,
  /** adaptation meetings only: the team (name) the session was for */
  teamId: z.string().nullable().optional(),
  /** training meetings only */
  training: MeetingTrainingSchema.optional(),
});
export type Meeting = z.infer<typeof MeetingSchema>;

/**
 * POST /api/projects/:projectId/meetings (#8). The meeting and its actions are written together or not at all.
 * `isCustomerVisible` defaults to false for the meeting and to true for its actions (as in the mockup store).
 */
export const MeetingCreateSchema = z.object({
  type: MeetingTypeSchema,
  date: IsoDateSchema,
  status: MeetingStatusSchema,
  internalIds: z.array(IdSchema).default([]),
  contactIds: z.array(IdSchema).default([]),
  notes: z.string().default(""),
  decisions: z.string().default(""),
  teamId: z.string().nullable().optional(),
  training: MeetingTrainingSchema.optional(),
  isCustomerVisible: z.boolean().optional(),
  actions: z.array(ActionCreateSchema).default([]),
});
export type MeetingCreate = z.infer<typeof MeetingCreateSchema>;

/**
 * PATCH /api/meetings/:id (#19). Only a planned meeting changes status; cancelling needs a reason, and so does
 * a type or date change of a held meeting. Other fields need none.
 */
export const MeetingPatchSchema = z.object({
  type: MeetingTypeSchema.optional(),
  date: IsoDateSchema.optional(),
  status: MeetingStatusSchema.optional(),
  internalIds: z.array(IdSchema).optional(),
  contactIds: z.array(IdSchema).optional(),
  notes: z.string().optional(),
  decisions: z.string().optional(),
  teamId: z.string().nullable().optional(),
  training: MeetingTrainingSchema.optional(),
  isCustomerVisible: z.boolean().optional(),
  reason: z.string().optional(),
});
export type MeetingPatch = z.infer<typeof MeetingPatchSchema>;
