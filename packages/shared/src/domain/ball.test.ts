import { describe, expect, it } from "vitest";
import { ballForOwner } from "./ball";
import { createSeed } from "./seed";

const { users, actions } = createSeed();

describe("ballForOwner", () => {
  it("a user owner → the ball of the user's role; a contact (any non-user id) → customer", () => {
    expect(ballForOwner("u_deniz", users, "devops")).toBe("csm");
    const devops = users.find((u) => u.role === "devops")!;
    expect(ballForOwner(devops.id, users, "csm")).toBe("devops");
    const care = users.find((u) => u.role === "care")!;
    expect(ballForOwner(care.id, users, "csm")).toBe("care");
    expect(ballForOwner("c_2", users, "csm")).toBe("customer");
  });

  it("no owner → the fallback stays", () => {
    expect(ballForOwner(null, users, "devops")).toBe("devops");
  });

  it("agrees with the seed's non-rule actions", () => {
    for (const a of actions.filter((x) => x.source !== "rule")) expect([a.id, ballForOwner(a.ownerId, users, a.ball)]).toEqual([a.id, a.ball]);
  });
});
