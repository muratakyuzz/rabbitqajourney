import { addBusinessDays, businessDaysBetween } from "./business-days";
import { isOpenStep } from "./flow";
import type { Health, RqState } from "./types";

/** Müşteri raporunda dondurulan veri. Yalnızca isCustomerVisible kayıtlar; iç sağlık gerekçesi yok. */
export interface ReportSnapshot {
  customerName: string;
  projectName: string;
  weekStart: string;
  weekEnd: string;
  health: Health;
  goLiveDate: string;
  csmName: string;
  phases: { code: string; name: string; planStart: string | null; planEnd: string | null; actualStart: string | null; actualEnd: string | null; status: string }[];
  completed: { title: string; date: string }[];
  actionsVirgosol: { title: string; owner: string; due: string | null }[];
  actionsCustomer: { title: string; owner: string; due: string | null }[];
  expected: { title: string; waitingDays: number; due: string | null }[];
  risks: { title: string; impact: string; mitigation: string }[];
  decisions: { title: string; date: string | null }[];
  kpis: { name: string; unit: string; target: number | null; current: number | null }[];
}

const nm = (s: RqState, id: string | null) => (id ? s.users.find((u) => u.id === id)?.name ?? s.contacts.find((c) => c.id === id)?.name ?? "—" : "—");

export function buildReportSnapshot(state: RqState, projectId: string, weekStart: string, today: string): ReportSnapshot {
  const p = state.projects.find((x) => x.id === projectId)!;
  const weekEnd = addBusinessDays(weekStart, 4);
  const inWeek = (d: string | null | undefined) => !!d && d.slice(0, 10) >= weekStart && d.slice(0, 10) <= weekEnd;
  const phases = state.phases.filter((x) => x.projectId === projectId).sort((a, b) => a.order - b.order);
  const stepTitle = new Map(state.steps.map((s) => [s.id, s.title]));
  const visActions = state.actions.filter((a) => a.projectId === projectId && a.isCustomerVisible !== false && !(a.ruleKey ?? "").startsWith("phase_approval:"));
  const completed = [
    ...state.audit.filter((a) => a.projectId === projectId && a.entity === "step" && a.field === "status" && a.newValue === "done" && inWeek(a.at))
      .map((a) => ({ title: stepTitle.get(a.entityId) ?? a.label, date: a.at.slice(0, 10) })),
    ...state.audit.filter((a) => a.projectId === projectId && a.entity === "action" && a.field === "status" && a.newValue === "done" && inWeek(a.at) && visActions.some((v) => v.id === a.entityId))
      .map((a) => ({ title: a.label, date: a.at.slice(0, 10) })),
  ];
  const open = visActions.filter((a) => a.status === "open" || a.status === "in_progress");
  const row = (a: (typeof open)[number]) => ({ title: a.title, owner: nm(state, a.ownerId), due: a.due });
  const until = today < weekEnd ? today : weekEnd;
  return {
    customerName: p.customerName, projectName: p.name, weekStart, weekEnd, health: p.health, goLiveDate: p.goLiveDate, csmName: nm(state, p.csmId),
    phases: phases.map((x) => ({ code: x.code, name: x.name, planStart: x.planStart, planEnd: x.planEnd, actualStart: x.actualStart, actualEnd: x.actualEnd, status: x.status })),
    completed,
    actionsVirgosol: open.filter((a) => a.ball !== "customer").map(row),
    actionsCustomer: open.filter((a) => a.ball === "customer").map(row),
    expected: state.steps.filter((s) => s.projectId === projectId && isOpenStep(s) && s.ball === "customer")
      .map((s) => ({ title: s.title, waitingDays: Math.max(0, businessDaysBetween(s.ballSince.slice(0, 10), until)), due: s.due })),
    risks: state.risks.filter((r) => r.projectId === projectId && r.kind === "risk" && r.status === "open" && r.isCustomerVisible)
      .map((r) => ({ title: r.title, impact: r.impact, mitigation: r.mitigation })),
    decisions: state.risks.filter((r) => r.projectId === projectId && r.kind === "decision" && r.isCustomerVisible && inWeek(r.decidedAt ?? r.createdAt))
      .map((r) => ({ title: r.title, date: r.decidedAt })),
    kpis: state.kpis.filter((k) => k.projectId === projectId && k.isCustomerVisible !== false)
      .map((k) => ({ name: k.name, unit: k.unit, target: k.target, current: k.measurements.at(-1)?.value ?? k.baseline })),
  };
}

export function defaultNextWeek(snap: ReportSnapshot) {
  const items = [...snap.actionsVirgosol, ...snap.actionsCustomer].slice(0, 5).map((a) => `• ${a.title}`);
  return items.length ? items.join("\n") : "• Planlanan çalışmaların sürdürülmesi";
}
