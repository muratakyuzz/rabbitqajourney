import { addBusinessDays, holidayDates } from "./business-days";
import { advanceFlow, type MkAudit } from "./flow";
import { ADAPTATION_ITEM_LABEL, MEETING_TYPE_LABEL } from "./labels";
import type { AdaptationItem, AuditEntry, Meeting, MeetingType, RqState, Step, StepStatus } from "./types";

export type { MkAudit };

export interface ConditionCheck { field: string; label: string; met: boolean }
export interface ConditionResult { met: boolean; missing: { field: string; label: string }[]; checks: ConditionCheck[] }
export interface StepCondition { label: string; check(state: RqState, projectId: string): ConditionResult }

const localISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function fromChecks(checks: ConditionCheck[]): ConditionResult {
  return { met: checks.every((c) => c.met), missing: checks.filter((c) => !c.met).map((c) => ({ field: c.field, label: c.label })), checks };
}

export const STEP_CONDITIONS: Record<string, StepCondition> = {
  csm: {
    label: "CSM ataması",
    check: (state, projectId) => {
      const p = state.projects.find((x) => x.id === projectId);
      return fromChecks([{ field: "csmId", label: "CSM", met: !!p && p.csmId !== null }]);
    },
  },
  sales_license: {
    label: "Satışçı ve lisans modeli",
    check: (state, projectId) => {
      const p = state.projects.find((x) => x.id === projectId);
      return fromChecks([
        { field: "salespersonId", label: "Satışçı", met: !!p && p.salespersonId !== null },
        { field: "licenseModel", label: "Lisans modeli", met: !!p && p.licenseModel.trim() !== "" },
      ]);
    },
  },
  modules: {
    label: "Satın alınan modüller",
    check: (state, projectId) => {
      const p = state.projects.find((x) => x.id === projectId);
      return fromChecks([{ field: "purchasedModules", label: "Satın alınan modül", met: !!p && p.purchasedModules.length > 0 }]);
    },
  },
  commitments: {
    label: "Taahhütler",
    check: (state, projectId) => {
      const p = state.projects.find((x) => x.id === projectId);
      const has = state.commitments.some((c) => c.projectId === projectId);
      return fromChecks([{ field: "commitments", label: "Taahhüt veya 'Taahhüt yok'", met: has || !!p?.noCommitments }]);
    },
  },
  install_llm: {
    label: "Kurulum tipi ve LLM tercihi",
    check: (state, projectId) => {
      const p = state.projects.find((x) => x.id === projectId);
      return fromChecks([
        { field: "installType", label: "Kurulum tipi", met: !!p && p.installType !== null },
        { field: "llmChoice", label: "LLM tercihi", met: !!p && p.llmChoice !== null },
      ]);
    },
  },
  offer: {
    label: "Teklif dokümanı",
    check: (state, projectId) => fromChecks([{ field: "doc:offer", label: "Teklif dokümanı", met: state.documents.some((d) => d.projectId === projectId && d.type === "offer") }]),
  },
  contract: {
    label: "Sözleşme",
    check: (state, projectId) => fromChecks([{ field: "doc:contract", label: "Sözleşme dokümanı", met: state.documents.some((d) => d.projectId === projectId && d.type === "contract") }]),
  },
  reqdoc: {
    label: "Kurulum gereksinim dokümanı",
    check: (state, projectId) => fromChecks([{ field: "doc:req_doc", label: "Kurulum gereksinim dokümanı", met: state.documents.some((d) => d.projectId === projectId && d.type === "req_doc") }]),
  },
  discovery_form: {
    label: "Keşif formu",
    check: (state, projectId) => {
      const p = state.projects.find((x) => x.id === projectId);
      const required = state.questions.filter((q) => q.required);
      if (!required.length) return fromChecks([{ field: "discovery", label: "Keşif formu", met: true }]);
      return fromChecks(required.map((q) => ({ field: `discovery:${q.id}`, label: q.text, met: !!p && (p.discoveryAnswers[q.id] ?? "").trim() !== "" })));
    },
  },
  teams: {
    label: "Takım listesi",
    check: (state, projectId) => {
      const p = state.projects.find((x) => x.id === projectId);
      return fromChecks([{ field: "teams", label: "Takım", met: !!p && p.teams.length > 0 }]);
    },
  },
  kpi: {
    label: "KPI tanımı",
    check: (state, projectId) => fromChecks([{ field: "kpis", label: "Başlangıç ve hedef değeri dolu KPI", met: state.kpis.some((k) => k.projectId === projectId && k.baseline !== null && k.target !== null) }]),
  },
  vpn_info: {
    label: "VPN erişim bilgisi",
    check: (state, projectId) => fromChecks([{ field: "credential:vpn", label: "VPN erişim bilgisi", met: state.credentials.some((c) => c.projectId === projectId && c.type.trim().toLowerCase() === "vpn") }]),
  },
  training_plan: {
    label: "Eğitim session'larının planlanması",
    check: (state, projectId) => fromChecks([{
      field: "training:sessions", label: "Planlanmış veya yapılmış Eğitim toplantısı",
      met: state.meetings.some((m) => m.projectId === projectId && m.type === "training" && m.status !== "cancelled"),
    }]),
  },
  training_done: {
    label: "Eğitim session'larının yapılması",
    check: (state, projectId) => {
      const sessions = state.meetings.filter((m) => m.projectId === projectId && m.type === "training" && m.status !== "cancelled");
      return fromChecks([
        { field: "training:sessions", label: "En az bir Eğitim toplantısı", met: sessions.length > 0 },
        { field: "training:pending", label: "Tüm Eğitim toplantıları Yapıldı", met: sessions.length > 0 && sessions.every((m) => m.status === "held") },
      ]);
    },
  },
};

