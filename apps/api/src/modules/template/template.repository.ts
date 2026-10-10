import type { PhaseTpl, TemplateVersion } from "@rabbitqa/shared";
import type { Queryable } from "../../db";

interface Row { version: number; phases: PhaseTpl[]; created_at: Date | string; created_by: string | null }

const toVersion = (r: Row): TemplateVersion => ({
  version: r.version,
  createdAt: new Date(r.created_at).toISOString(),
  createdBy: r.created_by,
  phases: r.phases,
});

export async function findActive(q: Queryable): Promise<TemplateVersion | null> {
  const { rows } = await q.query<Row>("SELECT version, phases, created_at, created_by FROM template_versions ORDER BY version DESC LIMIT 1");
  return rows[0] ? toVersion(rows[0]) : null;
}

export async function insertVersion(q: Queryable, v: { version: number; phases: PhaseTpl[]; createdBy: string | null }): Promise<TemplateVersion> {
  const { rows } = await q.query<Row>(
    "INSERT INTO template_versions (version, phases, created_by) VALUES ($1, $2, $3) RETURNING version, phases, created_at, created_by",
    [v.version, JSON.stringify(v.phases), v.createdBy],
  );
  return toVersion(rows[0]);
}
