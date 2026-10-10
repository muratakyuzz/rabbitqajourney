import type { Action, PhasePatch, PhasesWithSteps, ProjectCore, ProjectCreate, RuleEffects, Step, StepPatch, StepsSync } from "@rabbitqa/shared";
import { manualStatusError, stepLockError } from "@rabbitqa/shared/domain/completion";
import { advanceFlow, projectPlan } from "@rabbitqa/shared/domain/flow";
import { todayISO } from "@rabbitqa/shared/domain/labels";
import { cancelReviewAction, ensureReviewAction } from "@rabbitqa/shared/domain/rules";
import { currentRuleAction, isRuleAction } from "@rabbitqa/shared/domain/rule-actions";
import { buildFromTemplate, uid } from "@rabbitqa/shared/domain/seed";
import type { Phase, RqState } from "@rabbitqa/shared/domain/types";
import type { Db, Queryable } from "../../db";
import { currentUserId } from "../../core/current-user";
import { HttpError, badRequest, conflict, notFound, reasonRequired } from "../../http/errors";
import { insertRow, projectToRow } from "../../db/rows";
import {
  findProjectCore, loadCommon, loadProjectState, noAudit, partialState, persistDiff, setLastReason, toDomainProject,
} from "./project-state";

// #1, #3, #4, #5 and the client-rule bridge (docs/PLAN.md M2a). Same rules as the web store unless noted
// in docs/PLAN.md → "Kararlar". Every write: load → change → advanceFlow → persistDiff, in one transaction.

type Effects = Omit<RuleEffects, "project">;

const requireReason = (reason: string | undefined) => {
  if (!reason?.trim()) throw reasonRequired();
  return reason.trim();
};

/** Loads the project, applies `change`, runs the flow engine and writes the difference. */
async function changeProject(tx: Queryable, projectId: string, change: (s: RqState) => RqState): Promise<Effects> {
  const loaded = await loadProjectState(tx, projectId);
  if (!loaded) throw notFound("Proje bulunamadı.");
  const before = loaded.state;
  const after = advanceFlow(change(before), projectId, noAudit, new Date());
  return persistDiff(tx, before, after, projectId);
}

async function projectIdOf(q: Queryable, table: "phases" | "steps", id: string, missing: string): Promise<string> {
  const row = (await q.query<{ project_id: string }>(`SELECT project_id FROM ${table} WHERE id = $1`, [id])).rows[0];
  if (!row) throw notFound(missing);
  return row.project_id;
}

const replace = <T extends { id: string }>(list: T[], next: T) => list.map((x) => (x.id === next.id ? next : x));

// ---- #1 POST /projects ----
export async function createProject(db: Db, input: ProjectCreate): Promise<RuleEffects & { project: ProjectCore }> {
  return db.transaction(async (tx) => {
    const common = await loadCommon(tx);
    const name = (s: string) => s.trim().toLocaleLowerCase("tr");
    const names = (await tx.query<{ customer_name: string }>("SELECT customer_name FROM projects")).rows;
    if (names.some((r) => name(r.customer_name) === name(input.customerName))) {
      throw new HttpError(409, "CONFLICT", "Bu müşteri için zaten bir proje var.", "customerName");
    }
    if (input.csmId && !common.users.some((u) => u.id === input.csmId)) throw badRequest("CSM bulunamadı.", "csmId");
    if (common.templateVersion === null) throw conflict("Aktif aşama şablonu yok.");

    const core: ProjectCore = {
      ...input, id: uid("p"), installType: null, llmChoice: null, teams: [],
      templateVersion: common.templateVersion, createdAt: new Date().toISOString(),
    };
    const project = toDomainProject(core);
    const { phases, steps } = buildFromTemplate(project, common.users, {}, common.template);
    const plan = projectPlan(phases, steps, project.startDate);
    for (const ph of phases) {
      const d = plan.phases[ph.id];
      if (!d) continue;
      ph.planStart = ph.planStart ?? d.start;
      ph.planEnd = ph.planEnd ?? d.end;
      ph.baselineEnd = ph.baselineEnd ?? d.end;
    }
    const before = partialState(common);
    const after = advanceFlow(partialState({ ...common, projects: [project], phases, steps }), project.id, noAudit, new Date());

    await insertRow(tx, "projects", { ...projectToRow(core), created_by: await currentUserId(tx) });
    return { project: core, ...(await persistDiff(tx, before, after, project.id)) };
  });
}

