import type { ComponentType } from "react";
import type { AuthUser } from "@/lib/auth-api";
import { latestHeldMeeting, stepConditionResult } from "@/lib/rabbitqa/completion";
import { canSeeCredentials } from "@/lib/rabbitqa/perm";
import type { MeetingType, Phase, Project, RqState, Step } from "@/lib/rabbitqa/types";
import { HandoverWorkspace } from "./HandoverWorkspace";
import { DiscoveryWorkspace } from "./DiscoveryWorkspace";
import { AccessWorkspace } from "./AccessWorkspace";
import { TrainingWorkspace } from "./TrainingWorkspace";
import { AdaptationWorkspace } from "./AdaptationWorkspace";

export interface WorkspaceProps { project: Project; phase: Phase; readOnly: boolean; csmEditable: boolean }

export const PHASE_WORKSPACES: Partial<Record<string, ComponentType<WorkspaceProps>>> = {
  "00": HandoverWorkspace,
  "02": DiscoveryWorkspace,
  "03": AccessWorkspace,
  "04": TrainingWorkspace,
  "05": AdaptationWorkspace,
};

/** Çalışma alanı var mı ve kullanıcı görebilir mi (03 yalnızca canSeeCredentials). */
export function workspaceAvailable(code: string, user: AuthUser | null, project: Project): boolean {
  if (!PHASE_WORKSPACES[code]) return false;
  if (code === "03") return canSeeCredentials(user, project);
  return true;
}

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
