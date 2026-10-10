import { z } from "zod";

// API envelope shared by apps/api and the web client (docs/PLAN.md → "Teknik kararlar").

export const ApiErrorCodeSchema = z.enum(["VALIDATION", "REASON_REQUIRED", "NOT_FOUND", "CONFLICT", "INTERNAL"]);
export type ApiErrorCode = z.infer<typeof ApiErrorCodeSchema>;

/** Every non-2xx response: `{ error: { code, message, field? } }`; `message` is Turkish and user-facing. */
export const ApiErrorBodySchema = z.object({
  error: z.object({
    code: ApiErrorCodeSchema,
    message: z.string(),
    field: z.string().optional(),
  }),
});
export type ApiErrorBody = z.infer<typeof ApiErrorBodySchema>;

/** GET /api/health. `bootId` changes on every API start; the client resets its store when it changes. */
export const HealthResponseSchema = z.object({
  status: z.literal("ok"),
  bootId: z.string().min(1),
  startedAt: z.string(),
});
export type HealthResponse = z.infer<typeof HealthResponseSchema>;
