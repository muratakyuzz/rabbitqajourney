import { z } from "zod";
import { BallSchema, DependencySchema, MeetingTypeSchema, StepCompletionSchema } from "../enums";

// Phase/step template (Ayarlar → Aşama şablonu, docs/PLAN.md M1). StepTpl/PhaseTpl in domain/types are these types.

export const StepTplSchema = z.object({
  title: z.string().trim().min(1, "Adım başlığı boş olamaz."),
  ball: BallSchema,
  required: z.boolean(),
  ownerRole: z.literal("manager").optional(),
  /** Steps with a key (or a non-manual completion) are system steps: rules and completion find them by key. */
  key: z.string().min(1).optional(),
  dependency: DependencySchema,
  durationDays: z.number()
    .int("Süre tam sayı olmalı.")
    .min(1, "Süre en az 1 iş günü olmalı.")
    .max(60, "Süre en fazla 60 iş günü olabilir."),
  /** Missing means manual. */
  completion: StepCompletionSchema.optional(),
  meetingType: MeetingTypeSchema.optional(),
});
export type StepTpl = z.infer<typeof StepTplSchema>;

export const PhaseTplSchema = z.object({
  code: z.string().min(1),
  name: z.string().trim().min(1, "Aşama adı boş olamaz."),
  dependency: DependencySchema,
  steps: z.array(StepTplSchema),
});
export type PhaseTpl = z.infer<typeof PhaseTplSchema>;

/** GET /api/config/template, PUT response. The active template is the highest version. */
export const TemplateVersionSchema = z.object({
  version: z.number().int().positive(),
  createdAt: z.string(),
  createdBy: z.string().nullable(),
  phases: z.array(PhaseTplSchema),
});
export type TemplateVersion = z.infer<typeof TemplateVersionSchema>;

/** PUT /api/config/template. `baseVersion` is the version the editor started from (optimistic concurrency). */
export const TemplatePutSchema = z.object({
  baseVersion: z.number().int().positive(),
  phases: z.array(PhaseTplSchema).min(1),
});
export type TemplatePut = z.infer<typeof TemplatePutSchema>;
