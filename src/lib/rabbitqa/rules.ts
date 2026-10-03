import { uid } from "./seed";
import type { Action, AuditEntry, InstallType, LlmChoice, RqState, Step } from "./types";

export type MkAudit = (e: Omit<AuditEntry, "id" | "at" | "userId">) => AuditEntry;

const ONPREM_KEYS = ["reqdoc", "vpn_req", "vpn_info", "servers", "devops_handover"];

function devopsId(s: RqState) {
  return s.users.find((u) => u.role === "devops")?.id ?? null;
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

export function applyInstallType(s: RqState, projectId: string, type: InstallType, mk: MkAudit, reason?: string): RqState {
  const r = `Otomatik kural: kurulum tipi ${type === "saas" ? "SaaS" : "On-prem"}${reason ? ` — ${reason}` : ""}`;
  let next = s;
  for (const key of ONPREM_KEYS) {
    const st = next.steps.find((x) => x.projectId === projectId && x.key === key);
    if (!st || st.status === "done") continue;
    if (type === "saas") next = setStepByKey(next, projectId, key, { status: "out_of_scope" }, mk, r);
    else if (st.status === "out_of_scope") next = setStepByKey(next, projectId, key, { status: "locked", due: null, activatedAt: null }, mk, r);
  }
  const saas = next.steps.find((x) => x.projectId === projectId && x.key === "saas_env");
  if (type === "saas") {
    if (saas) {
      if (saas.status === "out_of_scope") next = setStepByKey(next, projectId, "saas_env", { status: "locked", due: null, activatedAt: null }, mk, r);
    } else {
      const phase = next.phases.find((p) => p.projectId === projectId && p.code === "03");
      if (phase) {
        const step: Step = {
          id: uid("st"), projectId, phaseId: phase.id, title: "SaaS ortamının hazırlanması", required: true, ownerId: devopsId(next), ball: "devops",
          ballSince: new Date().toISOString(), due: null, status: "locked", order: -1, key: "saas_env",
          dependency: "previous", durationDays: 3, activatedAt: null,
        };
        next = { ...next, steps: [...next.steps, step], audit: [...next.audit, mk({ projectId, kind: "create", entity: "step", entityId: step.id, label: `${step.title} — adım açıldı`, reason: r })] };
      }
    }
  } else if (saas && saas.status !== "done") {
    next = setStepByKey(next, projectId, "saas_env", { status: "out_of_scope" }, mk, r);
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

export function applyLlmChoice(s: RqState, projectId: string, choice: LlmChoice, mk: MkAudit, reason?: string): RqState {
  const label = { rabbitqa: "RabbitQA LLM", own: "Müşterinin kendi LLM'i", gpu: "Müşteri GPU'lu sunucu" }[choice];
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
      due: null, priority: "medium", status: "open", source: "rule", meetingId: null, createdAt: new Date().toISOString(), ruleKey: def.key,
    };
    actions = [...actions, a];
    audit.push(mk({ projectId, kind: "create", entity: "action", entityId: a.id, label: `${a.title} — aksiyon açıldı`, reason: r }));
  }
  let next: RqState = { ...s, actions, audit: [...s.audit, ...audit] };
  const model = next.steps.find((x) => x.projectId === projectId && x.key === "model_install");
  if (model && model.status !== "done") {
    if (choice === "gpu" && model.status === "out_of_scope") next = setStepByKey(next, projectId, "model_install", { status: "locked", required: true, due: null, activatedAt: null }, mk, r);
    if (choice !== "gpu" && model.status !== "out_of_scope") next = setStepByKey(next, projectId, "model_install", { status: "out_of_scope" }, mk, r);
  }
  return next;
}
