import fs from "node:fs";
import path from "node:path";
import { newDb, type IMemoryDb } from "pg-mem";
import * as shared from "@rabbitqa/shared";
import { createSeed } from "@rabbitqa/shared/domain/seed";
import type { RqState } from "@rabbitqa/shared/domain/types";

// Faz 1: pg-mem only (docs/PLAN.md). Schema + seed are rebuilt on every boot; a restart resets all data.

export interface QueryResult<R> { rows: R[]; rowCount: number | null }
export interface Queryable {
  query<R = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<QueryResult<R>>;
}
export interface Db extends Queryable {
  /** Every write goes through here (all-or-nothing, INV-28). Reads may use `query` directly. */
  transaction<T>(fn: (tx: Queryable) => Promise<T>): Promise<T>;
}

/** Expands `{{Name}}` in schema.sql to the quoted values of `NameSchema` from @rabbitqa/shared. */
export function expandEnums(sql: string): string {
  return sql.replace(/\{\{(\w+)\}\}/g, (_, name: string) => {
    const options = (shared as Record<string, unknown> & Record<string, { options?: unknown }>)[`${name}Schema`]?.options;
    if (!Array.isArray(options)) throw new Error(`schema.sql: unknown enum {{${name}}}`);
    return options.map((v) => `'${String(v).replace(/'/g, "''")}'`).join(", ");
  });
}

/**
 * pg-mem ignores ROLLBACK, so a transaction is: wait for the previous one (writes are serialized,
 * which also stands in for the project lock, INV-08), take a snapshot, run, restore the snapshot on error.
 * Safe only because every write goes through `transaction`.
 */
function transactional(mem: IMemoryDb, pool: Queryable): Db["transaction"] {
  let queue: Promise<unknown> = Promise.resolve();
  return (fn) => {
    const run = queue.then(async () => {
      const snapshot = mem.backup();
      try {
        return await fn(pool);
      } catch (err) {
        snapshot.restore();
        throw err;
      }
    });
    queue = run.catch(() => {});
    return run;
  };
}

/** `row` keys are column names written in code, never user input. */
async function insert(db: Queryable, table: string, row: Record<string, unknown>) {
  const cols = Object.keys(row);
  const values = cols.map((c) => {
    const v = row[c];
    return v !== null && typeof v === "object" ? JSON.stringify(v) : v ?? null;
  });
  await db.query(`INSERT INTO ${table} (${cols.join(", ")}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(", ")})`, values);
}

export async function loadSeed(db: Queryable, s: RqState) {
  const admin = s.users.find((u) => u.role === "admin" && u.active);
  for (const u of s.users) {
    await insert(db, "users", { id: u.id, name: u.name, email: u.email, role: u.role, active: u.active });
  }
  await insert(db, "template_versions", { version: 1, phases: s.template, created_by: admin?.id ?? null });
  for (const p of s.projects) {
    await insert(db, "projects", {
      id: p.id, customer_name: p.customerName, name: p.name, csm_id: p.csmId, start_date: p.startDate,
      go_live_date: p.goLiveDate || null, install_type: p.installType, llm_choice: p.llmChoice, teams: p.teams,
      template_version: 1, created_at: p.createdAt, created_by: admin?.id ?? null,
    });
  }
  for (const ph of s.phases) {
    await insert(db, "phases", {
      id: ph.id, project_id: ph.projectId, code: ph.code, name: ph.name, sort_order: ph.order, status: ph.status,
      dependency: ph.dependency, plan_start: ph.planStart, plan_end: ph.planEnd, baseline_end: ph.baselineEnd,
      actual_start: ph.actualStart, actual_end: ph.actualEnd, approved_by: ph.approvedBy, approved_at: ph.approvedAt,
      activated_at: ph.activatedAt,
    });
  }
  for (const st of s.steps) {
    await insert(db, "steps", {
      id: st.id, project_id: st.projectId, phase_id: st.phaseId, title: st.title, required: st.required,
      owner_id: st.ownerId, ball: st.ball, ball_since: st.ballSince, due: st.due, status: st.status, sort_order: st.order,
      key: st.key ?? null, dependency: st.dependency, duration_days: st.durationDays, activated_at: st.activatedAt,
      completion: st.completion, meeting_type: st.meetingType ?? null,
    });
  }
  for (const m of s.meetings) {
    await insert(db, "meetings", {
      id: m.id, project_id: m.projectId, type: m.type, date: m.date, notes: m.notes, decisions: m.decisions,
      is_customer_visible: m.isCustomerVisible, status: m.status, team_id: m.teamId ?? null, training: m.training ?? null,
    });
    for (const id of m.internalIds) await insert(db, "meeting_participants", { meeting_id: m.id, kind: "user", participant_id: id });
    for (const id of m.contactIds) await insert(db, "meeting_participants", { meeting_id: m.id, kind: "contact", participant_id: id });
  }
  for (const a of s.actions) {
    await insert(db, "actions", {
      id: a.id, project_id: a.projectId, title: a.title, owner_id: a.ownerId, ball: a.ball, due: a.due,
      priority: a.priority, status: a.status, source: a.source, meeting_id: a.meetingId, rule_key: a.ruleKey ?? null,
      insight_id: a.insightId ?? null, is_customer_visible: a.isCustomerVisible, created_at: a.createdAt,
    });
  }
}

/** Fresh in-memory database with schema and seed loaded. */
export async function createDb(seed: RqState = createSeed()): Promise<Db> {
  const mem = newDb();
  mem.public.none(expandEnums(fs.readFileSync(path.join(import.meta.dirname, "schema.sql"), "utf8")));
  const { Pool } = mem.adapters.createPg();
  const pool: Queryable = new Pool();
  const db: Db = { query: (sql, params) => pool.query(sql, params), transaction: transactional(mem, pool) };
  await db.transaction((tx) => loadSeed(tx, seed));
  return db;
}
