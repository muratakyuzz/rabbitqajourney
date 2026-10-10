import fs from "node:fs";
import path from "node:path";
import { newDb, type IMemoryDb } from "pg-mem";
import * as shared from "@rabbitqa/shared";
import { createSeed } from "@rabbitqa/shared/domain/seed";
import type { RqState } from "@rabbitqa/shared/domain/types";
import { actionToRow, insertRow, meetingToRow, phaseToRow, projectToRow, stepToRow, writeParticipants } from "./rows";

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

export async function loadSeed(db: Queryable, s: RqState) {
  const admin = s.users.find((u) => u.role === "admin" && u.active);
  for (const u of s.users) {
    await insertRow(db, "users", { id: u.id, name: u.name, email: u.email, role: u.role, active: u.active });
  }
  for (const h of s.holidays) await insertRow(db, "holidays", { date: h.date, name: h.name, half_day: h.halfDay });
  await insertRow(db, "template_versions", { version: 1, phases: s.template, created_by: admin?.id ?? null });
  for (const p of s.projects) {
    await insertRow(db, "projects", {
      ...projectToRow({ ...p, templateVersion: 1 }),
      created_by: admin?.id ?? null,
    });
  }
  for (const ph of s.phases) await insertRow(db, "phases", phaseToRow(ph));
  for (const st of s.steps) await insertRow(db, "steps", stepToRow(st));
  for (const m of s.meetings) {
    await insertRow(db, "meetings", meetingToRow(m));
    await writeParticipants(db, m);
  }
  for (const a of s.actions) await insertRow(db, "actions", actionToRow(a));
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
