import type { Action, ActionCreate, ActionList, ActionPatch } from "@rabbitqa/shared";
import { ballForOwner } from "@rabbitqa/shared/domain/ball";
import { defaultCustomerVisible } from "@rabbitqa/shared/domain/rule-actions";
import { uid } from "@rabbitqa/shared/domain/seed";
import type { Db } from "../../db";
import { notFound } from "../../http/errors";
import { type Effects, changeProject, loadProjectState, projectIdOf, replace, requireReason, setLastReason } from "../projects/project-state";

// #6, #7 and the action list (docs/PLAN.md M3). Writes go through changeProject like phases and steps, so the
// flow engine runs and rule actions (phase_approval …) stay consistent. The ball follows the owner (domain/ball.ts).

const byDue = (a: Action, b: Action) =>
  (a.due ?? "9999-12-31").localeCompare(b.due ?? "9999-12-31") || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id);

// ---- GET /projects/:projectId/actions ----
export async function listActions(db: Db, projectId: string): Promise<ActionList> {
  const loaded = await loadProjectState(db, projectId);
  if (!loaded) throw notFound("Proje bulunamadı.");
  return { items: [...loaded.state.actions].sort(byDue) };
}

// ---- #6 POST /projects/:projectId/actions ----
export async function createAction(db: Db, projectId: string, input: ActionCreate): Promise<Effects> {
  return db.transaction((tx) => changeProject(tx, projectId, (s) => {
    const action: Action = {
      id: uid("a"), projectId, title: input.title, ownerId: input.ownerId, ball: ballForOwner(input.ownerId, s.users, input.ball),
      due: input.due, priority: input.priority, status: input.status, source: "manual", meetingId: null,
      createdAt: new Date().toISOString(), isCustomerVisible: input.isCustomerVisible ?? defaultCustomerVisible(),
    };
    return { ...s, actions: [...s.actions, action] };
  }));
}

// ---- #7 PATCH /actions/:id ----
export async function updateAction(db: Db, id: string, { reason, ...patch }: ActionPatch): Promise<Effects> {
  return db.transaction(async (tx) => {
    const projectId = await projectIdOf(tx, "actions", id, "Aksiyon bulunamadı.");
    const effects = await changeProject(tx, projectId, (s) => {
      const old = s.actions.find((x) => x.id === id)!;
      const dueChanged = patch.due !== undefined && patch.due !== old.due;
      const cancelled = patch.status === "cancelled" && old.status !== "cancelled";
      // a new due date and cancelling need a reason; completing (and any other status change) does not
      if (dueChanged || cancelled) requireReason(reason);

      const next: Action = { ...old };
      for (const k of ["title", "ownerId", "due", "priority", "status", "isCustomerVisible"] as const) {
        if (patch[k] !== undefined) Object.assign(next, { [k]: patch[k] });
      }
      // the ball follows a new owner; without an owner it can be set directly. An unchanged owner keeps the
      // ball as it is (rule actions such as llm_endpoint have a CSM owner and the ball at the customer).
      if (next.ownerId !== old.ownerId) next.ball = ballForOwner(next.ownerId, s.users, patch.ball ?? old.ball);
      else if (next.ownerId === null && patch.ball) next.ball = patch.ball;
      return { ...s, actions: replace(s.actions, next) };
    });
    await setLastReason(tx, "actions", id, reason?.trim());
    return effects;
  });
}
