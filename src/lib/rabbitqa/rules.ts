import { addBusinessDays, holidayDates } from "./business-days";
import type { MkAudit } from "./flow";
import { todayISO } from "./labels";
import { uid } from "./seed";
import type { Action, AuditEntry, InstallType, LlmChoice, Meeting, Phase, Project, RqState, Step } from "./types";

export type { MkAudit };

const ONPREM_KEYS = ["reqdoc", "vpn_req", "vpn_info", "servers", "devops_handover"];

function devopsId(s: RqState) {
  return s.users.find((u) => u.role === "devops")?.id ?? null;
}

function phaseOf(s: RqState, step: Step): Phase | undefined {
  return s.phases.find((p) => p.id === step.phaseId);
}

/** RUL-05 Seçenek A: step'in aşaması `done` iken aksiyon açar, idempotent. ruleKey = rule_review:<stepId>. */
export function ensureReviewAction(s: RqState, projectId: string, step: Step, mk: MkAudit, reason: string): RqState {
  const ruleKey = `rule_review:${step.id}`;
  const open = s.actions.find((a) => a.projectId === projectId && a.ruleKey === ruleKey && (a.status === "open" || a.status === "in_progress"));
  if (open) return s;
  const project = s.projects.find((p) => p.id === projectId);
  const title = `Gözden geçir: ${step.title} — ${reason}`;
  const due = addBusinessDays(todayISO(), 2, holidayDates(s.holidays));
  const cancelled = [...s.actions].reverse().find((a) => a.projectId === projectId && a.ruleKey === ruleKey && a.status === "cancelled");
  if (cancelled) {
    const audit: AuditEntry[] = [];
    const changes: Partial<Action> = { status: "open", due, ownerId: project?.csmId ?? null, title };
    (Object.keys(changes) as (keyof Action)[]).forEach((k) => {
      if (String(cancelled[k] ?? "") !== String(changes[k] ?? "")) {
        audit.push(mk({ projectId, kind: "update", entity: "action", entityId: cancelled.id, label: title, field: k, oldValue: String(cancelled[k] ?? ""), newValue: String(changes[k] ?? ""), reason: `Otomatik kural: ${reason}` }));
      }
    });
    if (!audit.length) return s;
    return { ...s, actions: s.actions.map((a) => (a.id === cancelled.id ? { ...a, ...changes } : a)), audit: [...s.audit, ...audit] };
  }
  const a: Action = {
    id: uid("a"), projectId, title, ownerId: project?.csmId ?? null, ball: "csm", due, priority: "medium",
    status: "open", source: "rule", meetingId: null, createdAt: new Date().toISOString(), ruleKey, isCustomerVisible: false,
  };
  return {
    ...s,
    actions: [...s.actions, a],
    audit: [...s.audit, mk({ projectId, kind: "create", entity: "action", entityId: a.id, label: `${title} — aksiyon açıldı`, reason: `Otomatik kural: ${reason}` })],
  };
}

/** RUL-05: ters seçimde açık aksiyonu iptal eder. `done` aksiyona dokunmaz. */
export function cancelReviewAction(s: RqState, projectId: string, stepId: string, mk: MkAudit, reason: string): RqState {
  const ruleKey = `rule_review:${stepId}`;
  const open = s.actions.find((a) => a.projectId === projectId && a.ruleKey === ruleKey && (a.status === "open" || a.status === "in_progress"));
  if (!open) return s;
  return {
    ...s,
    actions: s.actions.map((a) => (a.id === open.id ? { ...a, status: "cancelled" as const } : a)),
    audit: [...s.audit, mk({ projectId, kind: "update", entity: "action", entityId: open.id, label: open.title, field: "status", oldValue: open.status, newValue: "cancelled", reason: `Otomatik kural: ${reason}` })],
  };
}

