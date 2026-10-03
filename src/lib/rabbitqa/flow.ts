import { addBusinessDays, businessDaysBetween, holidayDates } from "./business-days";
import { uid } from "./seed";
import type { Action, AuditEntry, Phase, RqState, Step } from "./types";

export type MkAudit = (e: Omit<AuditEntry, "id" | "at" | "userId">) => AuditEntry;

export const isOpenStep = (s: { status: string }) => s.status === "pending" || s.status === "in_progress";
export const isPassed = (x: { status: string }) => x.status === "done" || x.status === "out_of_scope";
export const isActivePhase = (p: Phase) => p.status !== "locked" && !isPassed(p);

const localISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const approvalKey = (phaseId: string) => `phase_approval:${phaseId}`;

/** Aynı aşamada, kendinden önceki ve kapsam dışı olmayan en yakın adım. */
export function previousStep(steps: Step[], step: Step) {
  return steps
    .filter((x) => x.phaseId === step.phaseId && x.id !== step.id && x.status !== "out_of_scope" && x.order < step.order)
    .sort((a, b) => b.order - a.order)[0] ?? null;
}

/** Bir tur: aşama aktifleştirme → adım aktifleştirme → onay aksiyonu. Değişiklik yoksa aynı state'i döner. */
function pass(s: RqState, projectId: string, mk: MkAudit, now: Date): RqState {
  const nowIso = now.toISOString();
  const today = localISO(now);
  const project = s.projects.find((p) => p.id === projectId);
  if (!project) return s;
  const audit: AuditEntry[] = [];
  const hol = holidayDates(s.holidays);
  let changed = false;

  // a) aşamalar
  const sorted = s.phases.filter((p) => p.projectId === projectId).sort((a, b) => a.order - b.order);
  const phaseUpd = new Map<string, Phase>();
  sorted.forEach((ph, i) => {
    if (ph.status !== "locked") return;
    const prev = sorted[i - 1];
    if (!prev || ph.dependency === "independent" || isPassed(prev)) {
      phaseUpd.set(ph.id, { ...ph, status: "in_progress", activatedAt: nowIso, actualStart: ph.actualStart ?? today });
      audit.push(mk({ projectId, kind: "update", entity: "phase", entityId: ph.id, label: `${ph.code} ${ph.name}`, field: "status", oldValue: "locked", newValue: "in_progress", reason: "Otomatik kural: akış — aşama aktifleşti" }));
    }
  });
  let phases = s.phases;
  if (phaseUpd.size) { phases = phases.map((p) => phaseUpd.get(p.id) ?? p); changed = true; }

  // b) adımlar
  const projPhases = phases.filter((p) => p.projectId === projectId);
  const activeIds = new Set(projPhases.filter(isActivePhase).map((p) => p.id));
  const projSteps = s.steps.filter((x) => x.projectId === projectId);
  const stepUpd = new Map<string, Step>();
  const base = project.startDate > today ? project.startDate : today;
  projSteps.forEach((st) => {
    if (st.status !== "locked" || !activeIds.has(st.phaseId)) return;
    let reason: string | null = null;
    if (st.dependency === "independent") reason = "Otomatik kural: akış — bağımsız adım";
    else {
      const prev = previousStep(projSteps, st);
      if (!prev) reason = "Otomatik kural: akış — aşama aktifleşti";
      else if (prev.status === "done") reason = `Otomatik kural: akış — önceki adım tamamlandı (${prev.title})`;
    }
    if (!reason) return;
    const due = addBusinessDays(base, st.durationDays || 1, hol);
    stepUpd.set(st.id, { ...st, status: "pending", activatedAt: nowIso, ballSince: nowIso, due });
    audit.push(mk({ projectId, kind: "update", entity: "step", entityId: st.id, label: st.title, field: "status", oldValue: "locked", newValue: "pending", reason }));
    audit.push(mk({ projectId, kind: "update", entity: "step", entityId: st.id, label: st.title, field: "due", oldValue: st.due ?? "", newValue: due, reason }));
  });
  let steps = s.steps;
  if (stepUpd.size) { steps = steps.map((x) => stepUpd.get(x.id) ?? x); changed = true; }

  // c) aşama onayı aksiyonları
  let actions = s.actions;
  const newActions: Action[] = [];
  projPhases.forEach((ph) => {
    const key = approvalKey(ph.id);
    const open = actions.find((a) => a.projectId === projectId && a.ruleKey === key && (a.status === "open" || a.status === "in_progress"));
    const req = steps.filter((x) => x.phaseId === ph.id && x.required);
    const ready = isActivePhase(ph) && req.every(isPassed);
    const close = (status: "done" | "cancelled", reason: string) => {
      if (!open) return;
      actions = actions.map((a) => (a.id === open.id ? { ...a, status } : a));
      audit.push(mk({ projectId, kind: "update", entity: "action", entityId: open.id, label: open.title, field: "status", oldValue: open.status, newValue: status, reason }));
      changed = true;
    };
    if (ph.status === "done") close("done", "Otomatik kural: akış — aşama onaylandı");
    else if (isActivePhase(ph) && !ready) close("cancelled", "Otomatik kural: akış — zorunlu adım tekrar açıldı");
    else if (ready && !open) {
      const a: Action = {
        id: uid("a"), projectId, title: `Aşama onayı bekliyor: ${ph.code} ${ph.name}`, ownerId: project.csmId, ball: "csm",
        due: addBusinessDays(today, 2, hol), priority: "medium", status: "open", source: "rule", meetingId: null, createdAt: nowIso, ruleKey: key,
      };
      newActions.push(a);
      audit.push(mk({ projectId, kind: "create", entity: "action", entityId: a.id, label: `${a.title} — aksiyon açıldı`, reason: "Otomatik kural: akış — zorunlu adımlar tamamlandı" }));
      changed = true;
    }
  });
  if (newActions.length) actions = [...actions, ...newActions];

  if (!changed) return s;
  return { ...s, phases, steps, actions, audit: [...s.audit, ...audit] };
}

