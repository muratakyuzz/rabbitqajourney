import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { projectPlan } from "@rabbitqa/shared/domain/flow";
import { allAlerts, computeAlerts, type AlertView } from "@rabbitqa/shared/domain/alerts";
import { setActiveHolidays } from "@rabbitqa/shared/domain/business-days";
import { ADAPTATION_ITEM_LABEL, fmtDate } from "@rabbitqa/shared/domain/labels";
import { useAuth } from "@/lib/auth-context";
import { DEFAULT_PROJECT_INTEGRATIONS, STATE_KEY, STATE_VERSION, buildFromTemplate, createSeed, uid } from "@rabbitqa/shared/domain/seed";
import { analyzeText, type IncomingMeta } from "./ai-mock";
import { matchEmail } from "./email-match";
import { isAutoStep, manualStatusError, settleAll, stepLockError } from "@rabbitqa/shared/domain/completion";
import type {
  AiInsight, ChatChannel, InsightProposedAny, InsightSource, IntegrationConfig, ProjectIntegrations, UnmatchedEmail,
  CustomerReport, User, Action, Adaptation, AdaptationItem, Alert, AuditEntry, Commitment, Contact, Credential, DocumentRec, Kpi, Meeting, Phase, Project, RiskDecision, RqState, Step, SupportTicket,
} from "@rabbitqa/shared/domain/types";
import { todayISO } from "@rabbitqa/shared/domain/labels";
import { buildReportSnapshot, defaultNextWeek } from "@rabbitqa/shared/domain/reports";
import { weekStartOf } from "@rabbitqa/shared/domain/alerts";
import { applyInstallType, applyLlmChoice, applyMeetingHeldRules, ensureReviewAction, installChoiceError, setStepByKey } from "@rabbitqa/shared/domain/rules";
import type { TemplateVersion } from "@rabbitqa/shared";
import { fetchTemplate } from "@/data/template";

/** Active template version from the API (not persisted); null while unknown or when the API is unreachable. */
export type TemplateMeta = Omit<TemplateVersion, "phases">;

function load(): RqState {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) {
      const s = JSON.parse(raw) as RqState;
      if (s.version === STATE_VERSION) return s;
    }
  } catch { /* ignore */ }
  return createSeed();
}

const str = (v: unknown) => (v === null || v === undefined ? "" : Array.isArray(v) ? v.join(", ") : typeof v === "object" ? JSON.stringify(v) : String(v));

type Coll = "projects" | "phases" | "steps" | "actions" | "meetings" | "contacts" | "commitments" | "kpis" | "adaptations" | "credentials" | "documents" | "alerts" | "tickets" | "risks";
const ENTITY: Record<Coll, string> = {
  projects: "project", phases: "phase", steps: "step", actions: "action", meetings: "meeting", contacts: "contact", commitments: "commitment", kpis: "kpi", adaptations: "adaptation", credentials: "credential", documents: "document",
  alerts: "alert", tickets: "ticket", risks: "risk",
};

interface Ctx {
  state: RqState;
  userId: string;
  createProject: (p: Pick<Project, "customerName" | "name" | "csmId" | "salespersonId" | "licenseModel" | "purchasedModules" | "startDate" | "goLiveDate">) => string;
  updateProject: (id: string, patch: Partial<Project>, reason?: string) => void;
  updatePhase: (id: string, patch: Partial<Phase>, reason?: string) => string | null;
  completePhase: (id: string) => string | null;
  updateStep: (id: string, patch: Partial<Step>, reason?: string) => string | null;
  addAction: (a: Omit<Action, "id" | "createdAt" | "isCustomerVisible"> & { isCustomerVisible?: boolean }) => void;
  updateAction: (id: string, patch: Partial<Action>, reason?: string) => void;
  addMeeting: (m: Omit<Meeting, "id" | "isCustomerVisible"> & { isCustomerVisible?: boolean }, actions: (Omit<Action, "id" | "createdAt" | "meetingId" | "projectId" | "source" | "isCustomerVisible"> & { isCustomerVisible?: boolean })[]) => string;
  addContact: (c: Omit<Contact, "id">) => void;
  updateContact: (id: string, patch: Partial<Contact>) => void;
  addCommitment: (c: Omit<Commitment, "id">) => void;
  updateCommitment: (id: string, patch: Partial<Commitment>, reason?: string) => void;
  setNoCommitments: (projectId: string, value: boolean) => string | null;
  addTeam: (projectId: string, team: string) => void;
  setTeamInfo: (projectId: string, team: string, info: { contact: string; users: number | null }) => void;
  setInstallChoice: (projectId: string, patch: Partial<Pick<Project, "installType" | "llmChoice">>, reason?: string) => { error: string | null; summary: string | null };
  addKpi: (k: Omit<Kpi, "id" | "measurements" | "isCustomerVisible"> & { isCustomerVisible?: boolean }) => void;
  updateKpi: (id: string, patch: Partial<Kpi>) => void;
  updateMeeting: (id: string, patch: Partial<Meeting>, reason?: string) => string | null;
  addMeasurement: (kpiId: string, m: { date: string; value: number }) => void;
  setAdaptationCheck: (projectId: string, teamId: string | null, item: AdaptationItem, value: boolean) => string | null;
  addCredential: (c: Omit<Credential, "id">) => void;
  logCredentialView: (id: string) => void;
  addDocument: (d: Omit<DocumentRec, "id" | "addedAt">) => void;
  addAlert: (a: Omit<Alert, "id" | "createdAt" | "status" | "resolvedAt" | "resolvedBy" | "source">) => void;
  resolveAlert: (id: string) => void;
  snoozeAlert: (key: string, until: string, reason: string) => string | null;
  closeAlert: (key: string, reason: string) => string | null;
  addTicket: (t: Omit<SupportTicket, "id" | "openedAt" | "resolvedAt">) => string | null;
  updateTicket: (id: string, patch: Partial<SupportTicket>, reason?: string) => string | null;
  addRisk: (r: Omit<RiskDecision, "id" | "createdAt">) => void;
  createCustomerReport: (projectId: string, weekStart: string) => string | null;
  updateCustomerReport: (id: string, patch: Pick<CustomerReport, "summary" | "nextWeek">) => string | null;
  markReportSent: (id: string) => string | null;
  addUser: (u: Omit<User, "id" | "active">) => string | null;
  updateUser: (id: string, patch: Partial<Pick<User, "role" | "active" | "name">>) => string | null;
  updateRisk: (id: string, patch: Partial<RiskDecision>, reason?: string) => string | null;
  approveGoLive: (projectId: string, contactId: string, approvedAt: string, reason: string) => string | null;
  setConfig: <K extends "modules" | "questions" | "integrations" | "salespeople" | "alertThresholds" | "holidays" | "users">(key: K, value: RqState[K], label: string) => void;
  testConnection: (kind: "teams" | "email", override?: IntegrationConfig) => Promise<{ ok: boolean; message: string; channels?: ChatChannel[] }>;
  disconnect: (kind: "teams" | "email") => void;
  logSecretView: (field: string) => void;
  setProjectIntegration: (projectId: string, patch: { chat?: Partial<ProjectIntegrations["chat"]>; email?: Partial<ProjectIntegrations["email"]> }) => string | null;
  approveInsight: (id: string, edited?: Record<string, unknown>, note?: string) => string | null;
  rejectInsight: (id: string, note?: string) => void;
  rejectInsights: (ids: string[], note?: string) => void;
  assignUnmatchedEmail: (id: string, projectId: string, addAsContact?: { name: string; role: Contact["role"] }) => number;
  ignoreUnmatchedEmail: (id: string) => void;
  simulateIncoming: (projectId: string, source: InsightSource, text: string, meta: IncomingMeta) => { created: AiInsight[]; message?: string };
  receiveEmail: (mail: { from: string; to: string[]; cc: string[]; subject: string; text: string; direction: "in" | "out" }) => { projectId: string | null; created: number };
  reset: () => void;
  /** Template comes from the API (docs/PLAN.md M1); `state.template` is its copy for creating projects. */
  templateVersion: TemplateMeta | null;
  applyTemplateVersion: (tv: TemplateVersion) => void;
}

