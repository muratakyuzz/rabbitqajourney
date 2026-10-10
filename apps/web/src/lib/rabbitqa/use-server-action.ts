import { useCallback, useState } from "react";
import type { RuleEffects } from "@rabbitqa/shared";
import { apiErrorMessage } from "@/lib/api";
import { useRq } from "./store";

/**
 * Screens that write phases/steps through the API (docs/PLAN.md M2b): `busy` while the call runs,
 * the response goes into the store, the error comes back as a Turkish message (null on success).
 */
export function useServerAction() {
  const { applyServerEffects } = useRq();
  const [busy, setBusy] = useState(false);
  const run = useCallback(async (call: () => Promise<RuleEffects>): Promise<string | null> => {
    setBusy(true);
    try {
      applyServerEffects(await call());
      return null;
    } catch (e) {
      return apiErrorMessage(e);
    } finally {
      setBusy(false);
    }
  }, [applyServerEffects]);
  return { busy, run };
}
