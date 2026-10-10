import type { Action, Meeting, MeetingCreate, MeetingCreated, MeetingList, MeetingPatch } from "@rabbitqa/shared";
import { ballForOwner } from "@rabbitqa/shared/domain/ball";
import { todayISO } from "@rabbitqa/shared/domain/labels";
import { meetingHeldError } from "@rabbitqa/shared/domain/meetings";
import { defaultCustomerVisible } from "@rabbitqa/shared/domain/rule-actions";
import { applyMeetingHeldRules } from "@rabbitqa/shared/domain/rules";
import { uid } from "@rabbitqa/shared/domain/seed";
import type { Db } from "../../db";
import { badRequest, conflict, notFound } from "../../http/errors";
import {
  type Effects, changeProject, loadProjectState, noAudit, projectIdOf, replace, requireReason, setLastReason,
} from "../projects/project-state";

// #8, #19 and the meeting list (docs/PLAN.md M4). Writes go through changeProject with meetingSteps, so the
// meeting, its actions, the held-meeting rules and the meeting-completion steps land in one transaction.
// Rules are the mockup store's (addMeeting / updateMeeting) unless noted in docs/PLAN.md → "Kararlar".

const unique = (ids: string[]) => [...new Set(ids)];

/** "Yapıldı" needs date ≤ today and an internal participant (shared meetingHeldError). */
function checkHeld(m: Meeting) {
  const err = meetingHeldError(m, todayISO());
  if (err) throw badRequest(err.message, err.field);
}

// ---- GET /projects/:projectId/meetings ----
export async function listMeetings(db: Db, projectId: string): Promise<MeetingList> {
  const loaded = await loadProjectState(db, projectId);
  if (!loaded) throw notFound("Proje bulunamadı.");
  const { meetings, actions } = loaded.state;
  return {
    items: [...meetings]
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
      .map((m) => ({ ...m, actions: actions.filter((a) => a.meetingId === m.id) })),
  };
}

// ---- #8 POST /projects/:projectId/meetings ----
export async function createMeeting(db: Db, projectId: string, input: MeetingCreate): Promise<MeetingCreated> {
  return db.transaction(async (tx) => {
    let meeting: Meeting | null = null;
    const effects = await changeProject(tx, projectId, (s) => {
      const m: Meeting = {
        id: uid("m"), projectId, type: input.type, date: input.date, status: input.status,
        internalIds: unique(input.internalIds), contactIds: unique(input.contactIds),
        notes: input.notes, decisions: input.decisions, isCustomerVisible: input.isCustomerVisible ?? false,
        ...(input.teamId != null ? { teamId: input.teamId } : {}),
        ...(input.training ? { training: input.training } : {}),
      };
      checkHeld(m);
      const now = new Date().toISOString();
      const actions = input.actions.map((a, i): Action => {
        const title = a.title.trim();
        if (!title) throw badRequest("Aksiyon başlığı boş olamaz.", `actions.${i}.title`);
        return {
          id: uid("a"), projectId, title, ownerId: a.ownerId, ball: ballForOwner(a.ownerId, s.users, a.ball),
          due: a.due, priority: a.priority, status: a.status, source: "meeting", meetingId: m.id, createdAt: now,
          isCustomerVisible: a.isCustomerVisible ?? defaultCustomerVisible(),
        };
      });
      meeting = m;
      const next = { ...s, meetings: [...s.meetings, m], actions: [...s.actions, ...actions] };
      return applyMeetingHeldRules(next, m, noAudit);
    }, { meetingSteps: true });
    return { ...effects, meeting: meeting! };
  });
}

// ---- #19 PATCH /meetings/:id ----
export async function updateMeeting(db: Db, id: string, { reason, ...patch }: MeetingPatch): Promise<Effects> {
  return db.transaction(async (tx) => {
    const projectId = await projectIdOf(tx, "meetings", id, "Toplantı bulunamadı.");
    const effects = await changeProject(tx, projectId, (s) => {
      const old = s.meetings.find((x) => x.id === id)!;
      const statusChanged = patch.status !== undefined && patch.status !== old.status;
      if (statusChanged) {
        if (old.status !== "planned") throw conflict("Yalnızca Planlandı toplantının durumu değiştirilebilir");
        if (patch.status === "cancelled") requireReason(reason);
      }
      const typeChanged = patch.type !== undefined && patch.type !== old.type;
      const dateChanged = patch.date !== undefined && patch.date !== old.date;
      if (old.status === "held" && (typeChanged || dateChanged)) requireReason(reason);

      const next: Meeting = { ...old };
      for (const k of ["type", "date", "status", "notes", "decisions", "isCustomerVisible", "training"] as const) {
        if (patch[k] !== undefined) Object.assign(next, { [k]: patch[k] });
      }
      if (patch.internalIds) next.internalIds = unique(patch.internalIds);
      if (patch.contactIds) next.contactIds = unique(patch.contactIds);
      if (patch.teamId !== undefined) {
        if (patch.teamId === null) delete next.teamId;
        else next.teamId = patch.teamId;
      }
      // the held checks run when something they look at changes, so old meetings stay editable
      if (statusChanged || dateChanged || patch.internalIds) checkHeld(next);

      const changed = { ...s, meetings: replace(s.meetings, next) };
      // held-meeting rules run on the planned → held transition only (API_CONTRACT #19)
      return statusChanged && next.status === "held" ? applyMeetingHeldRules(changed, next, noAudit) : changed;
    }, { meetingSteps: true });
    await setLastReason(tx, "meetings", id, reason?.trim());
    return effects;
  });
}
