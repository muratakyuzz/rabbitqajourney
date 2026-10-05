import type { ComponentType } from "react";
import { latestHeldMeeting, stepConditionResult } from "@/lib/rabbitqa/completion";
import type { MeetingType, Phase, Project, RqState, Step } from "@/lib/rabbitqa/types";
import { HandoverWorkspace } from "./HandoverWorkspace";

export interface WorkspaceProps { project: Project; phase: Phase; readOnly: boolean; csmEditable: boolean }

export const PHASE_WORKSPACES: Partial<Record<string, ComponentType<WorkspaceProps>>> = { "00": HandoverWorkspace };

export type StepClickTarget =
  | { kind: "workspace"; field: string | null }
  | { kind: "meeting_form"; type: MeetingType }
  | { kind: "meeting_detail"; meetingId: string }
  | { kind: "step_dialog" }
  | { kind: "none" };

/** Saf karar fonksiyonu — adım satırına tıklayınca ne açılacağını belirler (plan §6.3). */
export function stepClickTarget(state: RqState, step: Step, ctx: { hasWorkspace: boolean; canManage: boolean; canEdit: boolean }): StepClickTarget {
  const { hasWorkspace, canManage, canEdit } = ctx;
  const notOutOfScope = step.status !== "out_of_scope";

  if (step.completion === "data") {
    if (hasWorkspace) {
      if (step.status === "done" || !notOutOfScope) return { kind: "workspace", field: null };
      const result = stepConditionResult(state, step);
      return { kind: "workspace", field: result?.missing[0]?.field ?? null };
    }
    return canEdit ? { kind: "step_dialog" } : { kind: "none" };
  }

  if (step.completion === "meeting") {
    const type = step.meetingType!;
    if (step.status === "out_of_scope") return canEdit ? { kind: "step_dialog" } : { kind: "none" };
    if (step.status === "done") {
      const held = latestHeldMeeting(state, step.projectId, type);
      if (held) return { kind: "meeting_detail", meetingId: held.id };
      return canEdit ? { kind: "step_dialog" } : { kind: "none" };
    }
    // open or locked, not out_of_scope
    return canManage ? { kind: "meeting_form", type } : { kind: "none" };
  }

  // manual
  return canEdit ? { kind: "step_dialog" } : { kind: "none" };
}
