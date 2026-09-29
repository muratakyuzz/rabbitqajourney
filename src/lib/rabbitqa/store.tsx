import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { ADAPTATION_STEPS, buildFromTemplate, createSeed, uid } from "./seed";
import type {
  Action, AuditEntry, Commitment, Contact, Meeting, Phase, Project, RqState, Step,
} from "./types";
import { todayISO } from "./labels";

const KEY = "rabbitqa-demo-state-v1";

function load(): RqState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as RqState;
      if (s.version === 1) return s;
    }
  } catch { /* ignore */ }
  return createSeed();
}

const str = (v: unknown) => (v === null || v === undefined ? "" : Array.isArray(v) ? v.join(", ") : typeof v === "object" ? JSON.stringify(v) : String(v));

type Coll = "projects" | "phases" | "steps" | "actions" | "meetings" | "contacts" | "commitments";
const ENTITY: Record<Coll, string> = {
  projects: "project", phases: "phase", steps: "step", actions: "action", meetings: "meeting", contacts: "contact", commitments: "commitment",
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
        ...input, id: uid("p"), health: "green", healthReason: "", teams: [], desiredModules: [], discoveryAnswers: {}, createdAt: new Date().toISOString(),
      };
      setState((s) => {
        const { phases, steps } = buildFromTemplate(project, s.users);
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
    updateProject: (id, p, reason) => patch<Project>("projects", id, p, reason),
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
      actions.forEach((a) =>
        add<Action>("actions", { ...a, id: uid("a"), projectId: m.projectId, source: "meeting", meetingId: meeting.id, createdAt: new Date().toISOString() }),
      );
    },
    addContact: (c) => add<Contact>("contacts", { ...c, id: uid("c") }),
    updateContact: (id, p) => patch<Contact>("contacts", id, p),
    addCommitment: (c) => add<Commitment>("commitments", { ...c, id: uid("cm") }),
    updateCommitment: (id, p, reason) => patch<Commitment>("commitments", id, p, reason),
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
