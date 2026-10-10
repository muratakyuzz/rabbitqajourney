import {
  MeetingCreatedSchema, MeetingListSchema, RuleEffectsSchema,
  type MeetingCreate, type MeetingCreated, type MeetingDetail, type MeetingPatch, type RuleEffects,
} from "@rabbitqa/shared";
import { api } from "./client";

// Meetings (docs/PLAN.md M4). Not bridged: every screen that writes a meeting calls these directly.

export const getMeetings = async (projectId: string): Promise<MeetingDetail[]> =>
  (await api(`/projects/${encodeURIComponent(projectId)}/meetings`, { schema: MeetingListSchema })).items;

/** The meeting and its actions in one request; the response carries the new meeting and every rule effect. */
export const createMeeting = (projectId: string, input: MeetingCreate): Promise<MeetingCreated> =>
  api(`/projects/${encodeURIComponent(projectId)}/meetings`, { method: "POST", body: input, schema: MeetingCreatedSchema });

export const patchMeeting = (id: string, patch: MeetingPatch): Promise<RuleEffects> =>
  api(`/meetings/${encodeURIComponent(id)}`, { method: "PATCH", body: patch, schema: RuleEffectsSchema });
