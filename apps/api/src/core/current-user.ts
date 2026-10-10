import type { Queryable } from "../db";

/** Faz 1 has no login (docs/PLAN.md): every request acts as the seed's first active admin. */
export async function currentUserId(q: Queryable): Promise<string | null> {
  const { rows } = await q.query<{ id: string }>("SELECT id FROM users WHERE role = 'admin' AND active = true ORDER BY id LIMIT 1");
  return rows[0]?.id ?? null;
}
