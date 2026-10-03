import { businessDaysBetween, holidayDates } from "./business-days";
import { isActivePhase, isOpenStep, isPassed } from "./flow";
import type { AlertState, AlertStateStatus, AlertType, ComputedAlert, Phase, PhaseStatus, RqState } from "./types";

export const DEFAULT_THRESHOLDS = { phaseRiskDays: 3, dueSoonDays: 2, customerWaitDays: 5, customerWaitRedDays: 10, reqDocDays: 2, goLiveCommitDays: 5, credentialDays: 7, silentDays: 10 };

const fmt = (d: string) => d.slice(0, 10).split("-").reverse().join(".");
const calDays = (a: string, b: string) => Math.round((new Date(b.slice(0, 10) + "T00:00:00Z").getTime() - new Date(a.slice(0, 10) + "T00:00:00Z").getTime()) / 86400000);

/** Haftanın pazartesisi (yerel tarih). */
export function weekStartOf(todayISO: string) {
  const d = new Date(todayISO + "T00:00:00Z");
  const wd = (d.getUTCDay() + 6) % 7;
  return new Date(d.getTime() - wd * 86400000).toISOString().slice(0, 10);
}

/** State'ten uyarı hesaplar. Kilitli adım/aşamalar hiçbir uyarı üretmez. */
export function computeAlerts(state: RqState, today: string): ComputedAlert[] {
  const t = { ...DEFAULT_THRESHOLDS, ...(state.alertThresholds ?? {}) };
  const hol = holidayDates(state.holidays);
  const bd = (a: string, b: string) => businessDaysBetween(a, b, hol);
  const out: ComputedAlert[] = [];
  const push = (a: Omit<ComputedAlert, "key">) => out.push({ ...a, key: `${a.type}:${a.entityId}` });

  state.projects.forEach((p) => {
    const pid = p.id;
    const phases = state.phases.filter((x) => x.projectId === pid);
    const steps = state.steps.filter((x) => x.projectId === pid);
    const goLive = phases.find((x) => x.code === "07");
    const goLiveDone = goLive?.status === "done";
    const csm = p.csmId;

    // 1–2 aşama
    phases.forEach((ph) => {
      if (!isActivePhase(ph) || !ph.planEnd) return;
      if (ph.planEnd < today) {
        push({ type: "phase_late", level: "red", projectId: pid, entity: "phase", entityId: ph.id, ownerId: csm, title: `Aşama gecikti: ${ph.code} ${ph.name}`, detail: `Plan bitişi ${fmt(ph.planEnd)} idi; ${bd(ph.planEnd, today)} iş günü geçti.` });
        return;
      }
      const req = steps.filter((s) => s.phaseId === ph.id && s.required && s.status !== "out_of_scope");
      const done = req.filter((s) => s.status === "done").length;
      const left = bd(today, ph.planEnd);
      if (req.length && left <= t.phaseRiskDays && done * 2 < req.length) {
        push({ type: "phase_at_risk", level: "yellow", projectId: pid, entity: "phase", entityId: ph.id, ownerId: csm, title: `Aşama risk altında: ${ph.code} ${ph.name}`, detail: `Plan bitişine ${left} iş günü kaldı; zorunlu adımların ${done}/${req.length} tanesi tamam.` });
      }
    });

    // 3–5 adım ve aksiyon
    const items = [
      ...steps.filter(isOpenStep).map((s) => ({ entity: "step" as const, id: s.id, title: s.title, due: s.due, ownerId: s.ownerId, kind: "Adım" })),
      ...state.actions.filter((a) => a.projectId === pid && (a.status === "open" || a.status === "in_progress")).map((a) => ({ entity: "action" as const, id: a.id, title: a.title, due: a.due, ownerId: a.ownerId, kind: "Aksiyon" })),
    ];
    items.forEach((it) => {
      if (!it.due) return;
      if (it.due < today) push({ type: "item_late", level: "red", projectId: pid, entity: it.entity, entityId: it.id, ownerId: it.ownerId, title: `${it.kind} gecikti: ${it.title}`, detail: `Termin ${fmt(it.due)}; ${bd(it.due, today)} iş günü gecikti.` });
      else {
        const left = bd(today, it.due);
        if (left <= t.dueSoonDays) push({ type: "action_due_soon", level: "yellow", projectId: pid, entity: it.entity, entityId: it.id, ownerId: it.ownerId, title: `Termin yaklaşıyor: ${it.title}`, detail: `Termin ${fmt(it.due)} (${left === 0 ? "bugün" : `${left} iş günü kaldı`}).` });
      }
    });
    steps.filter((s) => isOpenStep(s) && s.ball === "customer").forEach((s) => {
      const w = bd(s.ballSince.slice(0, 10), today);
      if (w >= t.customerWaitDays) push({ type: "waiting_customer", level: w >= t.customerWaitRedDays ? "red" : "yellow", projectId: pid, entity: "step", entityId: s.id, ownerId: s.ownerId, title: `Müşteride bekleyen adım: ${s.title}`, detail: `Top ${w} iş günüdür müşteride.` });
    });

    // 6 gereksinim dokümanı
    const kickoff = state.meetings.filter((m) => m.projectId === pid && m.type === "kickoff").sort((a, b) => a.date.localeCompare(b.date))[0];
    if (p.installType === "onprem" && !p.reqDocShared && kickoff && bd(kickoff.date, today) >= t.reqDocDays) {
      push({ type: "reqdoc_not_shared", level: "yellow", projectId: pid, entity: "project", entityId: pid, ownerId: csm, title: "Gereksinim dokümanı paylaşılmadı", detail: `Kick-off ${fmt(kickoff.date)} tarihindeydi; On-prem kurulum gereksinim dokümanı hâlâ paylaşılmadı.` });
    }

    // 7 satış devri
    const ph00 = phases.find((x) => x.code === "00");
    if (ph00 && ph00.status !== "locked") {
      const docs = state.documents.filter((d) => d.projectId === pid);
      const miss = [!docs.some((d) => d.type === "offer") && "teklif", !docs.some((d) => d.type === "contract") && "sözleşme"].filter(Boolean);
      if (miss.length) push({ type: "handover_missing", level: "yellow", projectId: pid, entity: "project", entityId: pid, ownerId: csm, title: "Satış devri eksik", detail: `Eksik doküman: ${miss.join(", ")}.` });
    }

    // 8 taahhüt
    state.commitments.filter((c) => c.projectId === pid && c.status === "open").forEach((c) => {
      const target = phases.find((x) => x.code === c.targetPhaseCode);
      const targetDone = target && isPassed(target);
      const glLeft = p.goLiveDate ? bd(today, p.goLiveDate) : 999;
      if (targetDone || glLeft <= t.goLiveCommitDays) {
        push({ type: "open_commitment", level: "red", projectId: pid, entity: "commitment", entityId: c.id, ownerId: csm, title: `Açık taahhüt: ${c.text}`, detail: targetDone ? `Hedef aşama (${target!.code} ${target!.name}) tamamlandı ama taahhüt açık.` : `Go-Live'a ${glLeft} iş günü kala taahhüt açık.` });
      }
    });

    // 9 keşif
    const ph02 = phases.find((x) => x.code === "02");
    if (ph02 && isActivePhase(ph02)) {
      const missing = state.questions.filter((q) => q.required && !(p.discoveryAnswers[q.id] ?? "").trim());
      if (missing.length) push({ type: "discovery_missing", level: "yellow", projectId: pid, entity: "project", entityId: pid, ownerId: csm, title: "Keşif eksik", detail: `${missing.length} zorunlu keşif sorusu cevapsız.` });
    }

    // 10 KPI
    state.kpis.filter((k) => k.projectId === pid && (k.baseline === null || k.target === null)).forEach((k) => {
      push({ type: "kpi_unmeasurable", level: "yellow", projectId: pid, entity: "kpi", entityId: k.id, ownerId: csm, title: `KPI ölçülemez: ${k.name}`, detail: `${k.baseline === null ? "Başlangıç" : "Hedef"} değeri girilmedi.` });
    });

    // 11 lisans
    const extra = p.desiredModules.filter((m) => !p.purchasedModules.includes(m));
    if (extra.length) push({ type: "license_mismatch", level: "yellow", projectId: pid, entity: "project", entityId: pid, ownerId: csm, title: "Lisans uyumsuzluğu", detail: `Satın alınmayan istenen modüller: ${extra.join(", ")}.` });

    // 12 erişim bilgisi
    state.credentials.filter((c) => c.projectId === pid && c.validUntil).forEach((c) => {
      const left = calDays(today, c.validUntil!);
      if (left <= t.credentialDays) push({ type: "credential_expiring", level: "yellow", projectId: pid, entity: "credential", entityId: c.id, ownerId: csm, title: `Erişim bilgisi süresi doluyor: ${c.type} / ${c.provider}`, detail: left < 0 ? `Geçerlilik ${fmt(c.validUntil!)} tarihinde doldu.` : `Geçerlilik ${fmt(c.validUntil!)} (${left} gün kaldı).` });
    });

    // 13 haftalık rapor
    const wd = new Date(today + "T00:00:00Z").getUTCDay();
    if (!goLiveDone && (wd === 5 || wd === 6 || wd === 0)) {
      const ws = weekStartOf(today);
      if (!(state.customerReports ?? []).some((r) => r.projectId === pid && r.weekStart === ws && r.status === "sent")) {
        push({ type: "report_not_sent", level: "yellow", projectId: pid, entity: "project", entityId: `${pid}:${ws}`, ownerId: csm, title: "Haftalık rapor gönderilmedi", detail: `${fmt(ws)} haftasının müşteri raporu "Gönderildi" olarak işaretlenmedi.` });
      }
    }

    // 14 sessiz proje
    if (!goLiveDone) {
      const last = state.audit.filter((a) => a.projectId === pid).reduce((m, a) => (a.at > m ? a.at : m), p.createdAt);
      const silent = bd(last.slice(0, 10), today);
      if (silent >= t.silentDays) push({ type: "silent_project", level: "yellow", projectId: pid, entity: "project", entityId: pid, ownerId: csm, title: "Sessiz proje", detail: `${silent} iş günüdür hiçbir kayıt yok (son hareket ${fmt(last)}).` });
    }
  });
  return out;
}

