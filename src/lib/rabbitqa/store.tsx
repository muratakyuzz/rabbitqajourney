import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { ADAPTATION_STEPS, buildFromTemplate, createSeed, uid } from "./seed";
import type {
  Action, AdaptationSession, Alert, AuditEntry, Commitment, Contact, Credential, DocumentRec, Kpi, Meeting, Phase, Project, RiskDecision, RqState, Step, SupportTicket, TrainingSession,
} from "./types";
import { todayISO } from "./labels";
import { applyInstallType, applyLlmChoice, setStepByKey } from "./rules";

const KEY = "rabbitqa-demo-state-v4";

function load(): RqState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as RqState;
      if (s.version === 4) return s;
    }
  } catch { /* ignore */ }
  return createSeed();
}

const str = (v: unknown) => (v === null || v === undefined ? "" : Array.isArray(v) ? v.join(", ") : typeof v === "object" ? JSON.stringify(v) : String(v));

type Coll = "projects" | "phases" | "steps" | "actions" | "meetings" | "contacts" | "commitments" | "kpis" | "trainings" | "adaptations" | "credentials" | "documents" | "alerts" | "tickets" | "risks";
const ENTITY: Record<Coll, string> = {
  projects: "project", phases: "phase", steps: "step", actions: "action", meetings: "meeting", contacts: "contact", commitments: "commitment", kpis: "kpi", trainings: "training", adaptations: "adaptation", credentials: "credential", documents: "document",
  alerts: "alert", tickets: "ticket", risks: "risk",
};

interface Ctx {
  state: RqState;
  userId: string;
  createProject: (p: Pick<Project, "customerName" | "name" | "csmId" | "salespersonId" | "licenseModel" | "purchasedModules" | "startDate" | "goLiveDate">) => string;
  updateProject: (id: string, patch: Partial<Project>, reason?: string) => void;
  updatePhase: (id: string, patch: Partial<Phase>, reason?: string) => void;
  completePhase: (id: string) => string | null;
  updateStep: (id: string, patch: Partial<Step>, reason?: string) => void;
  addAction: (a: Omit<Action, "id" | "createdAt">) => void;
  updateAction: (id: string, patch: Partial<Action>, reason?: string) => void;
  addMeeting: (m: Omit<Meeting, "id">, actions: Omit<Action, "id" | "createdAt" | "meetingId" | "projectId" | "source">[]) => void;
  addContact: (c: Omit<Contact, "id">) => void;
  updateContact: (id: string, patch: Partial<Contact>) => void;
  addCommitment: (c: Omit<Commitment, "id">) => void;
  updateCommitment: (id: string, patch: Partial<Commitment>, reason?: string) => void;
  addTeam: (projectId: string, team: string) => void;
  setTeamInfo: (projectId: string, team: string, info: { contact: string; users: number | null }) => void;
  setKickoff: (projectId: string, patch: Pick<Project, "presentationShared" | "installType" | "llmChoice" | "reqDocShared" | "reqDocSharedAt">, reason?: string) => void;
  addKpi: (k: Omit<Kpi, "id" | "measurements">) => void;
  addMeasurement: (kpiId: string, m: { date: string; value: number }) => void;
  addTraining: (t: Omit<TrainingSession, "id">) => void;
  updateTraining: (id: string, patch: Partial<TrainingSession>) => void;
  saveAdaptation: (projectId: string, team: string, patch: Partial<AdaptationSession>) => void;
  addCredential: (c: Omit<Credential, "id">) => void;
  logCredentialView: (id: string) => void;
  addDocument: (d: Omit<DocumentRec, "id" | "addedAt">) => void;
  addAlert: (a: Omit<Alert, "id" | "createdAt" | "status" | "resolvedAt" | "resolvedBy" | "source">) => void;
  resolveAlert: (id: string) => void;
  addTicket: (t: Omit<SupportTicket, "id" | "openedAt" | "resolvedAt">) => void;
  updateTicket: (id: string, patch: Partial<SupportTicket>, reason?: string) => void;
  addRisk: (r: Omit<RiskDecision, "id" | "createdAt">) => void;
  updateRisk: (id: string, patch: Partial<RiskDecision>, reason?: string) => void;
  approveGoLive: (projectId: string, reason: string) => string | null;
  setConfig: <K extends "modules" | "questions" | "template">(key: K, value: RqState[K], label: string) => void;
  reset: () => void;
}

const RqContext = createContext<Ctx | null>(null);

