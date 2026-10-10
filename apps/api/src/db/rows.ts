import type { Action, Phase, ProjectCore, Step } from "@rabbitqa/shared";
import type { Queryable } from "./index";

// Domain object ↔ table row. One mapping per entity, used by the seed loader and by persistDiff.
// pg-mem returns `date` as a Date at UTC midnight and `timestamptz` as a Date.

type Row = Record<string, unknown>;

const date = (v: unknown): string | null => (v == null ? null : v instanceof Date ? v.toISOString().slice(0, 10) : String(v).slice(0, 10));
const ts = (v: unknown): string | null => (v == null ? null : new Date(v as string | Date).toISOString());
const opt = <T>(v: unknown): T | undefined => (v == null ? undefined : (v as T));

export const projectToRow = (p: ProjectCore): Row => ({
  id: p.id, customer_name: p.customerName, name: p.name, csm_id: p.csmId, salesperson_id: p.salespersonId,
  license_model: p.licenseModel, purchased_modules: p.purchasedModules, start_date: p.startDate, go_live_date: p.goLiveDate,
  install_type: p.installType, llm_choice: p.llmChoice, teams: p.teams, template_version: p.templateVersion, created_at: p.createdAt,
});
export const rowToProject = (r: Row): ProjectCore => ({
  id: r.id as string, customerName: r.customer_name as string, name: r.name as string, csmId: (r.csm_id as string) ?? null,
  salespersonId: (r.salesperson_id as string) ?? null, licenseModel: r.license_model as string,
  purchasedModules: r.purchased_modules as string[], startDate: date(r.start_date)!, goLiveDate: date(r.go_live_date)!,
  installType: (r.install_type as ProjectCore["installType"]) ?? null, llmChoice: (r.llm_choice as ProjectCore["llmChoice"]) ?? null,
  teams: r.teams as string[], templateVersion: (r.template_version as number) ?? null, createdAt: ts(r.created_at)!,
});

export const phaseToRow = (p: Phase): Row => ({
  id: p.id, project_id: p.projectId, code: p.code, name: p.name, sort_order: p.order, status: p.status, dependency: p.dependency,
  plan_start: p.planStart, plan_end: p.planEnd, baseline_end: p.baselineEnd, actual_start: p.actualStart, actual_end: p.actualEnd,
  approved_by: p.approvedBy, approved_at: p.approvedAt, activated_at: p.activatedAt,
});
export const rowToPhase = (r: Row): Phase => ({
  id: r.id as string, projectId: r.project_id as string, code: r.code as string, name: r.name as string, order: r.sort_order as number,
  status: r.status as Phase["status"], planStart: date(r.plan_start), planEnd: date(r.plan_end), baselineEnd: date(r.baseline_end),
  actualStart: date(r.actual_start), actualEnd: date(r.actual_end), approvedBy: (r.approved_by as string) ?? null,
  approvedAt: ts(r.approved_at), dependency: r.dependency as Phase["dependency"], activatedAt: ts(r.activated_at),
});

export const stepToRow = (s: Step): Row => ({
  id: s.id, project_id: s.projectId, phase_id: s.phaseId, title: s.title, required: s.required, owner_id: s.ownerId, ball: s.ball,
  ball_since: s.ballSince, due: s.due, status: s.status, sort_order: s.order, key: s.key ?? null, dependency: s.dependency,
  duration_days: s.durationDays, activated_at: s.activatedAt, completion: s.completion, meeting_type: s.meetingType ?? null,
});
export const rowToStep = (r: Row): Step => {
  const s: Step = {
    id: r.id as string, projectId: r.project_id as string, phaseId: r.phase_id as string, title: r.title as string,
    required: r.required as boolean, ownerId: (r.owner_id as string) ?? null, ball: r.ball as Step["ball"], ballSince: ts(r.ball_since)!,
    due: date(r.due), status: r.status as Step["status"], order: r.sort_order as number, dependency: r.dependency as Step["dependency"],
    durationDays: r.duration_days as number, activatedAt: ts(r.activated_at), completion: r.completion as Step["completion"],
  };
  const key = opt<string>(r.key), meetingType = opt<Step["meetingType"]>(r.meeting_type);
  if (key !== undefined) s.key = key;
  if (meetingType !== undefined) s.meetingType = meetingType;
  return s;
};

export const actionToRow = (a: Action): Row => ({
  id: a.id, project_id: a.projectId, title: a.title, owner_id: a.ownerId, ball: a.ball, due: a.due, priority: a.priority,
  status: a.status, source: a.source, meeting_id: a.meetingId, rule_key: a.ruleKey ?? null, insight_id: a.insightId ?? null,
  is_customer_visible: a.isCustomerVisible, created_at: a.createdAt,
});
export const rowToAction = (r: Row): Action => {
  const a: Action = {
    id: r.id as string, projectId: r.project_id as string, title: r.title as string, ownerId: (r.owner_id as string) ?? null,
    ball: r.ball as Action["ball"], due: date(r.due), priority: r.priority as Action["priority"], status: r.status as Action["status"],
    source: r.source as Action["source"], meetingId: (r.meeting_id as string) ?? null, createdAt: ts(r.created_at)!,
    isCustomerVisible: r.is_customer_visible as boolean,
  };
  const ruleKey = opt<string>(r.rule_key), insightId = opt<string>(r.insight_id);
  if (ruleKey !== undefined) a.ruleKey = ruleKey;
  if (insightId !== undefined) a.insightId = insightId;
  return a;
};

const param = (v: unknown) => (v !== null && typeof v === "object" ? JSON.stringify(v) : v ?? null);

/** `row` keys are column names written in code, never user input. */
export async function insertRow(q: Queryable, table: string, row: Row) {
  const cols = Object.keys(row);
  await q.query(`INSERT INTO ${table} (${cols.join(", ")}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(", ")})`, cols.map((c) => param(row[c])));
}

/** Updates every column in `row` except id, plus updated_at. */
export async function updateRow(q: Queryable, table: string, row: Row) {
  const cols = Object.keys(row).filter((c) => c !== "id" && c !== "created_at");
  const sets = [...cols.map((c, i) => `${c} = $${i + 2}`), "updated_at = now()"];
  await q.query(`UPDATE ${table} SET ${sets.join(", ")} WHERE id = $1`, [row.id, ...cols.map((c) => param(row[c]))]);
}