/** Changes a step (found by key) and logs one audit entry per changed field. */
export function setStepByKey(s: RqState, projectId: string, key: string, changes: Partial<Step>, mk: MkAudit, reason?: string): RqState {
  const step = s.steps.find((x) => x.projectId === projectId && x.key === key);
  if (!step) return s;
  const audit: AuditEntry[] = [];
  (Object.keys(changes) as (keyof Step)[]).forEach((k) => {
    if (k === "ballSince") return;
    if (String(step[k] ?? "") !== String(changes[k] ?? "")) {
      audit.push(mk({ projectId, kind: "update", entity: "step", entityId: step.id, label: step.title, field: k, oldValue: String(step[k] ?? ""), newValue: String(changes[k] ?? ""), reason }));
    }
  });
  if (!audit.length) return s;
  return { ...s, steps: s.steps.map((x) => (x.id === step.id ? { ...x, ...changes } : x)), audit: [...s.audit, ...audit] };
}

function installTypeReasonText(type: InstallType, from: InstallType | null | undefined, phaseLabel: string): string {
  const to = type === "saas" ? "SaaS" : "On-prem";
  if (from === undefined || from === null) return `Kurulum tipi ${to} seçildi; ${phaseLabel} tamamlanmıştı`;
  const fromLabel = from === "saas" ? "SaaS" : "On-prem";
  return `Kurulum tipi ${fromLabel}→${to} değişti; ${phaseLabel} tamamlanmıştı`;
}

export function applyInstallType(s: RqState, projectId: string, type: InstallType, mk: MkAudit, reason?: string, from?: InstallType | null): RqState {
  const r = `Otomatik kural: kurulum tipi ${type === "saas" ? "SaaS" : "On-prem"}${reason ? ` — ${reason}` : ""}`;
  let next = s;
  for (const key of ONPREM_KEYS) {
    const st = next.steps.find((x) => x.projectId === projectId && x.key === key);
    if (!st || st.status === "done") continue;
    const phase = phaseOf(next, st);
    if (phase?.status === "done") {
      // RUL-05 Seçenek A: tamamlanmış aşamada durum değişmez, yalnızca out_of_scope -> locked tetiklenecekse aksiyon açılır.
      if (type !== "saas" && st.status === "out_of_scope") {
        next = ensureReviewAction(next, projectId, st, mk, installTypeReasonText(type, from, `${phase.code} ${phase.name}`));
      } else if (type === "saas") {
        next = cancelReviewAction(next, projectId, st.id, mk, installTypeReasonText(type, from, `${phase.code} ${phase.name}`));
      }
      continue;
    }
    if (phase?.status === "out_of_scope") continue;
    if (type === "saas") next = setStepByKey(next, projectId, key, { status: "out_of_scope" }, mk, r);
    else if (st.status === "out_of_scope") next = setStepByKey(next, projectId, key, { status: "locked", due: null, activatedAt: null }, mk, r);
  }
  const saas = next.steps.find((x) => x.projectId === projectId && x.key === "saas_env");
  const saasPhase = next.phases.find((p) => p.projectId === projectId && p.code === "03");
  if (type === "saas") {
    if (saas) {
      const phase = phaseOf(next, saas);
      if (phase?.status === "done") {
        if (saas.status === "out_of_scope") next = ensureReviewAction(next, projectId, saas, mk, installTypeReasonText(type, from, `${phase.code} ${phase.name}`));
        else next = cancelReviewAction(next, projectId, saas.id, mk, installTypeReasonText(type, from, `${phase.code} ${phase.name}`));
      } else if (phase?.status !== "out_of_scope" && saas.status === "out_of_scope") {
        next = setStepByKey(next, projectId, "saas_env", { status: "locked", due: null, activatedAt: null }, mk, r);
      }
    } else if (saasPhase && saasPhase.status !== "out_of_scope") {
      if (saasPhase.status === "done") {
        const step: Step = {
          id: uid("st"), projectId, phaseId: saasPhase.id, title: "SaaS ortamının hazırlanması", required: true, ownerId: devopsId(next), ball: "devops",
          ballSince: new Date().toISOString(), due: null, status: "out_of_scope", order: -1, key: "saas_env",
          dependency: "previous", durationDays: 3, activatedAt: null, completion: "manual",
        };
        const phaseLabel = `${saasPhase.code} ${saasPhase.name}`;
        const createReasonText = `kurulum tipi SaaS — ${phaseLabel} aşaması tamamlanmıştı`;
        next = { ...next, steps: [...next.steps, step], audit: [...next.audit, mk({ projectId, kind: "create", entity: "step", entityId: step.id, label: `${step.title} — adım açıldı`, reason: `Otomatik kural: ${createReasonText}` })] };
        next = ensureReviewAction(next, projectId, step, mk, installTypeReasonText(type, from, phaseLabel));
      } else {
        const step: Step = {
          id: uid("st"), projectId, phaseId: saasPhase.id, title: "SaaS ortamının hazırlanması", required: true, ownerId: devopsId(next), ball: "devops",
          ballSince: new Date().toISOString(), due: null, status: "locked", order: -1, key: "saas_env",
          dependency: "previous", durationDays: 3, activatedAt: null, completion: "manual",
        };
        next = { ...next, steps: [...next.steps, step], audit: [...next.audit, mk({ projectId, kind: "create", entity: "step", entityId: step.id, label: `${step.title} — adım açıldı`, reason: r })] };
      }
    }
  } else if (saas && saas.status !== "done") {
    const phase = phaseOf(next, saas);
    if (phase?.status === "done") {
      next = cancelReviewAction(next, projectId, saas.id, mk, "kurulum tipi değişti, gözden geçirme gereksiz");
    } else if (phase?.status !== "out_of_scope") {
      next = setStepByKey(next, projectId, "saas_env", { status: "out_of_scope" }, mk, r);
    }
  }
  return next;
}

