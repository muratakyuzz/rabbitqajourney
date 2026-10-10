import { z } from "zod";
import { ActionStatusSchema, BallSchema, PrioritySchema } from "../enums";
import { IdSchema, IsoDateSchema, requiredText } from "./common";

// API_CONTRACT #6. `source`, `ruleKey`, `insightId` and `meetingId` are server-assigned and not part of the request.
// `ball` is only used when there is no owner; otherwise it follows the owner (domain/ball.ts).
export const ActionCreateSchema = z.object({
  title: requiredText("Aksiyon başlığı boş olamaz."),
  ownerId: IdSchema.nullable(), // user id or contact id
  ball: BallSchema,
  due: IsoDateSchema.nullable(),
  priority: PrioritySchema,
  status: ActionStatusSchema,
  isCustomerVisible: z.boolean().optional(),
});
export type ActionCreate = z.infer<typeof ActionCreateSchema>;

/** PATCH /api/actions/:id (#7). A due change and cancelling need a reason; completing does not. */
export const ActionPatchSchema = z.object({
  title: requiredText("Aksiyon başlığı boş olamaz.").optional(),
  ownerId: IdSchema.nullable().optional(),
  /** only used while the action has no owner; otherwise the ball follows the owner (domain/ball.ts) */
  ball: BallSchema.optional(),
  due: IsoDateSchema.nullable().optional(),
  priority: PrioritySchema.optional(),
  status: ActionStatusSchema.optional(),
  isCustomerVisible: z.boolean().optional(),
  reason: z.string().optional(),
});
export type ActionPatch = z.infer<typeof ActionPatchSchema>;
