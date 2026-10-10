import type { Ball, Role } from "../enums";

// Who holds the ball of an action follows its owner (docs/PLAN.md M3). The owner is a user or a customer
// contact; contacts live in the web store, so any id that is not a user counts as the customer's.

const ROLE_BALL: Record<Role, Ball> = { csm: "csm", devops: "devops", care: "care", manager: "csm", admin: "csm" };

/** Ball for an action owned by `ownerId`; without an owner the given `fallback` stays. */
export function ballForOwner(ownerId: string | null, users: { id: string; role: Role }[], fallback: Ball): Ball {
  if (!ownerId) return fallback;
  const user = users.find((u) => u.id === ownerId);
  return user ? ROLE_BALL[user.role] : "customer";
}
