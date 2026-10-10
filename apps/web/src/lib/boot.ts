import { HealthResponseSchema } from "@rabbitqa/shared";
import { STATE_KEY } from "@rabbitqa/shared/domain/seed";
import { api } from "./api";

export const BOOT_ID_KEY = "rabbitqa-api-boot-id";

/**
 * The API keeps its data in memory and reloads the seed on every start (docs/PLAN.md → "Restart tespiti").
 * When its bootId differs from the stored one, the persisted web store is dropped so the store starts
 * from the same seed. Runs before the first render; never throws.
 * - `reset`: new API boot (or first contact), store cleared
 * - `same`: same API boot, nothing changed
 * - `offline`: API unreachable, mockup keeps working on its local state
 */
export async function syncBootId(timeoutMs = 2000): Promise<"reset" | "same" | "offline"> {
  let bootId: string;
  try {
    ({ bootId } = await api("/health", { schema: HealthResponseSchema, signal: AbortSignal.timeout(timeoutMs) }));
  } catch {
    return "offline";
  }
  try {
    if (localStorage.getItem(BOOT_ID_KEY) === bootId) return "same";
    localStorage.removeItem(STATE_KEY);
    localStorage.setItem(BOOT_ID_KEY, bootId);
  } catch {
    // storage blocked: the store falls back to the seed on its own
  }
  return "reset";
}
