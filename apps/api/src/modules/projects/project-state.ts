import type { Action, Meeting, Phase, ProjectCore, RuleEffects, Step } from "@rabbitqa/shared";
import { DEFAULT_THRESHOLDS } from "@rabbitqa/shared/domain/alerts";
import { setActiveHolidays } from "@rabbitqa/shared/domain/business-days";
import { applyStepCompletion } from "@rabbitqa/shared/domain/completion";
import { advanceFlow, type MkAudit } from "@rabbitqa/shared/domain/flow";
import { SEED_INTEGRATIONS, STATE_VERSION, projectFromCore } from "@rabbitqa/shared/domain/seed";
import type { Holiday, PhaseTpl, RqState, User } from "@rabbitqa/shared/domain/types";
import type { Queryable } from "../../db";
import { notFound, reasonRequired } from "../../http/errors";
import {
  actionToRow, insertRow, meetingToRow, phaseToRow, rowToAction, rowToMeeting, rowToPhase, rowToProject, rowToStep, stepToRow,
  updateRow, writeParticipants,
} from "../../db/rows";

// Domain service pattern (docs/PLAN.md M2): load the project into a partial RqState, run the shared rule
// functions unchanged, then write back only what changed. Audit is Faz 2, so rule audits are dropped.

export const noAudit: MkAudit = (e) => ({ ...e, id: "", at: "", userId: "" });

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
    `SELECT mp.meeting_id, mp.kind, mp.participant_id FROM meeting_participants mp JOIN meetings m ON m.id = mp.meeting_id
     WHERE m.project_id = $1 ORDER BY mp.sort_order`,
    [projectId],
  )).rows;
  const meetings = meetingRows.map((r) => rowToMeeting(r, parts.filter((p) => p.meeting_id === r.id)));
  const state = partialState({ ...common, projects: [projectFromCore(project)], phases, steps, actions, meetings });
  return { state, project };
}

export type Effects = Omit<RuleEffects, "project" | "meetings"> & { meetings: Meeting[] };

/** A meeting's columns plus its participants: what decides whether a meeting changed. */
const meetingRow = (m: Meeting) => ({ ...meetingToRow(m), internal_ids: m.internalIds, contact_ids: m.contactIds });

/**
 * Writes the phases, steps, meetings and actions of `projectId` that are new or changed between `before` and `after`.
 * Records are matched by id; "changed" means the persisted columns differ (rows compared, not objects).
 * Returns exactly the written records. Must run inside db.transaction.
 */
export async function persistDiff(tx: Queryable, before: RqState, after: RqState, projectId: string): Promise<Effects> {
  const out: Effects = { phases: [], steps: [], actions: [], meetings: [] };
  const sync = async <T extends Phase | Step | Action | Meeting>(
    table: string, prev: T[], next: T[], toRow: (x: T) => Record<string, unknown>, into: T[],
    write: { insert: (x: T) => Promise<void>; update: (x: T) => Promise<void> } = {
      insert: (x) => insertRow(tx, table, toRow(x)), update: (x) => updateRow(tx, table, toRow(x)),
    },
  ) => {
    const own = (x: T) => x.projectId === projectId;
    const old = new Map(prev.filter(own).map((x) => [x.id, x]));
    const nextIds = new Set(next.filter(own).map((x) => x.id));
    const removed = [...old.keys()].filter((id) => !nextIds.has(id));
    if (removed.length) throw new Error(`persistDiff: ${table} removed (${removed.join(", ")}); deletion is not supported`);
    for (const x of next.filter(own)) {
      const o = old.get(x.id);
      if (!o) await write.insert(x);
      else if (o === x || JSON.stringify(toRow(o)) === JSON.stringify(toRow(x))) continue;
      else await write.update(x);
      into.push(x);
    }
  };
  // phases before steps (FK)
  await sync("phases", before.phases, after.phases, phaseToRow, out.phases);
  await sync("steps", before.steps, after.steps, stepToRow, out.steps);
  await sync("meetings", before.meetings, after.meetings, meetingRow, out.meetings, {
    insert: async (m) => { await insertRow(tx, "meetings", meetingToRow(m)); await writeParticipants(tx, m); },
    update: async (m) => { await updateRow(tx, "meetings", meetingToRow(m)); await writeParticipants(tx, m); },
  });
  await sync("actions", before.actions, after.actions, actionToRow, out.actions);
  return out;
}

/** The reason given with a reason-required change is kept on the record (audit history is Faz 2). */
export async function setLastReason(tx: Queryable, table: "phases" | "steps" | "actions" | "meetings", id: string, reason: string | undefined) {
  if (reason) await tx.query(`UPDATE ${table} SET last_reason = $2 WHERE id = $1`, [id, reason]);
}

export const requireReason = (reason: string | undefined) => {
  if (!reason?.trim()) throw reasonRequired();
  return reason.trim();
};

export interface ChangeOptions {
  /**
   * Meeting writes: complete / reopen the meeting-completion steps from the meetings (completion.ts, only "meeting")
   * before the flow engine runs. Data steps stay with the client (docs/PLAN.md M2a).
   */
  meetingSteps?: boolean;
}

/**
 * Every project write: loads the project, applies `change`, runs the flow engine and writes the difference.
 * Must run inside db.transaction. Returns the written records (RuleEffects without the project).
 */
export async function changeProject(tx: Queryable, projectId: string, change: (s: RqState) => RqState, opts: ChangeOptions = {}): Promise<Effects> {
  const loaded = await loadProjectState(tx, projectId);
  if (!loaded) throw notFound("Proje bulunamadı.");
  const before = loaded.state;
  const now = new Date();
  let after = change(before);
  if (opts.meetingSteps) after = applyStepCompletion(after, projectId, noAudit, now, { only: "meeting" });
  after = advanceFlow(after, projectId, noAudit, now);
  return persistDiff(tx, before, after, projectId);
}

export async function projectIdOf(q: Queryable, table: "phases" | "steps" | "actions" | "meetings", id: string, missing: string): Promise<string> {
  const row = (await q.query<{ project_id: string }>(`SELECT project_id FROM ${table} WHERE id = $1`, [id])).rows[0];
  if (!row) throw notFound(missing);
  return row.project_id;
}

export const replace = <T extends { id: string }>(list: T[], next: T) => list.map((x) => (x.id === next.id ? next : x));
