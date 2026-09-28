export type AppRole = "admin" | "partner";

export interface AuthUser {
  id: string;
  email: string;
  role: "ADMIN" | "PARTNER_USER";
  partnerId: string | null;
  status?: "ACTIVE" | "INACTIVE";
}

// ── Placeholder auth (template) ───────────────────────────────────
// Two demo accounts, any password signs in. Swap for a real backend
// (e.g. Lovable Cloud auth) when wiring up the app.

const TOKEN_PREFIX = "template-token::";

const demoUsers = [
  { id: "u_admin", email: "admin@demo.dev", role: "admin" as const },
  { id: "u_partner", email: "partner@demo.dev", role: "partner" as const },
];

function findUserByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  return demoUsers.find((u) => u.email.toLowerCase() === normalized);
}

function toAuthUser(u: (typeof demoUsers)[number]): AuthUser {
  return {
    id: u.id,
    email: u.email,
    role: u.role === "admin" ? "ADMIN" : "PARTNER_USER",
    partnerId: null,
    status: "ACTIVE",
  };
}

function userFromToken(token: string) {
  if (!token.startsWith(TOKEN_PREFIX)) return null;
  const id = token.slice(TOKEN_PREFIX.length);
  return demoUsers.find((u) => u.id === id) ?? null;
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
  return { sent: true, resetToken: "template-reset-token" };
}

export async function resetPasswordApi(_token: string, _newPassword: string) {
  return { reset: true };
}

export function toAppRole(role: AuthUser["role"]): AppRole {
  return role === "ADMIN" ? "admin" : "partner";
}
