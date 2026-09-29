import { SEED_USERS } from "@/lib/rabbitqa/seed";
import type { Role } from "@/lib/rabbitqa/types";

export type AppRole = Role;

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

// ── Demo auth (mock only, no backend) ─────────────────────────────
// Seeded RabbitQA users; any password signs in.

const TOKEN_PREFIX = "rabbitqa-demo::";

export const demoUsers = SEED_USERS;

function toAuthUser(u: (typeof demoUsers)[number]): AuthUser {
  return { id: u.id, email: u.email, name: u.name, role: u.role };
}

export async function loginApi(email: string, _password: string) {
  const user = demoUsers.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user) throw new Error("E-posta veya şifre hatalı");
  return { token: `${TOKEN_PREFIX}${user.id}`, user: toAuthUser(user) };
}

export async function getMe(token: string): Promise<AuthUser> {
  if (!token.startsWith(TOKEN_PREFIX)) throw new Error("Invalid session");
  const user = demoUsers.find((u) => u.id === token.slice(TOKEN_PREFIX.length));
  if (!user) throw new Error("Invalid session");
  return toAuthUser(user);
}

export async function logoutApi(_token: string) {
  return { loggedOut: true };
}

export async function forgotPasswordApi(_email: string) {
  return { sent: true, resetToken: "demo-reset-token" };
}

export async function resetPasswordApi(_token: string, _newPassword: string) {
  return { reset: true };
}
