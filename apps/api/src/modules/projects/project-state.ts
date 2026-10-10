import type { Action, Phase, ProjectCore, RuleEffects, Step } from "@rabbitqa/shared";
import { DEFAULT_THRESHOLDS } from "@rabbitqa/shared/domain/alerts";
import { setActiveHolidays } from "@rabbitqa/shared/domain/business-days";
import type { MkAudit } from "@rabbitqa/shared/domain/flow";
import { DEFAULT_PROJECT_INTEGRATIONS, SEED_INTEGRATIONS, STATE_VERSION } from "@rabbitqa/shared/domain/seed";
import type { Holiday, Meeting, PhaseTpl, Project, RqState, User } from "@rabbitqa/shared/domain/types";
import type { Queryable } from "../../db";
import {
  actionToRow, insertRow, phaseToRow, rowToAction, rowToPhase, rowToProject, rowToStep, stepToRow, updateRow,
} from "../../db/rows";

// Domain service pattern (docs/PLAN.md M2): load the project into a partial RqState, run the shared rule
// functions unchanged, then write back only what changed. Audit is Faz 2, so rule audits are dropped.

export const noAudit: MkAudit = (e) => ({ ...e, id: "", at: "", userId: "" });

/** A Project for the shared rule functions; fields the API does not own get neutral defaults. */
export function toDomainProject(p: ProjectCore): Project {
  const { templateVersion: _v, ...core } = p;
  return {
    ...core, health: "green", healthReason: "", desiredModules: [], discoveryAnswers: {}, teamInfo: {},
    integrations: structuredClone(DEFAULT_PROJECT_INTEGRATIONS), noCommitments: false,
  };
}

/** RqState with only the slices the API owns; everything else empty. */
export function partialState(s: Pick<RqState, "users" | "holidays" | "template"> & Partial<RqState>): RqState {
  return {
    version: STATE_VERSION, salespeople: [], modules: [], questions: [], projects: [], phases: [], steps: [], actions: [],
    meetings: [], contacts: [], commitments: [], kpis: [], adaptations: [], credentials: [], documents: [], alerts: [], tickets: [],
    risks: [], audit: [], integrations: SEED_INTEGRATIONS, chatChannels: [], insights: [], unmatchedEmails: [],
    alertThresholds: DEFAULT_THRESHOLDS, alertStates: [], reportsSent: [], customerReports: [],
    ...s,
  };
}

export async function loadCommon(q: Queryable): Promise<Pick<RqState, "users" | "holidays" | "template"> & { templateVersion: number | null }> {
  const users = (await q.query<User>("SELECT id, name, email, role, active FROM users ORDER BY id")).rows;
  const holidays = (await q.query<{ date: Date; name: string; half_day: boolean }>("SELECT date, name, half_day FROM holidays ORDER BY date")).rows
    .map((h): Holiday => ({ date: h.date.toISOString().slice(0, 10), name: h.name, halfDay: h.half_day }));
  const tpl = (await q.query<{ version: number; phases: PhaseTpl[] }>("SELECT version, phases FROM template_versions ORDER BY version DESC LIMIT 1")).rows[0];
  // projectPlan uses the module-level calendar; keep it equal to the DB's
  setActiveHolidays(holidays);
  return { users, holidays, template: tpl?.phases ?? [], templateVersion: tpl?.version ?? null };
}

export async function findProjectCore(q: Queryable, projectId: string): Promise<ProjectCore | null> {
  const row = (await q.query("SELECT * FROM projects WHERE id = $1", [projectId])).rows[0];
  return row ? rowToProject(row) : null;
}

/** Project + phases + steps + actions + meetings + template + users + holidays → partial RqState (null if no project). */
export async function loadProjectState(q: Queryable, projectId: string): Promise<{ state: RqState; project: ProjectCore } | null> {
  const project = await findProjectCore(q, projectId);
  if (!project) return null;
  const common = await loadCommon(q);
  const phases = (await q.query("SELECT * FROM phases WHERE project_id = $1 ORDER BY sort_order", [projectId])).rows.map(rowToPhase);
  const steps = (await q.query("SELECT * FROM steps WHERE project_id = $1 ORDER BY phase_id, sort_order", [projectId])).rows.map(rowToStep);
  const actions = (await q.query("SELECT * FROM actions WHERE project_id = $1 ORDER BY created_at, id", [projectId])).rows.map(rowToAction);
  const meetingRows = (await q.query("SELECT * FROM meetings WHERE project_id = $1 ORDER BY date, id", [projectId])).rows;
  const parts = (await q.query<{ meeting_id: string; kind: string; participant_id: string }>(
    "SELECT mp.meeting_id, mp.kind, mp.participant_id FROM meeting_participants mp JOIN meetings m ON m.id = mp.meeting_id WHERE m.project_id = $1",
    [projectId],
  )).rows;
  const meetings = meetingRows.map((r): Meeting => ({
    id: r.id as string, projectId: r.project_id as string, type: r.type as Meeting["type"],
    date: (r.date as Date).toISOString().slice(0, 10), notes: r.notes as string, decisions: r.decisions as string,
    isCustomerVisible: r.is_customer_visible as boolean, status: r.status as Meeting["status"],
    internalIds: parts.filter((p) => p.meeting_id === r.id && p.kind === "user").map((p) => p.participant_id),
    contactIds: parts.filter((p) => p.meeting_id === r.id && p.kind === "contact").map((p) => p.participant_id),
    ...(r.team_id != null ? { teamId: r.team_id as string } : {}),
    ...(r.training != null ? { training: r.training as Meeting["training"] } : {}),
  }));
  const state = partialState({ ...common, projects: [toDomainProject(project)], phases, steps, actions, meetings });
  return { state, project };
}

type Effects = Omit<RuleEffects, "project">;

/**
 * Writes the phases, steps and actions of `projectId` that are new or changed between `before` and `after`.
 * Records are matched by id; "changed" means the persisted columns differ (rows compared, not objects).
 * Returns exactly the written records. Must run inside db.transaction.
 */
export async function persistDiff(tx: Queryable, before: RqState, after: RqState, projectId: string): Promise<Effects> {
  const out: Effects = { phases: [], steps: [], actions: [] };
  const sync = async <T extends Phase | Step | Action>(table: string, prev: T[], next: T[], toRow: (x: T) => Record<string, unknown>, into: T[]) => {
    const own = (x: T) => x.projectId === projectId;
    const old = new Map(prev.filter(own).map((x) => [x.id, x]));
    const nextIds = new Set(next.filter(own).map((x) => x.id));
    const removed = [...old.keys()].filter((id) => !nextIds.has(id));
    if (removed.length) throw new Error(`persistDiff: ${table} removed (${removed.join(", ")}); deletion is not supported`);
    for (const x of next.filter(own)) {
      const o = old.get(x.id);
      if (!o) await insertRow(tx, table, toRow(x));
      else if (o === x || JSON.stringify(toRow(o)) === JSON.stringify(toRow(x))) continue;
      else await updateRow(tx, table, toRow(x));
      into.push(x);
    }
  };
  // phases before steps (FK)
  await sync("phases", before.phases, after.phases, phaseToRow, out.phases);
  await sync("steps", before.steps, after.steps, stepToRow, out.steps);
  await sync("actions", before.actions, after.actions, actionToRow, out.actions);
  return out;
}

/** The reason given with a reason-required change is kept on the record (audit history is Faz 2). */
export async function setLastReason(tx: Queryable, table: "phases" | "steps", id: string, reason: string | undefined) {
  if (reason) await tx.query(`UPDATE ${table} SET last_reason = $2 WHERE id = $1`, [id, reason]);
}