// ---- GET /projects/:projectId/phases ----
export async function listPhases(db: Db, projectId: string): Promise<PhasesWithSteps> {
  const loaded = await loadProjectState(db, projectId);
  if (!loaded) throw notFound("Proje bulunamadı.");
  const { phases, steps } = loaded.state;
  const order = new Map(phases.map((p) => [p.id, p.order]));
  return {
    phases: [...phases].sort((a, b) => a.order - b.order),
    steps: [...steps].sort((a, b) => (order.get(a.phaseId)! - order.get(b.phaseId)!) || a.order - b.order),
  };
}

// ---- #3 PATCH /phases/:id ----
export async function updatePhase(db: Db, id: string, { reason, ...patch }: PhasePatch): Promise<Effects> {
  return db.transaction(async (tx) => {
    const projectId = await projectIdOf(tx, "phases", id, "Aşama bulunamadı.");
    const effects = await changeProject(tx, projectId, (s) => {
      const ph = s.phases.find((x) => x.id === id)!;
      const statusChanged = patch.status !== undefined && patch.status !== ph.status;
      if (statusChanged) {
        if (ph.status === "locked") throw conflict("Aşamanın sırası gelmedi");
        if (patch.status === "locked") throw conflict("\"Sırası gelmedi\" elle seçilemez");
        if (patch.status === "late" || patch.status === "at_risk") throw conflict("\"Gecikti\" ve \"Risk altında\" uyarılardan otomatik belirlenir");
        if (patch.status === "done") throw conflict("Aşamayı tamamlamak için \"Aşamayı tamamla\" kullanılır");
      }
      const datesChanged = (patch.planStart !== undefined && patch.planStart !== ph.planStart)
        || (patch.planEnd !== undefined && patch.planEnd !== ph.planEnd);
      if (statusChanged || datesChanged) requireReason(reason);

      const next: Phase = { ...ph };
      for (const k of ["status", "planStart", "planEnd", "actualStart", "actualEnd"] as const) {
        if (patch[k] !== undefined) Object.assign(next, { [k]: patch[k] });
      }
      // baseline is written once, never changed (INV-07)
      if (next.baselineEnd === null && next.planEnd) next.baselineEnd = next.planEnd;
      return { ...s, phases: replace(s.phases, next) };
    });
    await setLastReason(tx, "phases", id, reason?.trim());
    return effects;
  });
}

// ---- #4 POST /phases/:id/complete ----
export async function completePhase(db: Db, id: string): Promise<Effects> {
  return db.transaction(async (tx) => {
    const projectId = await projectIdOf(tx, "phases", id, "Aşama bulunamadı.");
    const approver = await currentUserId(tx);
    return changeProject(tx, projectId, (s) => {
      const ph = s.phases.find((x) => x.id === id)!;
      if (ph.status === "locked") throw conflict("Aşamanın sırası gelmedi");
      if (ph.status === "done") throw conflict("Aşama zaten tamamlandı");
      const open = s.steps.filter((x) => x.phaseId === id && x.required && x.status !== "done" && x.status !== "out_of_scope");
      if (open.length) throw conflict(`${open.length} zorunlu adım tamamlanmadı`);
      const today = todayISO();
      const next: Phase = {
        ...ph, status: "done", actualEnd: today, actualStart: ph.actualStart ?? today,
        approvedBy: approver, approvedAt: new Date().toISOString(),
      };
      return { ...s, phases: replace(s.phases, next) };
    });
  });
}

// ---- #5 PATCH /steps/:id ----
export async function updateStep(db: Db, id: string, { reason, ...patch }: StepPatch): Promise<Effects> {
  return db.transaction(async (tx) => {
    const projectId = await projectIdOf(tx, "steps", id, "Adım bulunamadı.");
    const effects = await changeProject(tx, projectId, (s) => {
      const old = s.steps.find((x) => x.id === id)!;
      const lockErr = stepLockError(old, patch.status);
      if (lockErr) throw conflict(lockErr);
      const manualErr = manualStatusError(old, patch.status);
      if (manualErr) throw conflict(manualErr);
      const statusChanged = patch.status !== undefined && patch.status !== old.status;
      const dueChanged = patch.due !== undefined && patch.due !== old.due;
      // marking a step done needs no reason (ADR-0004 K1); other manual status changes and due changes do
      if (dueChanged || (statusChanged && patch.status !== "done")) requireReason(reason);

      const next: Step = { ...old };
      for (const k of ["ownerId", "ball", "due", "status", "dependency", "durationDays"] as const) {
        if (patch[k] !== undefined) Object.assign(next, { [k]: patch[k] });
      }
      if (patch.ball && patch.ball !== old.ball) next.ballSince = new Date().toISOString();
      return { ...s, steps: replace(s.steps, next) };
    });
    await setLastReason(tx, "steps", id, reason?.trim());
    return effects;
  });
}