export interface AlertView extends ComputedAlert { manual: boolean; createdAt: string | null; status: AlertStateStatus; state: AlertState | null }

export function resolveStatus(st: AlertState | null | undefined, today: string): AlertStateStatus {
  if (!st) return "open";
  if (st.status === "closed") return "closed";
  if (st.status === "snoozed" && st.snoozedUntil && st.snoozedUntil > today) return "snoozed";
  return "open";
}

/** Hesaplanan + elle eklenen uyarılar, durumlarıyla birlikte. */
export function allAlerts(state: RqState, today: string): AlertView[] {
  const stMap = new Map<string, AlertState>();
  (state.alertStates ?? []).forEach((s) => stMap.set(s.key, s));
  const computed: AlertView[] = computeAlerts(state, today).map((a) => {
    const st = stMap.get(a.key) ?? null;
    return { ...a, manual: false, createdAt: null, state: st, status: resolveStatus(st, today) };
  });
  const manual: AlertView[] = state.alerts.map((a) => {
    const key = `manual:${a.id}`;
    const st = stMap.get(key) ?? null;
    const project = state.projects.find((p) => p.id === a.projectId);
    return {
      key, type: "manual" as AlertType, level: a.severity === "critical" ? "red" : "yellow", projectId: a.projectId, entity: "project", entityId: a.id,
      ownerId: project?.csmId ?? null, title: a.title, detail: a.detail, manual: true, createdAt: a.createdAt, state: st,
      status: a.status === "resolved" ? "closed" : resolveStatus(st, today),
    };
  });
  return [...computed, ...manual];
}

/** Aktif, tamamlanmamış aşamanın görünen durumu uyarılardan türetilir. */
export function derivePhaseStatus(ph: Phase, computed: ComputedAlert[]): PhaseStatus {
  if (!isActivePhase(ph) || ph.status === "not_started") return ph.status;
  if (computed.some((a) => a.type === "phase_late" && a.entityId === ph.id)) return "late";
  if (computed.some((a) => a.type === "phase_at_risk" && a.entityId === ph.id)) return "at_risk";
  return "in_progress";
}