/** Takım (veya genel, teamId null) için Uyarlama kontrol listesi koşulu. */
export function adaptationCondition(state: RqState, projectId: string, teamId: string | null): ConditionResult {
  const rec = state.adaptations.find((a) => a.projectId === projectId && a.teamId === teamId);
  const items: AdaptationItem[] = ["projectCreated", "docsIdentified", "docsUploaded", "aiTrained", "firstSamples"];
  const suffix = teamId ?? "general";
  return fromChecks(items.map((item) => ({
    field: `adapt:${suffix}:${item}`,
    label: ADAPTATION_ITEM_LABEL[item],
    met: rec?.checklist[item] ?? false,
  })));
}

/** STEP_CONDITIONS'ta bulunmayan önekli anahtarlar (adapt:<teamId>) için koşul türetir. */
export function conditionFor(key: string | undefined): StepCondition | undefined {
  if (!key) return undefined;
  const direct = STEP_CONDITIONS[key];
  if (direct) return direct;
  if (key.startsWith("adapt:")) {
    const rest = key.slice(6);
    const teamId = rest === "general" ? null : rest;
    return {
      label: teamId === null ? "Uyarlama kontrol listesi" : `Uyarlama kontrol listesi — ${teamId}`,
      check: (state, projectId) => adaptationCondition(state, projectId, teamId),
    };
  }
  return undefined;
}

function meetingCondition(meetingType: MeetingType, state: RqState, projectId: string): ConditionResult {
  const label = `${MEETING_TYPE_LABEL[meetingType]} toplantısı (Yapıldı)`;
  const met = state.meetings.some((m) => m.projectId === projectId && m.type === meetingType && m.status === "held");
  return fromChecks([{ field: `meeting:${meetingType}`, label, met }]);
}

export function stepConditionResult(state: RqState, step: Step): ConditionResult | null {
  if (step.completion === "manual") return null;
  if (step.completion === "meeting") {
    if (!step.meetingType) return fromChecks([{ field: "unknown", label: "Tanımsız koşul", met: false }]);
    return meetingCondition(step.meetingType, state, step.projectId);
  }
  const cond = conditionFor(step.key);
  if (!cond) return fromChecks([{ field: "unknown", label: "Tanımsız koşul", met: false }]);
  return cond.check(state, step.projectId);
}

