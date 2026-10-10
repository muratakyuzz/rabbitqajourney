import { z } from "zod";
import { ActionStatusSchema, BallSchema, PrioritySchema } from "../enums";
import { IdSchema, IsoDateSchema } from "./common";

// API_CONTRACT #6. `source`, `ruleKey`, `insightId` and `meetingId` are server-assigned and not part of the request.
export const ActionCreateSchema = z.object({
  title: z.string().min(1),
  ownerId: IdSchema.nullable(), // user id or contact id
  ball: BallSchema,
  due: IsoDateSchema.nullable(),
  priority: PrioritySchema,
  status: ActionStatusSchema,
  isCustomerVisible: z.boolean().optional(),
});
export type ActionCreate = z.infer<typeof ActionCreateSchema>;
