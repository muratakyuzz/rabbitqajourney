import { useCallback, useState } from "react";
import type { RuleEffects } from "@rabbitqa/shared";
import { apiErrorMessage } from "@/lib/api";
import { useRq } from "./store";

export const BRIDGE_NOT_SENT = "Bekleyen değişiklikler sunucuya yazılamadı; işlem yapılmadı.";

/**
 * Screens that write phases/steps through the API (docs/PLAN.md M2b): `busy` while the call runs,
 * the response goes into the store, the error comes back as a Turkish message (null on success).
 * `flush`: the project whose pending bridge diff must reach the server first, because the server decides on
 * its step status (phase complete, step patch, meeting writes — docs/PLAN.md Kararlar). If that send fails,
 * the call is not made.
 */
export function useServerAction() {
  const { applyServerEffects, flushBridge } = useRq();
  const [busy, setBusy] = useState(false);
  const run = useCallback(async (call: () => Promise<RuleEffects>, opts: { flush?: string } = {}): Promise<string | null> => {
    setBusy(true);
    try {
      if (opts.flush && (await flushBridge(opts.flush)) === "failed") return BRIDGE_NOT_SENT;
      applyServerEffects(await call());
      return null;
    } catch (e) {
      return apiErrorMessage(e);
    } finally {
      setBusy(false);
    }
  }, [applyServerEffects, flushBridge]);
  return { busy, run };
}
