import { mockUsers } from "@/lib/mock-data";

export type AppRole = "admin" | "partner";

export interface AuthUser {
  id: string;
  email: string;
  role: "ADMIN" | "PARTNER_USER";
  partnerId: string | null;
  status?: "ACTIVE" | "INACTIVE";
}

// ── Mock auth (no backend in sandbox) ─────────────────────────────
// Accepts ANY password for any seeded user email. Keeps the same API surface
// the rest of the app expects (token + AuthUser shape).

const TOKEN_PREFIX = "mock-token::";

function findUserByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  return mockUsers.find((u) => u.email.toLowerCase() === normalized);
}

function toAuthUser(u: (typeof mockUsers)[number]): AuthUser {
  return {
    id: u.id,
    email: u.email,
    role: u.role === "admin" ? "ADMIN" : "PARTNER_USER",
    partnerId: u.partnerId ?? null,
    status: u.status === "active" ? "ACTIVE" : "INACTIVE",
  };
}

function userFromToken(token: string) {
  if (!token.startsWith(TOKEN_PREFIX)) return null;
  const id = token.slice(TOKEN_PREFIX.length);
  return mockUsers.find((u) => u.id === id) ?? null;
}

export async function loginApi(email: string, _password: string) {
  const user = findUserByEmail(email);
  if (!user) {
    throw new Error("Invalid email or password");
  }
  const auth = toAuthUser(user);
  return {
    token: `${TOKEN_PREFIX}${user.id}`,
    user: { id: auth.id, email: auth.email, role: auth.role, partnerId: auth.partnerId },
  };
}

export async function getMe(token: string): Promise<AuthUser> {
  const user = userFromToken(token);
  if (!user) throw new Error("Invalid session");
  return toAuthUser(user);
}

export async function logoutApi(_token: string) {
  return { loggedOut: true };
}

export async function forgotPasswordApi(_email: string) {
  return { sent: true, resetToken: "mock-reset-token" };
}

export async function resetPasswordApi(_token: string, _newPassword: string) {
  return { reset: true };
}

export function toAppRole(role: AuthUser["role"]): AppRole {
  return role === "ADMIN" ? "admin" : "partner";
}