export function RqProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? "system";
  const [state, setState] = useState<RqState>(load);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(state));
  }, [state]);

  const mkAudit = useCallback(
    (e: Omit<AuditEntry, "id" | "at" | "userId">): AuditEntry => ({ ...e, id: uid("au"), at: new Date().toISOString(), userId }),
    [userId],
  );

  const labelOf = (coll: Coll, item: Record<string, unknown>) =>
    String(item.title ?? item.name ?? item.text ?? item.customerName ?? item.type ?? "");

  /** Generic patch: writes one audit entry per changed field. */
  const patch = useCallback(
    <T extends { id: string; projectId?: string }>(coll: Coll, id: string, changes: Partial<T>, reason?: string, extra?: (s: RqState, old: T, next: T) => Partial<RqState>) => {
      setState((s) => {
        const list = s[coll] as unknown as T[];
        const old = list.find((x) => x.id === id);
        if (!old) return s;
        const next = { ...old, ...changes } as T;
        const entries: AuditEntry[] = [];
        (Object.keys(changes) as (keyof T)[]).forEach((k) => {
          if (str(old[k]) !== str(next[k])) {
            entries.push(mkAudit({
              projectId: (old.projectId ?? old.id) as string, kind: "update", entity: ENTITY[coll], entityId: id,
              label: labelOf(coll, old as unknown as Record<string, unknown>), field: String(k), oldValue: str(old[k]), newValue: str(next[k]), reason,
            }));
          }
        });
        if (!entries.length) return s;
        const base = { ...s, [coll]: list.map((x) => (x.id === id ? next : x)), audit: [...s.audit, ...entries] } as RqState;
        return extra ? { ...base, ...extra(base, old, next) } : base;
      });
    },
    [mkAudit],
  );

  const add = useCallback(
    <T extends { id: string; projectId: string }>(coll: Coll, item: T, label?: string) => {
      setState((s) => ({
        ...s,
        [coll]: [...(s[coll] as unknown as T[]), item],
        audit: [...s.audit, mkAudit({ projectId: item.projectId, kind: "create", entity: ENTITY[coll], entityId: item.id, label: label ?? labelOf(coll, item as unknown as Record<string, unknown>) })],
      }));
    },
    [mkAudit],
  );

  const value = useMemo<Ctx>(() => ({
    state,
    userId,
    createProject: (input) => {
      const project: Project = {
        ...input, id: uid("p"), health: "green", healthReason: "", teams: [], desiredModules: [], discoveryAnswers: {}, teamInfo: {},
        installType: null, llmChoice: null, presentationShared: false, reqDocShared: false, reqDocSharedAt: null, createdAt: new Date().toISOString(),
      };
      setState((s) => {
        const { phases, steps } = buildFromTemplate(project, s.users, {}, s.template);
        return {
          ...s,
          projects: [...s.projects, project],
          phases: [...s.phases, ...phases],
          steps: [...s.steps, ...steps],
          audit: [...s.audit, mkAudit({ projectId: project.id, kind: "create", entity: "project", entityId: project.id, label: `Proje oluşturuldu — aşamalar ve adımlar şablondan kopyalandı` })],
        };
      });
      return project.id;
    },
    updateProject: (id, p, reason) => patch<Project>("projects", id, p, reason, (base, old, next) => {
      if (next.health === "red" && old.health !== "red") {
        const alert: Alert = {
          id: uid("al"), projectId: id, title: "Proje sağlığı kırmızıya düştü", detail: next.healthReason || "Gerekçe girilmedi.",
          severity: "critical", status: "open", source: "rule", createdAt: new Date().toISOString(), resolvedAt: null, resolvedBy: null,
        };
        return { alerts: [...base.alerts, alert], audit: [...base.audit, mkAudit({ projectId: id, kind: "create", entity: "alert", entityId: alert.id, label: alert.title, reason: "Otomatik kural: sağlık kırmızı" })] };
      }
      return {};
    }),
    updatePhase: (id, p, reason) => patch<Phase>("phases", id, p, reason),
    completePhase: (id) => {
      const ph = state.phases.find((x) => x.id === id);
      if (!ph) return "Aşama bulunamadı";
      const open = state.steps.filter((s) => s.phaseId === id && s.required && s.status !== "done" && s.status !== "out_of_scope");
      if (open.length) return `${open.length} zorunlu adım tamamlanmadı`;
      patch<Phase>("phases", id, { status: "done", actualEnd: todayISO(), actualStart: ph.actualStart ?? todayISO(), approvedBy: userId, approvedAt: new Date().toISOString() });
      return null;
    },
    updateStep: (id, p, reason) => {
      const old = state.steps.find((s) => s.id === id);
      const changes = { ...p };
      if (old && p.ball && p.ball !== old.ball) changes.ballSince = new Date().toISOString();
      patch<Step>("steps", id, changes, reason);
    },
    addAction: (a) => add<Action>("actions", { ...a, id: uid("a"), createdAt: new Date().toISOString() }),
    updateAction: (id, p, reason) => patch<Action>("actions", id, p, reason),
    addMeeting: (m, actions) => {
      const meeting = { ...m, id: uid("m") };
      add<Meeting>("meetings", meeting, `Toplantı kaydedildi`);
      if (m.type === "devops_handover") {
        setState((s) => setStepByKey(s, m.projectId, "devops_handover", { status: "done", ball: "devops", ballSince: new Date().toISOString() }, mkAudit, "Otomatik kural: DevOps devir toplantısı kaydedildi, top DevOps'a geçti"));
      }
      if (m.type === "go_no_go") {
        setState((s) => setStepByKey(s, m.projectId, "gonogo", { status: "done" }, mkAudit, "Otomatik kural: Go/No-Go toplantısı kaydedildi"));
      }
      actions.forEach((a) =>
        add<Action>("actions", { ...a, id: uid("a"), projectId: m.projectId, source: "meeting", meetingId: meeting.id, createdAt: new Date().toISOString() }),
      );
    },
    addContact: (c) => add<Contact>("contacts", { ...c, id: uid("c") }),
    updateContact: (id, p) => patch<Contact>("contacts", id, p),
    addCommitment: (c) => add<Commitment>("commitments", { ...c, id: uid("cm") }),
    updateCommitment: (id, p, reason) => patch<Commitment>("commitments", id, p, reason, (base) => {
      const c = base.commitments.find((x) => x.id === id);
      if (!c) return {};
      const open = base.commitments.filter((x) => x.projectId === c.projectId && x.status === "open");
      if (!open.length) return setStepByKey(base, c.projectId, "commit_check", { status: "done" }, mkAudit, "Otomatik kural: açık taahhüt kalmadı");
      return {};
    }),
    addTeam: (projectId, team) => {
      setState((s) => {
        const project = s.projects.find((p) => p.id === projectId);
        const phase = s.phases.find((p) => p.projectId === projectId && p.code === "05");
        if (!project || !phase || project.teams.includes(team)) return s;
        const start = s.steps.filter((x) => x.phaseId === phase.id).length;
        const newSteps: Step[] = ADAPTATION_STEPS.map((t, i) => ({
          id: uid("st"), projectId, phaseId: phase.id, title: `${team} — ${t}`, required: true, ownerId: project.csmId, ball: "csm",
          ballSince: new Date().toISOString(), due: phase.planEnd, status: "pending", order: start + i,
        }));
        return {
          ...s,
          projects: s.projects.map((p) => (p.id === projectId ? { ...p, teams: [...p.teams, team] } : p)),
          steps: [...s.steps, ...newSteps],
          audit: [...s.audit, mkAudit({ projectId, kind: "create", entity: "project", entityId: projectId, label: `Takım eklendi: ${team} — Uyarlama aşamasına 5 adım açıldı (otomatik kural)` })],
        };
      });
    },
    setTeamInfo: (projectId, team, info) => {
      const p = state.projects.find((x) => x.id === projectId);
      if (p) patch<Project>("projects", projectId, { teamInfo: { ...p.teamInfo, [team]: info } });
    },
    setKickoff: (projectId, kp, reason) => {
      setState((s) => {
        const old = s.projects.find((p) => p.id === projectId);
        if (!old) return s;
        const audit: AuditEntry[] = [];
        (Object.keys(kp) as (keyof typeof kp)[]).forEach((k) => {
          if (str(old[k]) !== str(kp[k])) {
            audit.push(mkAudit({ projectId, kind: "update", entity: "project", entityId: projectId, label: "Kick-off", field: k, oldValue: str(old[k]), newValue: str(kp[k]), reason }));
          }
        });
        if (!audit.length) return s;
        let next: RqState = { ...s, projects: s.projects.map((p) => (p.id === projectId ? { ...p, ...kp } : p)), audit: [...s.audit, ...audit] };
        if (kp.installType && kp.installType !== old.installType) {
          next = applyInstallType(next, projectId, kp.installType, mkAudit, reason);
          next = setStepByKey(next, projectId, "install_type", { status: "done" }, mkAudit, "Kurulum tipi girildi");
        }
        if (kp.llmChoice && kp.llmChoice !== old.llmChoice) {
          next = applyLlmChoice(next, projectId, kp.llmChoice, mkAudit, reason);
          next = setStepByKey(next, projectId, "llm", { status: "done" }, mkAudit, "LLM tercihi girildi");
        }
        if (kp.presentationShared && !old.presentationShared) next = setStepByKey(next, projectId, "presentation", { status: "done" }, mkAudit, "Sunum paylaşıldı");
        if (kp.reqDocShared && !old.reqDocShared) next = setStepByKey(next, projectId, "reqdoc", { status: "done" }, mkAudit, "Gereksinim dokümanı paylaşıldı");
        return next;
      });
    },
    addKpi: (k) => add<Kpi>("kpis", { ...k, id: uid("k"), measurements: [] }),
    addMeasurement: (kpiId, m) => {
      const k = state.kpis.find((x) => x.id === kpiId);
      if (k) patch<Kpi>("kpis", kpiId, { measurements: [...k.measurements, m].sort((a, b) => a.date.localeCompare(b.date)) });
    },
    addTraining: (t) => {
      const id = uid("t");
      add<TrainingSession>("trainings", { ...t, id }, `Eğitim session'ı eklendi — ${t.date.split("-").reverse().join(".")} · ${t.attendees || "katılımcı girilmedi"}`);
      setState((s) => {
        const phase = s.phases.find((p) => p.projectId === t.projectId && p.code === "04");
        if (!phase) return s;
        const step: Step = {
          id: uid("st"), projectId: t.projectId, phaseId: phase.id, title: `Katılımcı girişi — ${t.date.split("-").reverse().join(".")} session'ı`, required: false,
          ownerId: s.projects.find((p) => p.id === t.projectId)?.csmId ?? null, ball: "csm", ballSince: new Date().toISOString(), due: t.date, status: t.attendees ? "done" : "pending", order: 100,
        };
        return { ...s, steps: [...s.steps, step], audit: [...s.audit, mkAudit({ projectId: t.projectId, kind: "create", entity: "step", entityId: step.id, label: `${step.title} — adım açıldı (otomatik kural)` })] };
      });
    },
    updateTraining: (id, p) => patch<TrainingSession>("trainings", id, p),
    saveAdaptation: (projectId, team, p) => {
      const ex = state.adaptations.find((a) => a.projectId === projectId && a.team === team);
      if (ex) patch<AdaptationSession>("adaptations", ex.id, p);
      else add<AdaptationSession>("adaptations", { id: uid("ad"), projectId, team, date: null, participants: "", notes: "", ...p }, `Uyarlama session'ı — ${team}`);
    },
    addCredential: (c) => add<Credential>("credentials", { ...c, id: uid("cr") }, `Erişim bilgisi eklendi — ${c.type} / ${c.provider}`),
    logCredentialView: (id) => {
      setState((s) => {
        const c = s.credentials.find((x) => x.id === id);
        if (!c) return s;
        return { ...s, audit: [...s.audit, mkAudit({ projectId: c.projectId, kind: "view", entity: "credential", entityId: id, label: `Erişim bilgisi görüntülendi — ${c.type} / ${c.provider}` })] };
      });
    },
    addDocument: (d) => {
      add<DocumentRec>("documents", { ...d, id: uid("d"), addedAt: new Date().toISOString() }, `Doküman eklendi — ${d.name}`);
      const key = d.type === "offer" ? "offer" : d.type === "contract" ? "contract" : d.type === "req_doc" ? "reqdoc" : null;
      if (key) setState((s) => setStepByKey(s, d.projectId, key, { status: "done" }, mkAudit, `Otomatik kural: ${d.name} yüklendi`));
    },
    addAlert: (a) => add<Alert>("alerts", { ...a, id: uid("al"), status: "open", source: "manual", createdAt: new Date().toISOString(), resolvedAt: null, resolvedBy: null }, `Uyarı eklendi — ${a.title}`),
    resolveAlert: (id) => patch<Alert>("alerts", id, { status: "resolved", resolvedAt: new Date().toISOString(), resolvedBy: userId }),
    addTicket: (t) => {
      add<SupportTicket>("tickets", { ...t, id: uid("tk"), openedAt: new Date().toISOString(), resolvedAt: null }, `Destek kaydı açıldı — ${t.title}`);
      setState((s) => setStepByKey(s, t.projectId, "support_track", { status: "in_progress" }, mkAudit, "Otomatik kural: destek kaydı açıldı"));
      if (t.priority === "high") {
        setState((s) => ({
          ...s,
          alerts: [...s.alerts, { id: uid("al"), projectId: t.projectId, title: `Yüksek öncelikli destek kaydı: ${t.title}`, detail: t.description, severity: "warning" as const, status: "open" as const, source: "rule" as const, createdAt: new Date().toISOString(), resolvedAt: null, resolvedBy: null }],
          audit: [...s.audit, mkAudit({ projectId: t.projectId, kind: "create", entity: "alert", entityId: "auto", label: `Yüksek öncelikli destek kaydı uyarısı — ${t.title}`, reason: "Otomatik kural: yüksek öncelikli ticket" })],
        }));
      }
    },
    updateTicket: (id, p, reason) => {
      const old = state.tickets.find((t) => t.id === id);
      const changes = { ...p };
      if (old && (p.status === "resolved" || p.status === "closed") && !old.resolvedAt) changes.resolvedAt = new Date().toISOString();
      patch<SupportTicket>("tickets", id, changes, reason);
    },
    addRisk: (r) => add<RiskDecision>("risks", { ...r, id: uid("r"), createdAt: new Date().toISOString() }, `${r.kind === "risk" ? "Risk" : "Karar"} eklendi — ${r.title}`),
    updateRisk: (id, p, reason) => patch<RiskDecision>("risks", id, p, reason),
    approveGoLive: (projectId, reason) => {
      const gonogo = state.steps.find((s) => s.projectId === projectId && s.key === "gonogo");
      if (!gonogo || gonogo.status !== "done") return "Önce Go/No-Go toplantısını kaydedin";
      const openCommits = state.commitments.filter((c) => c.projectId === projectId && c.status === "open");
      if (openCommits.length) return `${openCommits.length} açık taahhüt var — önce kapatın veya karşılanamadı olarak işaretleyin`;
      const phase = state.phases.find((p) => p.projectId === projectId && p.code === "07");
      setState((s) => {
        let next = setStepByKey(s, projectId, "customer_approval", { status: "done" }, mkAudit, reason);
        if (phase) {
          const open = next.steps.filter((x) => x.phaseId === phase.id && x.required && x.status !== "done" && x.status !== "out_of_scope");
          if (!open.length) {
            next = {
              ...next,
              phases: next.phases.map((p) => (p.id === phase.id ? { ...p, status: "done" as const, actualEnd: todayISO(), actualStart: p.actualStart ?? todayISO(), approvedBy: userId, approvedAt: new Date().toISOString() } : p)),
              audit: [...next.audit, mkAudit({ projectId, kind: "update", entity: "phase", entityId: phase.id, label: phase.name, field: "status", oldValue: phase.status, newValue: "done", reason: "Müşteri onayı ile Go-Live tamamlandı" })],
            };
          }
        }
        return next;
      });
      return null;
    },
    setConfig: (key, val, label) => setState((s) => ({
      ...s,
      [key]: val,
      audit: [...s.audit, mkAudit({ projectId: "system", kind: "update", entity: "config", entityId: key, label, field: key })],
    })),
    reset: () => setState(createSeed()),
  }), [state, userId, patch, add, mkAudit]);

  return <RqContext.Provider value={value}>{children}</RqContext.Provider>;
}

export function useRq() {
  const c = useContext(RqContext);
  if (!c) throw new Error("useRq must be used within RqProvider");
  return c;
}

export function projectProgress(state: RqState, projectId: string) {
  const steps = state.steps.filter((s) => s.projectId === projectId && s.status !== "out_of_scope");
  if (!steps.length) return 0;
  return Math.round((steps.filter((s) => s.status === "done").length / steps.length) * 100);
}

export function activePhase(state: RqState, projectId: string) {
  const phases = state.phases.filter((p) => p.projectId === projectId).sort((a, b) => a.order - b.order);
  return phases.find((p) => p.status !== "done" && p.status !== "out_of_scope") ?? phases[phases.length - 1];
}

export function personName(state: RqState, id: string | null) {
  if (!id) return "—";
  return state.users.find((u) => u.id === id)?.name ?? state.contacts.find((c) => c.id === id)?.name ?? "—";
}