const LLM_ACTIONS: Record<LlmChoice, { key: string; title: string; ball: "customer" | "devops" }[]> = {
  rabbitqa: [],
  gpu: [
    { key: "gpu_req", title: "GPU gereksinimlerinin müşteriye iletilmesi", ball: "devops" },
    { key: "gpu_model", title: "Model kurulumu", ball: "devops" },
  ],
  own: [
    { key: "llm_endpoint", title: "LLM endpoint ve erişim bilgisinin alınması", ball: "customer" },
    { key: "llm_integration", title: "LLM entegrasyonu", ball: "devops" },
  ],
};

const LLM_LABELS: Record<LlmChoice, string> = { rabbitqa: "RabbitQA LLM", own: "Müşterinin kendi LLM'i", gpu: "Müşteri GPU'lu sunucu" };

export function applyLlmChoice(s: RqState, projectId: string, choice: LlmChoice, mk: MkAudit, reason?: string, from?: LlmChoice | null): RqState {
  const label = LLM_LABELS[choice];
  const r = `Otomatik kural: LLM tercihi ${label}${reason ? ` — ${reason}` : ""}`;
  const project = s.projects.find((p) => p.id === projectId);
  const wanted = new Set(LLM_ACTIONS[choice].map((a) => a.key));
  const audit: AuditEntry[] = [];
  let actions = s.actions.map((a) => {
    if (a.projectId !== projectId || !a.ruleKey || !(a.ruleKey in Object.fromEntries(Object.values(LLM_ACTIONS).flat().map((x) => [x.key, 1])))) return a;
    if (!wanted.has(a.ruleKey) && (a.status === "open" || a.status === "in_progress")) {
      audit.push(mk({ projectId, kind: "update", entity: "action", entityId: a.id, label: a.title, field: "status", oldValue: a.status, newValue: "cancelled", reason: r }));
      return { ...a, status: "cancelled" as const };
    }
    if (wanted.has(a.ruleKey) && a.status === "cancelled") {
      audit.push(mk({ projectId, kind: "update", entity: "action", entityId: a.id, label: a.title, field: "status", oldValue: a.status, newValue: "open", reason: r }));
      return { ...a, status: "open" as const };
    }
    return a;
  });
  for (const def of LLM_ACTIONS[choice]) {
    if (actions.some((a) => a.projectId === projectId && a.ruleKey === def.key)) continue;
    const a: Action = {
      id: uid("a"), projectId, title: def.title, ownerId: def.ball === "devops" ? devopsId(s) : project?.csmId ?? null, ball: def.ball,
      due: null, priority: "medium", status: "open", source: "rule", meetingId: null, createdAt: new Date().toISOString(), ruleKey: def.key, isCustomerVisible: true,
    };
    actions = [...actions, a];
    audit.push(mk({ projectId, kind: "create", entity: "action", entityId: a.id, label: `${a.title} — aksiyon açıldı`, reason: r }));
  }
  let next: RqState = { ...s, actions, audit: [...s.audit, ...audit] };
  const model = next.steps.find((x) => x.projectId === projectId && x.key === "model_install");
  if (model && model.status !== "done") {
    const phase = phaseOf(next, model);
    if (phase?.status === "done") {
      const fromLabel = from === undefined || from === null ? null : LLM_LABELS[from];
      const reasonText = fromLabel
        ? `LLM tercihi ${fromLabel}→${label} değişti; ${phase.code} ${phase.name} tamamlanmıştı`
        : `LLM tercihi ${label} seçildi; ${phase.code} ${phase.name} tamamlanmıştı`;
      if (choice === "gpu" && model.status === "out_of_scope") {
        next = ensureReviewAction(next, projectId, model, mk, reasonText);
      } else if (choice !== "gpu") {
        next = cancelReviewAction(next, projectId, model.id, mk, reasonText);
      }
    } else if (phase?.status !== "out_of_scope") {
      if (choice === "gpu" && model.status === "out_of_scope") next = setStepByKey(next, projectId, "model_install", { status: "locked", required: true, due: null, activatedAt: null }, mk, r);
      if (choice !== "gpu" && model.status !== "out_of_scope") next = setStepByKey(next, projectId, "model_install", { status: "out_of_scope" }, mk, r);
    }
  }
  return next;
}

