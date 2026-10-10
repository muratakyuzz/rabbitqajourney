import { applyStepCompletion } from "./completion";
import type { MkAudit } from "./flow";
import { applyMeetingHeldRules } from "./rules";
import type { Meeting, RqState, Step } from "./types";

// Meeting rules shared by the API (#8, #19) and the meeting screens (docs/PLAN.md M4).

/**
 * A meeting can only be "Yapıldı" (held) if it has taken place and someone from our side was there:
 * date ≤ today and at least one internal participant. Null when fine or not held.
 */
export function meetingHeldError(m: Pick<Meeting, "status" | "date" | "internalIds">, today: string): { field: "date" | "internalIds"; message: string } | null {
  if (m.status !== "held") return null;
  if (m.date > today) return { field: "date", message: "İleri tarihli toplantı Yapıldı olamaz; durumu Planlandı seçin." };
  if (!m.internalIds.length) return { field: "internalIds", message: "Yapıldı toplantıda en az bir iç katılımcı olmalı." };
  return null;
}

const noAudit: MkAudit = (e) => ({ ...e, id: "", at: "", userId: "" });

/**
 * Steps that saving `meeting` (new, or an existing one with its new values) would complete: the held-meeting
 * rules (Go/No-Go) plus meeting and data step completion, as after a save. For the "Kaydedince tamamlanır" preview.
 */
export function stepsCompletedByMeeting(state: RqState, meeting: Meeting, now: Date = new Date()): Step[] {
  const known = state.meetings.some((m) => m.id === meeting.id);
  let next: RqState = { ...state, meetings: known ? state.meetings.map((m) => (m.id === meeting.id ? meeting : m)) : [...state.meetings, meeting] };
  next = applyMeetingHeldRules(next, meeting, noAudit);
  next = applyStepCompletion(next, meeting.projectId, noAudit, now);
  const before = new Map(state.steps.map((s) => [s.id, s.status]));
  return next.steps.filter((s) => s.projectId === meeting.projectId && s.status === "done" && before.get(s.id) !== "done");
}