const RqContext = createContext<Ctx | null>(null);

export function RqProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? "system";
  const [state, setRaw] = useState<RqState>(() => { const s = load(); setActiveHolidays(s.holidays); return s; });
  const [templateVersion, setTemplateVersion] = useState<TemplateMeta | null>(null);
  const mkRef = useRef<(e: Omit<AuditEntry, "id" | "at" | "userId">) => AuditEntry>(() => { throw new Error("mk"); });
  const flowMsgs = useRef<string[]>([]);

  /** Her güncellemeden sonra akış motoru çalışır (idempotent); açılan adımlar için bildirim hazırlanır. */
  const setState = useCallback((u: RqState | ((s: RqState) => RqState)) => {
    setRaw((s) => {
      const n = typeof u === "function" ? u(s) : u;
      if (n === s) return s;
      if (n.holidays !== s.holidays) setActiveHolidays(n.holidays);
      const next = settleAll(n, mkRef.current);
      flowMsgs.current = uniq([...flowMsgs.current, ...flowMessages(s, next)]);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!flowMsgs.current.length) return;
    flowMsgs.current.forEach((m) => toast.success(m));
    flowMsgs.current = [];
  }, [state]);

  useEffect(() => {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  }, [state]);

  const applyTemplateVersion = useCallback((tv: TemplateVersion) => {
    const { phases, ...meta } = tv;
    setState((s) => ({ ...s, template: phases }));
    setTemplateVersion(meta);
  }, [setState]);

  // Template hydration after boot; API unreachable → keep the stored template (mockup behaviour).
  useEffect(() => {
    fetchTemplate().then(applyTemplateVersion, () => {});
  }, [applyTemplateVersion]);

  const mkAudit = useCallback(
    (e: Omit<AuditEntry, "id" | "at" | "userId">): AuditEntry => ({ ...e, id: uid("au"), at: new Date().toISOString(), userId }),
    [userId],
  );
  mkRef.current = mkAudit;

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

  const value = useMemo<Ctx>(() => {
    const sysAudit = (label: string, extra: Partial<AuditEntry> = {}) => mkAudit({ projectId: "system", kind: "update", entity: "config", entityId: "integrations", label, field: "integrations", ...extra });

    /** Taslakları ekler; aynı hedef için bekleyen öneri varsa kaynağına ekler. */
    const insertDrafts = (drafts: ReturnType<typeof analyzeText>): AiInsight[] => {
      const created: AiInsight[] = [];
      setState((s) => {
        let insights = [...s.insights];
        const audit = [...s.audit];
        drafts.forEach((d) => {
          const dup = d.targetId ? insights.find((i) => i.status === "pending" && i.targetId === d.targetId && i.kind === d.kind) : null;
          if (dup) {
            insights = insights.map((i) => (i.id === dup.id ? { ...i, sourceRef: { ...i.sourceRef, excerpt: `${i.sourceRef.excerpt}\n— ${d.sourceRef.from}: ${d.sourceRef.excerpt}` } } : i));
            return;
          }
          const ins: AiInsight = { ...d, id: uid("ai"), status: "pending", createdAt: new Date().toISOString(), reviewedBy: null, reviewedAt: null, reviewNote: "", appliedEntityId: null };
          created.push(ins);
          insights.push(ins);
          audit.push(mkAudit({ projectId: d.projectId, kind: "create", entity: "insight", entityId: ins.id, label: `AI önerisi oluştu (${d.source === "teams" ? "Teams" : "E-posta"}) — ${d.kind}` }));
        });
        return { ...s, insights, audit };
      });
      return created;
    };

    const api: Ctx = {
    state,
    userId,
    createProject: (input) => {
      const project: Project = {
        ...input, id: uid("p"), health: "green", healthReason: "", teams: [], desiredModules: [], discoveryAnswers: {}, teamInfo: {},
        installType: null, llmChoice: null, createdAt: new Date().toISOString(),
        integrations: structuredClone(DEFAULT_PROJECT_INTEGRATIONS), noCommitments: false,
      };
      setState((s) => {
        const { phases, steps } = buildFromTemplate(project, s.users, {}, s.template);
        const plan = projectPlan(phases, steps, project.startDate);
        phases.forEach((ph) => {
          const d = plan.phases[ph.id];
          if (!d) return;
          ph.planStart = ph.planStart ?? d.start;
          ph.planEnd = ph.planEnd ?? d.end;
          ph.baselineEnd = ph.baselineEnd ?? d.end;
        });
        return {
          ...s,
          projects: [...s.projects, project],
          phases: [...s.phases, ...phases],
          steps: [...s.steps, ...steps],
          audit: [...s.audit, mkAudit({ projectId: project.id, kind: "create", entity: "project", entityId: project.id, label: `Proje oluşturuldu — aşamalar ve adımlar şablondan kopyalandı, akış başlatıldı` })],
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
    updatePhase: (id, p, reason) => {
      const ph = state.phases.find((x) => x.id === id);
      if (!ph) return "Aşama bulunamadı";
      if (p.status && p.status !== ph.status) {
        if (ph.status === "locked") return "Aşamanın sırası gelmedi";
        if (p.status === "locked") return "\"Sırası gelmedi\" elle seçilemez";
        if (p.status === "late" || p.status === "at_risk") return "\"Gecikti\" ve \"Risk altında\" uyarılardan otomatik belirlenir";
      }
      patch<Phase>("phases", id, p, reason);
      return null;
    },
    completePhase: (id) => {
      const ph = state.phases.find((x) => x.id === id);
      if (!ph) return "Aşama bulunamadı";
      if (ph.status === "locked") return "Aşamanın sırası gelmedi";
      const open = state.steps.filter((s) => s.phaseId === id && s.required && s.status !== "done" && s.status !== "out_of_scope");
      if (open.length) return `${open.length} zorunlu adım tamamlanmadı`;
      patch<Phase>("phases", id, { status: "done", actualEnd: todayISO(), actualStart: ph.actualStart ?? todayISO(), approvedBy: userId, approvedAt: new Date().toISOString() });
      return null;
    },
    updateStep: (id, p, reason) => {
      const old = state.steps.find((s) => s.id === id);
      if (!old) return "Adım bulunamadı";
      const lockErr = stepLockError(old, p.status);
      if (lockErr) return lockErr;
      const manualErr = manualStatusError(old, p.status);
      if (manualErr) return manualErr;
      const changes = { ...p };
      if (p.ball && p.ball !== old.ball) changes.ballSince = new Date().toISOString();
      patch<Step>("steps", id, changes, reason);
      return null;
    },
    addAction: (a) => add<Action>("actions", { ...a, isCustomerVisible: a.isCustomerVisible ?? !(a.ruleKey ?? "").startsWith("phase_approval:"), id: uid("a"), createdAt: new Date().toISOString() }),
    updateAction: (id, p, reason) => patch<Action>("actions", id, p, reason),
    addMeeting: (m, actions) => {
      const meeting: Meeting = { ...m, isCustomerVisible: m.isCustomerVisible ?? false, id: uid("m") };
      add<Meeting>("meetings", meeting, `Toplantı kaydedildi`);
      setState((s) => applyMeetingHeldRules(s, meeting, mkAudit));
      actions.forEach((a) =>
        add<Action>("actions", { ...a, isCustomerVisible: a.isCustomerVisible ?? true, id: uid("a"), projectId: m.projectId, source: "meeting", meetingId: meeting.id, createdAt: new Date().toISOString() }),
      );
      return meeting.id;
    },
    updateMeeting: (id, p, reason) => {
      const old = state.meetings.find((m) => m.id === id);
      if (!old) return "Toplantı bulunamadı";
      if (p.status && p.status !== old.status) {
        if (old.status !== "planned") return "Yalnızca Planlandı toplantının durumu değiştirilebilir";
        if (p.status === "cancelled" && !reason?.trim()) return "İptal için gerekçe zorunlu";
      }
      if (old.status === "held" && ((p.type && p.type !== old.type) || (p.date && p.date !== old.date)) && !reason?.trim()) {
        return "Yapılmış toplantının tür/tarih değişikliğinde gerekçe zorunlu";
      }
      patch<Meeting>("meetings", id, p, reason);
      if (p.status === "held") {
        setState((s) => {
          const m = s.meetings.find((x) => x.id === id);
          return m ? applyMeetingHeldRules(s, m, mkAudit) : s;
        });
      }
      return null;
    },
    addContact: (c) => add<Contact>("contacts", { ...c, id: uid("c") }),
    updateContact: (id, p) => patch<Contact>("contacts", id, p),
    addCommitment: (c) => {
      setState((s) => {
        const commitment: Commitment = { ...c, id: uid("cm") };
        let next: RqState = { ...s, commitments: [...s.commitments, commitment], audit: [...s.audit, mkAudit({ projectId: c.projectId, kind: "create", entity: "commitment", entityId: commitment.id, label: commitment.text })] };
        const project = next.projects.find((p) => p.id === c.projectId);
        if (project?.noCommitments) {
          next = {
            ...next,
            projects: next.projects.map((p) => (p.id === c.projectId ? { ...p, noCommitments: false } : p)),
            audit: [...next.audit, mkAudit({ projectId: c.projectId, kind: "update", entity: "project", entityId: c.projectId, label: "Taahhüt yok", field: "noCommitments", oldValue: "true", newValue: "false", reason: "Otomatik kural: taahhüt eklendi" })],
          };
        }
        return next;
      });
    },
    updateCommitment: (id, p, reason) => patch<Commitment>("commitments", id, p, reason, (base) => {
      const c = base.commitments.find((x) => x.id === id);
      if (!c) return {};
      const open = base.commitments.filter((x) => x.projectId === c.projectId && x.status === "open");
      if (!open.length) return setStepByKey(base, c.projectId, "commit_check", { status: "done" }, mkAudit, "Otomatik kural: açık taahhüt kalmadı");
      return {};
    }),
    setNoCommitments: (projectId, value) => {
      const p = state.projects.find((x) => x.id === projectId);
      if (!p) return "Proje bulunamadı";
      if (value && state.commitments.some((c) => c.projectId === projectId)) return "Taahhüt varken 'Taahhüt yok' işaretlenemez";
      patch<Project>("projects", projectId, { noCommitments: value });
      return null;
    },
    addTeam: (projectId, team) => {
      setState((s) => {
        const project = s.projects.find((p) => p.id === projectId);
        const phase = s.phases.find((p) => p.projectId === projectId && p.code === "05");
        if (!project || !phase || project.teams.includes(team) || team.trim().toLowerCase() === "general") return s;
        const phaseDone = phase.status === "done";
        const phaseClosed = phaseDone || phase.status === "out_of_scope";
        const phaseSteps = s.steps.filter((x) => x.phaseId === phase.id);
        const start = phaseSteps.length ? Math.max(...phaseSteps.map((x) => x.order)) + 1 : 0;
        const newStep: Step = {
          id: uid("st"), projectId, phaseId: phase.id, title: `Uyarlama: ${team}`, required: true, key: `adapt:${team}`,
          completion: "data", dependency: "independent", durationDays: 10, ownerId: project.csmId, ball: "csm",
          ballSince: new Date().toISOString(), due: null, status: phaseClosed ? "out_of_scope" : "locked", order: start, activatedAt: null,
        };
        const createReason = phaseDone
          ? "Otomatik kural: takım eklendi — 05 Uyarlama aşaması tamamlanmıştı"
          : phase.status === "out_of_scope"
            ? "Otomatik kural: takım eklendi — 05 Uyarlama aşaması kapsam dışı"
            : undefined;
        let next: RqState = {
          ...s,
          projects: s.projects.map((p) => (p.id === projectId ? { ...p, teams: [...p.teams, team] } : p)),
          steps: [...s.steps, newStep],
          audit: [
            ...s.audit,
            mkAudit({ projectId, kind: "create", entity: "project", entityId: projectId, label: `Takım eklendi: ${team} — Uyarlama aşamasına adım açıldı (otomatik kural)` }),
            mkAudit({ projectId, kind: "create", entity: "step", entityId: newStep.id, label: `${newStep.title} — adım açıldı`, reason: createReason }),
          ],
        };
        if (phaseDone) {
          next = ensureReviewAction(next, projectId, newStep, mkAudit, `Takım eklendi: ${team}; 05 Uyarlama tamamlanmıştı`);
        } else if (!phaseClosed) {
          const general = next.steps.find((x) => x.projectId === projectId && x.key === "adapt:general");
          if (general && general.status !== "done" && general.status !== "out_of_scope") {
            const rec = next.adaptations.find((a) => a.projectId === projectId && a.teamId === null);
            const hasMark = rec ? Object.values(rec.checklist).some(Boolean) : false;
            if (!hasMark) next = setStepByKey(next, projectId, "adapt:general", { status: "out_of_scope" }, mkAudit, "Otomatik kural: takım tanımlandı");
          }
        }
        return next;
      });
    },
    setTeamInfo: (projectId, team, info) => {
      const p = state.projects.find((x) => x.id === projectId);
      if (p) patch<Project>("projects", projectId, { teamInfo: { ...p.teamInfo, [team]: info } });
    },
    setInstallChoice: (projectId, kp, reason) => {
      const old = state.projects.find((p) => p.id === projectId);
      if (!old) return { error: "Proje bulunamadı", summary: null };
      const choiceErr = installChoiceError(old, kp, reason);
      if (choiceErr) return { error: choiceErr, summary: null };
      let summary: string | null = null;
      let runtimeError: string | null = null;
      setState((s) => {
        const cur = s.projects.find((p) => p.id === projectId);
        if (!cur) return s;
        const revalidateErr = installChoiceError(cur, kp, reason);
        if (revalidateErr) { runtimeError = revalidateErr; return s; }
        const audit: AuditEntry[] = [];
        (Object.keys(kp) as (keyof typeof kp)[]).forEach((k) => {
          if (str(cur[k]) !== str(kp[k])) {
            audit.push(mkAudit({ projectId, kind: "update", entity: "project", entityId: projectId, label: "Kurulum ve LLM", field: k, oldValue: str(cur[k]), newValue: str(kp[k]), reason }));
          }
        });
        if (!audit.length) return s;
        let next: RqState = { ...s, projects: s.projects.map((p) => (p.id === projectId ? { ...p, ...kp } : p)), audit: [...s.audit, ...audit] };
        if (kp.installType && kp.installType !== cur.installType) {
          next = applyInstallType(next, projectId, kp.installType, mkAudit, reason, cur.installType);
        }
        if (kp.llmChoice && kp.llmChoice !== cur.llmChoice) {
          next = applyLlmChoice(next, projectId, kp.llmChoice, mkAudit, reason, cur.llmChoice);
        }
        summary = installChoiceSummary(s, next, projectId);
        return next;
      });
      if (runtimeError) return { error: runtimeError, summary: null };
      return { error: null, summary };
    },
    addKpi: (k) => add<Kpi>("kpis", { ...k, isCustomerVisible: k.isCustomerVisible ?? true, id: uid("k"), measurements: [] }),
    updateKpi: (id, p) => patch<Kpi>("kpis", id, p),
    addMeasurement: (kpiId, m) => {
      const k = state.kpis.find((x) => x.id === kpiId);
      if (k) patch<Kpi>("kpis", kpiId, { measurements: [...k.measurements, m].sort((a, b) => a.date.localeCompare(b.date)) });
    },
    setAdaptationCheck: (projectId, teamId, item, value) => {
      const project = state.projects.find((p) => p.id === projectId);
      if (!project) return "Proje bulunamadı";
      if (teamId !== null && !project.teams.includes(teamId)) return "Takım bulunamadı";
      const teamLabel = teamId ?? "Genel";
      setState((s) => {
        let rec = s.adaptations.find((a) => a.projectId === projectId && a.teamId === teamId);
        let next = s;
        if (!rec) {
          rec = { id: uid("ad"), projectId, teamId, checklist: { projectCreated: false, docsIdentified: false, docsUploaded: false, aiTrained: false, firstSamples: false } };
          next = { ...next, adaptations: [...next.adaptations, rec], audit: [...next.audit, mkAudit({ projectId, kind: "create", entity: "adaptation", entityId: rec.id, label: `Uyarlama: ${teamLabel}` })] };
        }
        const oldValue = rec.checklist[item];
        if (oldValue === value) return next;
        const updatedRec: Adaptation = { ...rec, checklist: { ...rec.checklist, [item]: value } };
        next = {
          ...next,
          adaptations: next.adaptations.map((a) => (a.id === rec!.id ? updatedRec : a)),
          audit: [...next.audit, mkAudit({
            projectId, kind: "update", entity: "adaptation", entityId: rec.id, label: `Uyarlama: ${teamLabel} — ${ADAPTATION_ITEM_LABEL[item]}`,
            field: `checklist.${item}`, oldValue: String(oldValue), newValue: String(value),
          })],
        };
        return next;
      });
      return null;
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
    },
    addAlert: (a) => add<Alert>("alerts", { ...a, id: uid("al"), status: "open", source: "manual", createdAt: new Date().toISOString(), resolvedAt: null, resolvedBy: null }, `Uyarı eklendi — ${a.title}`),
    snoozeAlert: (key, until, reason) => {
      if (!reason.trim()) return "Gerekçe zorunlu";
      if (!until || until <= todayISO()) return "Erteleme tarihi bugünden sonra olmalı";
      const v = allAlerts(state, todayISO()).find((a) => a.key === key);
      if (!v) return "Uyarı bulunamadı";
      setState((s) => ({
        ...s,
        alertStates: [...s.alertStates.filter((x) => x.key !== key), { key, status: "snoozed", snoozedUntil: until, reason: reason.trim(), by: userId, at: new Date().toISOString() }],
        audit: [...s.audit, mkAudit({ projectId: v.projectId, kind: "update", entity: "alert", entityId: key, label: `Uyarı ertelendi — ${v.title}`, field: "status", oldValue: v.status, newValue: `snoozed (${until.split("-").reverse().join(".")})`, reason: reason.trim() })],
      }));
      return null;
    },
    closeAlert: (key, reason) => {
      if (!reason.trim()) return "Gerekçe zorunlu";
      const v = allAlerts(state, todayISO()).find((a) => a.key === key);
      if (!v) return "Uyarı bulunamadı";
      setState((s) => ({
        ...s,
        alerts: v.manual ? s.alerts.map((a) => (a.id === v.entityId ? { ...a, status: "resolved" as const, resolvedAt: new Date().toISOString(), resolvedBy: userId } : a)) : s.alerts,
        alertStates: [...s.alertStates.filter((x) => x.key !== key), { key, status: "closed", snoozedUntil: null, reason: reason.trim(), by: userId, at: new Date().toISOString() }],
        audit: [...s.audit, mkAudit({ projectId: v.projectId, kind: "update", entity: "alert", entityId: key, label: `Uyarı kapatıldı — ${v.title}`, field: "status", oldValue: v.status, newValue: "closed", reason: reason.trim() })],
      }));
      return null;
    },
    resolveAlert: (id) => patch<Alert>("alerts", id, { status: "resolved", resolvedAt: new Date().toISOString(), resolvedBy: userId }),
    addTicket: (t) => {
      if ((t.status === "resolved" || t.status === "closed") && !t.resolution.trim()) return "Çözüm metni zorunlu";
      add<SupportTicket>("tickets", { ...t, id: uid("tk"), openedAt: new Date().toISOString(), resolvedAt: null }, `Destek kaydı açıldı — ${t.title}`);
      if (t.priority === "high") {
        setState((s) => ({
          ...s,
          alerts: [...s.alerts, { id: uid("al"), projectId: t.projectId, title: `Yüksek öncelikli destek kaydı: ${t.title}`, detail: t.description, severity: "warning" as const, status: "open" as const, source: "rule" as const, createdAt: new Date().toISOString(), resolvedAt: null, resolvedBy: null }],
          audit: [...s.audit, mkAudit({ projectId: t.projectId, kind: "create", entity: "alert", entityId: "auto", label: `Yüksek öncelikli destek kaydı uyarısı — ${t.title}`, reason: "Otomatik kural: yüksek öncelikli ticket" })],
        }));
      }
      return null;
    },
    updateTicket: (id, p, reason) => {
      const old = state.tickets.find((t) => t.id === id);
      if (!old) return "Kayıt bulunamadı";
      const nx = { ...old, ...p };
      if ((nx.status === "resolved" || nx.status === "closed") && !nx.resolution.trim()) return "Çözüm metni olmadan kayıt Çözüldü/Kapatıldı yapılamaz";
      const changes = { ...p };
      if (old && (p.status === "resolved" || p.status === "closed") && !old.resolvedAt) changes.resolvedAt = new Date().toISOString();
      patch<SupportTicket>("tickets", id, changes, reason);
      return null;
    },
    addRisk: (r) => add<RiskDecision>("risks", { ...r, id: uid("r"), createdAt: new Date().toISOString() }, `${r.kind === "risk" ? "Risk" : "Karar"} eklendi — ${r.title}`),
    updateRisk: (id, p, reason) => {
      const old = state.risks.find((x) => x.id === id);
      if (!old) return "Kayıt bulunamadı";
      if (((p.status && p.status !== old.status) || (p.due !== undefined && p.due !== old.due)) && !reason?.trim()) {
        return "Durum veya termin değişikliğinde gerekçe zorunlu";
      }
      patch<RiskDecision>("risks", id, p, reason);
      return null;
    },
    approveGoLive: (projectId, contactId, approvedAt, reason) => {
      const contact = state.contacts.find((c) => c.id === contactId && c.projectId === projectId);
      if (!contact) return "Onaylayan müşteri kişisini seçin";
      if (!approvedAt) return "Onay tarihi zorunlu";
      if (!reason.trim()) return "Onay notu zorunlu";
      const gonogo = state.steps.find((s) => s.projectId === projectId && s.key === "gonogo");
      if (!gonogo || gonogo.status !== "done") return "Önce Go/No-Go toplantısını kaydedin";
      const openCommits = state.commitments.filter((c) => c.projectId === projectId && c.status === "open");
      if (openCommits.length) return `${openCommits.length} açık taahhüt var — önce kapatın veya karşılanamadı olarak işaretleyin`;
      const phase = state.phases.find((p) => p.projectId === projectId && p.code === "07");
      setState((s) => {
        let next = setStepByKey(s, projectId, "customer_approval", { status: "done" }, mkAudit, reason);
        const approval = { contactId, approvedAt, recordedBy: userId, recordedAt: new Date().toISOString() };
        next = {
          ...next,
          projects: next.projects.map((p) => (p.id === projectId ? { ...p, goLiveApproval: approval } : p)),
          audit: [...next.audit, mkAudit({ projectId, kind: "update", entity: "project", entityId: projectId, label: `Go-Live müşteri onayı — ${contact.name}${contact.title ? ` (${contact.title})` : ""}, ${approvedAt.split("-").reverse().join(".")}`, field: "goLiveApproval", newValue: contact.name, reason })],
        };
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
    createCustomerReport: (projectId, weekStart) => {
      if (!state.projects.some((p) => p.id === projectId)) return null;
      const ws = weekStartOf(weekStart);
      const ex = state.customerReports.find((r) => r.projectId === projectId && r.weekStart === ws);
      if (ex) return ex.id;
      const snap = buildReportSnapshot(state, projectId, ws, todayISO());
      const rep: CustomerReport = { id: uid("rep"), projectId, weekStart: ws, createdBy: userId, createdAt: new Date().toISOString(), status: "draft", sentAt: null, sentBy: null, summary: "", nextWeek: defaultNextWeek(snap), snapshot: snap as unknown as Record<string, unknown> };
      setState((s) => ({ ...s, customerReports: [...s.customerReports, rep], audit: [...s.audit, mkAudit({ projectId, kind: "create", entity: "report", entityId: rep.id, label: `Haftalık rapor taslağı oluşturuldu — ${ws.split("-").reverse().join(".")} haftası` })] }));
      return rep.id;
    },
    updateCustomerReport: (id, p) => {
      const r = state.customerReports.find((x) => x.id === id);
      if (!r) return "Rapor bulunamadı";
      if (r.status === "sent") return "Gönderilmiş rapor düzenlenemez";
      const fields = (["summary", "nextWeek"] as const).filter((k) => p[k] !== r[k]);
      if (!fields.length) return null;
      setState((s) => ({
        ...s,
        customerReports: s.customerReports.map((x) => (x.id === id ? { ...x, ...p } : x)),
        audit: [...s.audit, ...fields.map((k) => mkAudit({ projectId: r.projectId, kind: "update" as const, entity: "report", entityId: id, label: "Haftalık rapor", field: k, oldValue: r[k], newValue: p[k] }))],
      }));
      return null;
    },
    markReportSent: (id) => {
      const r = state.customerReports.find((x) => x.id === id);
      if (!r) return "Rapor bulunamadı";
      if (r.status === "sent") return "Rapor zaten gönderildi";
      const now = new Date().toISOString();
      setState((s) => ({
        ...s,
        customerReports: s.customerReports.map((x) => (x.id === id ? { ...x, status: "sent" as const, sentAt: now, sentBy: userId } : x)),
        audit: [...s.audit, mkAudit({ projectId: r.projectId, kind: "update", entity: "report", entityId: id, label: `Haftalık rapor gönderildi — ${r.weekStart.split("-").reverse().join(".")} haftası`, field: "status", oldValue: "draft", newValue: "sent" })],
      }));
      return null;
    },
    addUser: (u) => {
      const email = u.email.trim().toLowerCase();
      if (!u.name.trim() || !email.includes("@")) return "Ad ve geçerli e-posta zorunlu";
      if (state.users.some((x) => x.email.toLowerCase() === email)) return "Bu e-posta zaten kayıtlı";
      const nu: User = { id: uid("u"), name: u.name.trim(), email, role: u.role, active: true };
      setState((s) => ({ ...s, users: [...s.users, nu], audit: [...s.audit, mkAudit({ projectId: "system", kind: "create", entity: "config", entityId: "users", label: `Kullanıcı eklendi: ${nu.name} (${nu.email})`, field: "users" })] }));
      return null;
    },
    updateUser: (id, p) => {
      const u = state.users.find((x) => x.id === id);
      if (!u) return "Kullanıcı bulunamadı";
      const activeAdmins = state.users.filter((x) => x.role === "admin" && x.active !== false);
      const losesAdmin = u.role === "admin" && u.active !== false && ((p.role && p.role !== "admin") || p.active === false);
      if (losesAdmin && activeAdmins.length <= 1) return "Son aktif admin pasifleştirilemez ve rolü değiştirilemez";
      const changes = (Object.keys(p) as (keyof typeof p)[]).filter((k) => p[k] !== undefined && p[k] !== u[k]);
      if (!changes.length) return null;
      setState((s) => ({
        ...s,
        users: s.users.map((x) => (x.id === id ? { ...x, ...p } : x)),
        audit: [...s.audit, ...changes.map((k) => mkAudit({ projectId: "system", kind: "update" as const, entity: "config", entityId: "users", label: `Kullanıcı güncellendi: ${u.name}`, field: k, oldValue: String(u[k]), newValue: String(p[k]) }))],
      }));
      return null;
    },
    setConfig: (key, val, label) => setState((s) => {
      let lbl = label;
      if (key === "integrations") {
        const o = s.integrations, n = val as IntegrationConfig;
        const changed: string[] = [];
        if (o.chat.teams.clientSecret !== n.chat.teams.clientSecret) changed.push("Teams client secret");
        if (o.email.clientSecret !== n.email.clientSecret) changed.push("E-posta client secret");
        if (o.email.password !== n.email.password) changed.push("IMAP şifresi");
        if (changed.length) lbl += ` (${changed.join(", ")} değiştirildi)`;
      }
      return { ...s, [key]: val, audit: [...s.audit, mkAudit({ projectId: "system", kind: "update", entity: "config", entityId: key, label: lbl, field: key })] };
    }),
    testConnection: (kind, override) => new Promise((resolve) => {
      setTimeout(() => {
        const cfg = override ?? state.integrations;
        let missing: string[] = [];
        if (kind === "teams") {
          const t = cfg.chat.teams;
          missing = [!t.tenantId && "Tenant ID", !t.clientId && "Client ID", !t.clientSecret && "Client secret"].filter(Boolean) as string[];
        } else {
          const e = cfg.email;
          missing = (e.provider === "m365"
            ? [!e.mailbox && "Posta kutusu", !e.tenantId && "Tenant ID", !e.clientId && "Client ID", !e.clientSecret && "Client secret"]
            : [!e.mailbox && "Posta kutusu", !e.imapHost && "IMAP sunucusu", !e.imapPort && "Port", !e.username && "Kullanıcı adı", !e.password && "Şifre"]).filter(Boolean) as string[];
        }
        const ok = missing.length === 0;
        const message = ok ? (kind === "teams" ? `${state.chatChannels.length} kanal bulundu` : "Posta kutusuna bağlanıldı") : `Eksik alan: ${missing.join(", ")}`;
        setState((s) => {
          const now = new Date().toISOString();
          const integrations = structuredClone(s.integrations);
          if (kind === "teams") Object.assign(integrations.chat.teams, { connected: ok, status: ok ? "connected" : "error", statusMessage: ok ? "" : message, lastSyncAt: ok ? now : integrations.chat.teams.lastSyncAt });
          else Object.assign(integrations.email, { status: ok ? "connected" : "error", statusMessage: ok ? "" : message, lastSyncAt: ok ? now : integrations.email.lastSyncAt });
          return { ...s, integrations, audit: [...s.audit, sysAudit(`${kind === "teams" ? "Teams" : "E-posta"} bağlantı testi: ${ok ? "başarılı" : "hata — " + message}`)] };
        });
        resolve({ ok, message, channels: kind === "teams" && ok ? state.chatChannels : undefined });
      }, 800);
    }),
    disconnect: (kind) => setState((s) => {
      const integrations = structuredClone(s.integrations);
      if (kind === "teams") Object.assign(integrations.chat.teams, { connected: false, status: "disconnected", statusMessage: "" });
      else Object.assign(integrations.email, { enabled: false, status: "disconnected", statusMessage: "" });
      return { ...s, integrations, audit: [...s.audit, sysAudit(`${kind === "teams" ? "Teams" : "E-posta"} bağlantısı kesildi`)] };
    }),
    logSecretView: (field) => setState((s) => ({ ...s, audit: [...s.audit, sysAudit(`Gizli alan görüntülendi — ${field}`, { kind: "view" })] })),
    setProjectIntegration: (projectId, p) => {
      const proj = state.projects.find((x) => x.id === projectId);
      if (!proj) return "Proje bulunamadı";
      const next: ProjectIntegrations = { chat: { ...proj.integrations.chat, ...p.chat }, email: { ...proj.integrations.email, ...p.email } };
      if (next.chat.channelId) {
        const other = state.projects.find((x) => x.id !== projectId && x.integrations.chat.channelId === next.chat.channelId && x.integrations.chat.active);
        if (other) return `Bu kanal zaten "${other.customerName}" projesine bağlı`;
      }
      const now = new Date().toISOString();
      if (next.chat.active && !proj.integrations.chat.active) next.chat.since = now;
      if (next.chat.channelId !== proj.integrations.chat.channelId && next.chat.active) next.chat.since = now;
      if (next.email.active && !proj.integrations.email.active) next.email.since = now;
      const labels: string[] = [];
      const chName = (id: string | null) => { const c = state.chatChannels.find((x) => x.id === id); return c ? `${c.teamName} › ${c.channelName}` : "—"; };
      if (next.chat.channelId !== proj.integrations.chat.channelId) labels.push(`Sohbet kanalı: ${chName(proj.integrations.chat.channelId)} → ${chName(next.chat.channelId)}`);
      if (next.chat.active !== proj.integrations.chat.active) labels.push(`Sohbet takibi ${next.chat.active ? "aktif" : "pasif"}`);
      if (next.email.active !== proj.integrations.email.active) labels.push(`E-posta takibi ${next.email.active ? "aktif" : "pasif"}`);
      if (next.email.extraDomains.join() !== proj.integrations.email.extraDomains.join()) labels.push(`Ek domainler: ${next.email.extraDomains.join(", ") || "—"}`);
      setState((s) => ({
        ...s,
        projects: s.projects.map((x) => (x.id === projectId ? { ...x, integrations: next } : x)),
        audit: [...s.audit, ...labels.map((l) => mkAudit({ projectId, kind: "update" as const, entity: "integration", entityId: projectId, label: l }))],
      }));
      return null;
    },
    approveInsight: (id, edited, note) => {
      const ins = state.insights.find((i) => i.id === id);
      if (!ins || ins.status !== "pending") return "Öneri bulunamadı veya zaten incelendi";
      const v = { ...ins.proposed, ...(edited ?? {}) } as InsightProposedAny;
      const reason = `AI Insight onaylandı (${ins.source === "teams" ? "Teams" : "E-posta"}): ${ins.rationale}${note ? ` — Not: ${note}` : ""}`;
      let applied: string | null = ins.targetId;
      switch (ins.kind) {
        case "action_create": {
          const aid = uid("a");
          applied = aid;
          setState((s) => ({
            ...s,
            actions: [...s.actions, { id: aid, projectId: ins.projectId, title: String(v.title ?? "AI aksiyonu"), ownerId: v.ownerId ?? null, ball: v.ball ?? "csm", due: v.due ?? null, priority: v.priority ?? "medium", status: "open", source: ins.source, meetingId: null, createdAt: new Date().toISOString(), insightId: ins.id, isCustomerVisible: true }],
            audit: [...s.audit, mkAudit({ projectId: ins.projectId, kind: "create", entity: "action", entityId: aid, label: String(v.title), reason })],
          }));
          break;
        }
        case "action_update": if (ins.targetId) api.updateAction(ins.targetId, v as Partial<Action>, reason); break;
        case "step_update": {
          if (!ins.targetId) break;
          const err = api.updateStep(ins.targetId, v as Partial<Step>, reason);
          if (err) return err;
          break;
        }
        case "risk_create":
        case "decision_create": {
          const rid = uid("r");
          applied = rid;
          const kind = ins.kind === "risk_create" ? "risk" as const : "decision" as const;
          setState((s) => ({
            ...s,
            risks: [...s.risks, { id: rid, projectId: ins.projectId, kind, title: String(v.title), description: String(v.description ?? ""), impact: v.impact ?? "medium", status: kind === "risk" ? "open" : "accepted", ownerId: null, due: null, createdAt: new Date().toISOString(), probability: "medium", mitigation: "", meetingId: null, decidedAt: kind === "decision" ? todayISO() : null, isCustomerVisible: false }],
            audit: [...s.audit, mkAudit({ projectId: ins.projectId, kind: "create", entity: "risk", entityId: rid, label: `${kind === "risk" ? "Risk" : "Karar"} eklendi — ${v.title}`, reason })],
          }));
          break;
        }
        case "health_change": api.updateProject(ins.projectId, { health: v.health, healthReason: v.healthReason ?? "" }, reason); break;
        case "date_change":
          if (v.phaseId) { applied = v.phaseId; api.updatePhase(v.phaseId, { planEnd: v.planEnd }, reason); }
          else api.updateProject(ins.projectId, { goLiveDate: v.goLiveDate }, reason);
          break;
      }
      setState((s) => ({
        ...s,
        insights: s.insights.map((i) => (i.id === id ? { ...i, status: "approved", reviewedBy: userId, reviewedAt: new Date().toISOString(), reviewNote: note ?? "", appliedEntityId: applied, proposed: v } : i)),
        audit: [...s.audit, mkAudit({ projectId: ins.projectId, kind: "update", entity: "insight", entityId: id, label: `AI önerisi onaylandı`, reason })],
      }));
      return null;
    },
    rejectInsight: (id, note) => api.rejectInsights([id], note),
    rejectInsights: (ids, note) => setState((s) => ({
      ...s,
      insights: s.insights.map((i) => (ids.includes(i.id) && i.status === "pending" ? { ...i, status: "rejected", reviewedBy: userId, reviewedAt: new Date().toISOString(), reviewNote: note ?? "" } : i)),
      audit: [...s.audit, ...s.insights.filter((i) => ids.includes(i.id) && i.status === "pending").map((i) => mkAudit({ projectId: i.projectId, kind: "update" as const, entity: "insight", entityId: i.id, label: "AI önerisi reddedildi", reason: note || undefined }))],
    })),
    assignUnmatchedEmail: (id, projectId, addAsContact) => {
      const m = state.unmatchedEmails.find((x) => x.id === id);
      if (!m) return 0;
      setState((s) => ({
        ...s,
        unmatchedEmails: s.unmatchedEmails.map((x) => (x.id === id ? { ...x, status: "assigned", assignedProjectId: projectId } : x)),
        audit: [...s.audit, mkAudit({ projectId, kind: "update", entity: "integration", entityId: id, label: `Eşleşmeyen e-posta projeye atandı — ${m.subject}` })],
      }));
      if (addAsContact) api.addContact({ projectId, name: addAsContact.name, title: "", email: m.from, phone: "", role: addAsContact.role });
      const drafts = analyzeText(state, projectId, "email", m.excerpt, { title: m.subject, from: m.from, at: m.at, direction: m.direction });
      return insertDrafts(drafts).length;
    },
    ignoreUnmatchedEmail: (id) => setState((s) => ({
      ...s,
      unmatchedEmails: s.unmatchedEmails.map((x) => (x.id === id ? { ...x, status: "ignored" } : x)),
      audit: [...s.audit, sysAudit(`Eşleşmeyen e-posta yok sayıldı — ${s.unmatchedEmails.find((x) => x.id === id)?.subject ?? ""}`)],
    })),
    simulateIncoming: (projectId, source, text, meta) => {
      const p = state.projects.find((x) => x.id === projectId);
      if (!p) return { created: [], message: "Proje bulunamadı" };
      if (source === "teams" && (!p.integrations.chat.active || !state.integrations.chat.teams.connected)) return { created: [], message: "Bu projede Teams takibi pasif" };
      if (source === "email" && (!p.integrations.email.active || !state.integrations.email.enabled)) return { created: [], message: "Bu projede E-posta takibi pasif" };
      const created = insertDrafts(analyzeText(state, projectId, source, text, meta));
      return { created, message: created.length ? undefined : "Metinden öneri çıkarılamadı" };
    },
    receiveEmail: (mail) => {
      const { projectId } = matchEmail(state, mail);
      if (projectId) return { projectId, created: insertDrafts(analyzeText(state, projectId, "email", mail.text, { title: mail.subject, from: mail.from, direction: mail.direction })).length };
      const ue: UnmatchedEmail = { id: uid("ue"), from: mail.from, to: mail.to, cc: mail.cc, subject: mail.subject, at: new Date().toISOString(), excerpt: mail.text.slice(0, state.integrations.ai.excerptMaxChars), direction: mail.direction, status: "open", assignedProjectId: null };
      setState((s) => ({ ...s, unmatchedEmails: [ue, ...s.unmatchedEmails], audit: [...s.audit, sysAudit(`E-posta eşleşmedi, kuyruğa alındı — ${mail.subject}`)] }));
      return { projectId: null, created: 0 };
    },
    reset: () => setState(createSeed()),
    templateVersion,
    applyTemplateVersion,
    };
    return api;
  }, [state, userId, patch, add, mkAudit, templateVersion, applyTemplateVersion]);

  return <RqContext.Provider value={value}>{children}</RqContext.Provider>;
}

export function useRq() {
  const c = useContext(RqContext);
  if (!c) throw new Error("useRq must be used within RqProvider");
  return c;
}

/** Hesaplanan + elle eklenen uyarılar (bugüne göre). */
export function useAlertViews(): AlertView[] {
  const { state } = useRq();
  return useMemo(() => allAlerts(state, todayISO()), [state]);
}
export function useComputedAlerts() {
  const { state } = useRq();
  return useMemo(() => computeAlerts(state, todayISO()), [state]);
}

export function projectProgress(state: RqState, projectId: string) {
  const steps = state.steps.filter((s) => s.projectId === projectId && s.status !== "out_of_scope");
  if (!steps.length) return 0;
  return Math.round((steps.filter((s) => s.status === "done").length / steps.length) * 100);
}

export function activePhase(state: RqState, projectId: string) {
  const phases = state.phases.filter((p) => p.projectId === projectId).sort((a, b) => a.order - b.order);
  const act = phases.filter((p) => p.status === "in_progress" || p.status === "at_risk" || p.status === "late");
  return act[0] ?? phases.find((p) => p.status !== "done" && p.status !== "out_of_scope") ?? phases[phases.length - 1];
}

/** Aktif (devam eden/riskte/geciken) aşama sayısı. */
export function activePhaseCount(state: RqState, projectId: string) {
  return state.phases.filter((p) => p.projectId === projectId && (p.status === "in_progress" || p.status === "at_risk" || p.status === "late")).length;
}

export function personName(state: RqState, id: string | null) {
  if (!id) return "—";
  return state.users.find((u) => u.id === id)?.name ?? state.contacts.find((c) => c.id === id)?.name ?? "—";
}

function uniq(arr: string[]): string[] {
  return [...new Set(arr)];
}

/** Önceki ve sonraki state arasında akışın açtığı aşama/adımlar için Türkçe bildirimler. */
function flowMessages(prev: RqState, next: RqState): string[] {
  const oldIds = new Set(prev.projects.map((p) => p.id));
  const prevPh = new Map(prev.phases.map((p) => [p.id, p]));
  const prevSt = new Map(prev.steps.map((s) => [s.id, s]));
  const name = (id: string | null) => next.users.find((u) => u.id === id)?.name ?? next.contacts.find((c) => c.id === id)?.name ?? "atanmamış";
  const msgs: string[] = [];
  const autoDone = next.steps.filter((s) => oldIds.has(s.projectId) && isAutoStep(s) && prevSt.get(s.id)?.status !== "done" && s.status === "done");
  autoDone.forEach((s) => msgs.push(`Tamamlandı: ${s.title}`));
  const opened = next.steps.filter((s) => oldIds.has(s.projectId) && prevSt.get(s.id)?.status === "locked" && s.status === "pending");
  const donePh = next.phases.filter((p) => oldIds.has(p.projectId) && prevPh.get(p.id) && prevPh.get(p.id)!.status !== "done" && p.status === "done");
  donePh.forEach((ph) => {
    const started = next.phases.find((p) => p.projectId === ph.projectId && prevPh.get(p.id)?.status === "locked" && p.status !== "locked");
    const n = started ? opened.filter((s) => s.phaseId === started.id).length : 0;
    msgs.push(started ? `${ph.name} tamamlandı — ${started.name} başladı, ${n} adım açıldı` : `${ph.name} tamamlandı`);
  });
  if (!donePh.length && opened.length) {
    const s = opened[0];
    msgs.push(`Sıradaki adım açıldı: ${s.title} — ${name(s.ownerId)}, termin ${fmtDate(s.due)}${opened.length > 1 ? ` (+${opened.length - 1} adım)` : ""}`);
  }
  return msgs;
}

/** Kurulum ve LLM seçiminin otomatik kurallarla yaptığı değişikliklerin özeti. */
function installChoiceSummary(prev: RqState, next: RqState, projectId: string): string | null {
  const ps = new Map(prev.steps.map((s) => [s.id, s.status]));
  const pa = new Map(prev.actions.map((a) => [a.id, a.status]));
  const steps = next.steps.filter((s) => s.projectId === projectId);
  const oos = steps.filter((s) => s.status === "out_of_scope" && ps.get(s.id) !== "out_of_scope").length;
  const opened = steps.filter((s) => (s.status === "pending" || s.status === "in_progress") && ps.get(s.id) !== s.status && (ps.get(s.id) === undefined || ps.get(s.id) === "locked" || ps.get(s.id) === "out_of_scope")).length;
  const done = steps.filter((s) => s.status === "done" && ps.get(s.id) !== "done").length;
  const acts = next.actions.filter((a) => a.projectId === projectId);
  const aOpen = acts.filter((a) => a.status === "open" && pa.get(a.id) !== "open").length;
  const aCancel = acts.filter((a) => a.status === "cancelled" && pa.get(a.id) !== "cancelled").length;
  const parts = [oos && `${oos} adım kapsam dışı`, opened && `${opened} adım açıldı`, done && `${done} adım tamamlandı`, aOpen && `${aOpen} aksiyon açıldı`, aCancel && `${aCancel} aksiyon iptal edildi`].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}