export function installChoiceError(
  old: Pick<Project, "installType" | "llmChoice">,
  next: Partial<Pick<Project, "installType" | "llmChoice">>,
  reason?: string,
): string | null {
  if ("installType" in next) {
    if (old.installType !== null && next.installType === null) return "Kurulum tipi seçildikten sonra 'Henüz belli değil' yapılamaz";
    if (old.installType !== null && next.installType !== null && next.installType !== old.installType && !reason?.trim()) return "Kurulum tipi veya LLM değişikliğinde gerekçe zorunlu";
  }
  if ("llmChoice" in next) {
    if (old.llmChoice !== null && next.llmChoice === null) return "LLM tercihi seçildikten sonra 'Henüz belli değil' yapılamaz";
    if (old.llmChoice !== null && next.llmChoice !== null && next.llmChoice !== old.llmChoice && !reason?.trim()) return "Kurulum tipi veya LLM değişikliğinde gerekçe zorunlu";
  }
  return null;
}

export function applyMeetingHeldRules(s: RqState, m: Meeting, mk: MkAudit): RqState {
  if (m.status !== "held") return s;
  let next = s;
  if (m.type === "devops_handover") {
    const step = next.steps.find((x) => x.projectId === m.projectId && x.key === "devops_handover");
    if (step && step.status !== "out_of_scope") {
      next = setStepByKey(next, m.projectId, "devops_handover", { ball: "devops", ballSince: new Date().toISOString() }, mk, "Otomatik kural: DevOps devir toplantısı yapıldı, top DevOps'a geçti");
    }
  }
  if (m.type === "go_no_go") {
    next = setStepByKey(next, m.projectId, "gonogo", { status: "done" }, mk, "Otomatik kural: Go/No-Go toplantısı kaydedildi");
  }
  return next;
}
