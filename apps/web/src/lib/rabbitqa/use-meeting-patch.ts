import { useCallback } from "react";
import { toast } from "sonner";
import type { MeetingPatch } from "@rabbitqa/shared";
import { patchMeeting } from "@/lib/api/meetings";
import { useServerAction } from "./use-server-action";

/**
 * Meeting changes from lists and panels (docs/PLAN.md M4): PATCH /meetings/:id, effects into the store,
 * the error as a toast. Returns the error message (null on success) for callers that keep a dialog open.
 */
export function useMeetingPatch() {
  const { busy, run } = useServerAction();
  const patch = useCallback(async (id: string, body: MeetingPatch, success?: string): Promise<string | null> => {
    const err = await run(() => patchMeeting(id, body));
    if (err) toast.error(err);
    else if (success) toast.success(success);
    return err;
  }, [run]);
  return { busy, patch };
}