/** Bir turda: projectId'nin completion != manual adımlarını koşullarına göre tamamlar / geri açar. Değişiklik yoksa aynı referansı döner. */
export function applyStepCompletion(state: RqState, projectId: string, mk: MkAudit, now: Date = new Date()): RqState {
  const today = localISO(now);
  const hol = holidayDates(state.holidays);
  const phases = new Map(state.phases.filter((p) => p.projectId === projectId).map((p) => [p.id, p]));
  const audit: AuditEntry[] = [];
  const stepUpd = new Map<string, Step>();

  state.steps.filter((s) => s.projectId === projectId && (s.completion === "data" || s.completion === "meeting")).forEach((step) => {
    if (step.status === "out_of_scope") return;
    const phase = phases.get(step.phaseId);
    if (phase && phase.status === "out_of_scope") return;

    const result = stepConditionResult(state, step);
    const met = result?.met ?? false;
    const cond = step.completion === "meeting"
      ? { label: `${step.meetingType ? MEETING_TYPE_LABEL[step.meetingType] : ""} toplantısı kaydedildi` }
      : { label: conditionFor(step.key)?.label ?? "" };

    if (step.status !== "done") {
      if (met) {
        stepUpd.set(step.id, { ...step, status: "done" });
        const reason = step.completion === "meeting"
          ? `Otomatik kural: ${cond.label}`
          : `Otomatik kural: veri tamamlandı — ${cond.label}`;
        audit.push(mk({ projectId, kind: "update", entity: "step", entityId: step.id, label: step.title, field: "status", oldValue: step.status, newValue: "done", reason }));
      }
      return;
    }

    // step.status === "done"
    if (phase && (phase.status === "done" || phase.status === "out_of_scope")) return;
    if (met) return;
    const label = step.completion === "meeting" ? (step.meetingType ? MEETING_TYPE_LABEL[step.meetingType] : "") : conditionFor(step.key)?.label ?? "";
    const reason = step.completion === "meeting"
      ? `Otomatik kural: Yapıldı durumunda ${label} toplantısı kalmadı`
      : `Otomatik kural: veri eksildi — ${label}`;
    if (step.activatedAt) {
      const due = step.due ?? addBusinessDays(today, step.durationDays || 1, hol);
      const next: Step = { ...step, status: "pending", due };
      stepUpd.set(step.id, next);
      audit.push(mk({ projectId, kind: "update", entity: "step", entityId: step.id, label: step.title, field: "status", oldValue: "done", newValue: "pending", reason }));
      if (!step.due) audit.push(mk({ projectId, kind: "update", entity: "step", entityId: step.id, label: step.title, field: "due", oldValue: "", newValue: due, reason }));
    } else {
      stepUpd.set(step.id, { ...step, status: "locked", due: null });
      audit.push(mk({ projectId, kind: "update", entity: "step", entityId: step.id, label: step.title, field: "status", oldValue: "done", newValue: "locked", reason }));
    }
  });

  if (!stepUpd.size) return state;
  return { ...state, steps: state.steps.map((s) => stepUpd.get(s.id) ?? s), audit: [...state.audit, ...audit] };
}

export function settleProject(state: RqState, projectId: string, mk: MkAudit, now: Date = new Date()): RqState {
  let cur = state;
  for (let i = 0; i < 5; i++) {
    const next = advanceFlow(applyStepCompletion(cur, projectId, mk, now), projectId, mk, now);
    if (next === cur) break;
    cur = next;
  }
  return cur;
}

export function settleAll(state: RqState, mk: MkAudit, now: Date = new Date()): RqState {
  return state.projects.reduce((s, p) => settleProject(s, p.id, mk, now), state);
}

export const isAutoStep = (s: Pick<Step, "completion">) => s.completion === "data" || s.completion === "meeting";

export function manualStatusError(step: Step, next: StepStatus | undefined): string | null {
  if (!isAutoStep(step)) return null;
  if (next === undefined || next === step.status) return null;
  if (next === "done") return "Bu adım veriyle tamamlanır";
  if (step.status === "done" && (next === "pending" || next === "in_progress")) return "Bu adım veriyle tamamlanır";
  return null;
}

/** Adımın durumu elle değiştiriliyorsa kilit kurallarını uygular: kilitli adım değiştirilemez, "Sırası gelmedi" elle seçilemez. */
export function stepLockError(step: Step, next: StepStatus | undefined): string | null {
  if (next === undefined || next === step.status) return null;
  if (step.status === "locked") return "Adımın sırası gelmedi; durumu elle değiştirilemez";
  if (next === "locked") return "\"Sırası gelmedi\" elle seçilemez";
  return null;
}

/** Projede, verilen türde en son tarihli "Yapıldı" toplantı. */
export function latestHeldMeeting(state: RqState, projectId: string, type: MeetingType): Meeting | null {
  return state.meetings
    .filter((m) => m.projectId === projectId && m.type === type && m.status === "held")
    .sort((a, b) => b.date.localeCompare(a.date))[0] ?? null;
}
