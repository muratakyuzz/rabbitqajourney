import { describe, expect, it } from "vitest";
import { canAssignCsm } from "./perm";
import type { AuthUser } from "@/lib/auth-api";

function user(role: AuthUser["role"]): AuthUser {
  return { id: `u_${role}`, role, name: role, email: `${role}@virgosol.com` };
}

describe("canAssignCsm (REV-01)", () => {
  it("is true only for manager", () => {
    expect(canAssignCsm(user("manager"))).toBe(true);
  });

  it.each(["admin", "csm", "devops", "care"] as const)("is false for %s", (role) => {
    expect(canAssignCsm(user(role))).toBe(false);
  });

  it("is false for null user", () => {
    expect(canAssignCsm(null)).toBe(false);
  });
});