/** İdempotent akış motoru: değişiklik kalmayana kadar tekrarlar. */
export function advanceFlow(state: RqState, projectId: string, mk: MkAudit, now: Date = new Date()): RqState {
  let cur = state;
  for (let i = 0; i < 100; i++) {
    const next = pass(cur, projectId, mk, now);
    if (next === cur) break;
    cur = next;
  }
  return cur;
}

export function advanceAll(state: RqState, mk: MkAudit, now: Date = new Date()): RqState {
  return state.projects.reduce((s, p) => advanceFlow(s, p.id, mk, now), state);
}

export interface PlanPhaseIn { id: string; order: number; dependency: string }
export interface PlanStepIn { id: string; phaseId: string; order: number; dependency: string; durationDays: number; status: string }

/** Tahmini plan tarihleri. */
export function projectPlan(phases: PlanPhaseIn[], steps: PlanStepIn[], startDate: string) {
  const phaseDates: Record<string, { start: string; end: string; days: number }> = {};
  const stepDates: Record<string, { start: string; end: string }> = {};
  let prevEnd: string | null = null;
  [...phases].sort((a, b) => a.order - b.order).forEach((ph, i) => {
    const start: string = i === 0 || ph.dependency === "independent" || !prevEnd ? startDate : prevEnd;
    const ps = steps.filter((x) => x.phaseId === ph.id && x.status !== "out_of_scope").sort((a, b) => a.order - b.order);
    let last: string | null = null;
    let end = start;
    ps.forEach((st) => {
      const sStart = st.dependency === "independent" ? start : last ?? start;
      const sEnd = addBusinessDays(sStart, st.durationDays || 1);
      stepDates[st.id] = { start: sStart, end: sEnd };
      last = sEnd;
      if (sEnd > end) end = sEnd;
    });
    if (!ps.length) end = addBusinessDays(start, 5);
    phaseDates[ph.id] = { start, end, days: businessDaysBetween(start, end) };
    prevEnd = end;
  });
  return { phases: phaseDates, steps: stepDates };
}