// ---- Bridge: POST /projects/:projectId/steps/sync (origin client-rule) ----
const REOPEN = new Set(["locked", "pending", "in_progress"]);

/**
 * Upserts step records computed by client-side rules. No lock checks (INV-25: rules may bypass the lock).
 * Steps not in the payload are untouched. In a `done` phase the status stays as it is (RUL-05 option A):
 * a step asked back into scope gets a review action instead, a step taken out of scope cancels it.
 * Rule actions are matched by projectId + ruleKey (the server keeps its id) and only
 * status/title/due/ownerId are taken over; an unknown ruleKey is inserted.
 */
export async function syncSteps(db: Db, projectId: string, { steps: incoming, actions: incomingActions }: StepsSync): Promise<Effects> {
  return db.transaction(async (tx) => {
    if (!(await findProjectCore(tx, projectId))) throw notFound("Proje bulunamadı.");
    /** ids already used by another record: such an incoming action gets a new id when inserted */
    const takenIds = new Set<string>();
    for (const [i, a] of incomingActions.entries()) {
      if (!isRuleAction(a)) throw badRequest("Köprüden yalnızca kural aksiyonu (source \"rule\", ruleKey dolu) gönderilebilir.", `actions.${i}.ruleKey`);
      if (a.projectId !== projectId) throw badRequest("Aksiyon bu projeye ait değil.", `actions.${i}.projectId`);
      const row = (await tx.query<{ project_id: string; rule_key: string | null }>("SELECT project_id, rule_key FROM actions WHERE id = $1", [a.id])).rows[0];
      if (row && (row.project_id !== projectId || row.rule_key !== a.ruleKey)) takenIds.add(a.id);
    }
    const ids = new Set<string>();
    for (const [i, st] of incoming.entries()) {
      if (ids.has(st.id)) throw badRequest("Aynı adım iki kez gönderildi.", `steps.${i}.id`);
      ids.add(st.id);
      if (st.projectId !== projectId) throw badRequest("Adım bu projeye ait değil.", `steps.${i}.projectId`);
      const owner = (await tx.query<{ project_id: string }>("SELECT project_id FROM steps WHERE id = $1", [st.id])).rows[0];
      if (owner && owner.project_id !== projectId) throw badRequest("Adım bu projeye ait değil.", `steps.${i}.id`);
    }
    return changeProject(tx, projectId, (s) => {
      let next = s;
      for (const [i, st] of incoming.entries()) {
        const phase = next.phases.find((p) => p.id === st.phaseId);
        if (!phase) throw badRequest("Aşama bu projede yok.", `steps.${i}.phaseId`);
        const existing = next.steps.find((x) => x.id === st.id);
        let record = st;
        if (phase.status === "done") {
          const why = `${phase.code} ${phase.name} tamamlanmıştı`;
          if (existing?.status === "out_of_scope" && REOPEN.has(st.status)) {
            record = { ...st, status: "out_of_scope", due: existing.due, activatedAt: existing.activatedAt };
            next = ensureReviewAction(next, projectId, record, noAudit, why);
          } else if (!existing && st.status === "out_of_scope") {
            next = { ...next, steps: [...next.steps, st] };
            next = ensureReviewAction(next, projectId, st, noAudit, why);
            continue;
          } else if (existing && existing.status !== "out_of_scope" && st.status === "out_of_scope") {
            next = cancelReviewAction(next, projectId, st.id, noAudit, why);
          }
        }
        next = { ...next, steps: existing ? replace(next.steps, record) : [...next.steps, record] };
      }
      for (const a of incomingActions) {
        const match = currentRuleAction(next.actions.filter((x) => x.projectId === projectId && x.ruleKey === a.ruleKey));
        if (match) {
          const merged: Action = { ...match, status: a.status, title: a.title, due: a.due, ownerId: a.ownerId };
          next = { ...next, actions: replace(next.actions, merged) };
        } else {
          next = { ...next, actions: [...next.actions, { ...a, id: takenIds.has(a.id) ? uid("a") : a.id }] };
        }
      }
      return next;
    });
  });
}
