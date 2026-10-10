import { z } from "zod";
import { PrioritySchema, RiskKindSchema, RiskStatusSchema } from "../enums";
import { IdSchema, IsoDateSchema } from "./common";

// API_CONTRACT #31.
export const RiskDecisionCreateSchema = z.object({
  kind: RiskKindSchema,
  title: z.string().min(1),
  description: z.string(),
  impact: PrioritySchema,
  probability: PrioritySchema,
  status: RiskStatusSchema,
  ownerId: IdSchema.nullable(),
  due: IsoDateSchema.nullable(),
  mitigation: z.string(),
  meetingId: IdSchema.nullable(),
  decidedAt: IsoDateSchema.nullable(),
  isCustomerVisible: z.boolean(),
});
export type RiskDecisionCreate = z.infer<typeof RiskDecisionCreateSchema>;
