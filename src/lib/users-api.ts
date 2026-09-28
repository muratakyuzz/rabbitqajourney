import { delay, nextId, nowIso, partners, users } from "@/lib/mock-store";
import { seedAuthUsers } from "@/lib/mock-store";

export interface UserRecord {
  id: string;
  email: string;
  role: "ADMIN" | "PARTNER_USER";
  partnerId: string | null;
  status: "ACTIVE" | "INACTIVE";
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  jobTitle?: string | null;
  gender?: "MALE" | "FEMALE" | "OTHER" | null;
  partnerName: string | null;
  partnerStatus: "ACTIVE" | "INACTIVE" | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  email: string;
  password?: string;
  partnerId: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  jobTitle?: string | null;
  loginPortalEnabled?: boolean;
}

export interface UpdateUserInput {
  email?: string;
  password?: string;
  partnerId?: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  jobTitle?: string | null;
  loginPortalEnabled?: boolean;
}

function applyPartnerInfo(u: UserRecord) {
  if (!u.partnerId) {
    u.partnerName = null;
    u.partnerStatus = null;
    return;
  }
  const partner = partners.find((p) => p.id === u.partnerId);
  u.partnerName = partner?.name ?? null;
  u.partnerStatus = partner?.status ?? null;
}

function partnerIdFromToken(token: string): string | null {
  const id = token.replace(/^mock-token::/, "");
  const u = seedAuthUsers.find((x) => x.id === id);
  return u?.partnerId ?? null;
}

export async function listUsers(_token: string, filters?: { status?: "ACTIVE" | "INACTIVE"; partnerId?: string }) {
  await delay();
  return users.filter((u) => {
    if (filters?.status && u.status !== filters.status) return false;
    if (filters?.partnerId && u.partnerId !== filters.partnerId) return false;
    return true;
  }).map((u) => { applyPartnerInfo(u); return { ...u }; });
}

export async function listMyCompanyUsers(token: string, filters?: { status?: "ACTIVE" | "INACTIVE" }) {
  const pid = partnerIdFromToken(token);
  if (!pid) return [];
  return listUsers(token, { ...filters, partnerId: pid });
}

export async function getUser(_token: string, userId: string) {
  await delay();
  const u = users.find((x) => x.id === userId);
  if (!u) throw new Error("User not found");
  applyPartnerInfo(u);
  return { ...u };
}

export async function createUser(_token: string, input: CreateUserInput) {
  await delay();
  const partner = partners.find((p) => p.id === input.partnerId);
  const user: UserRecord = {
    id: nextId("u"),
    email: input.email,
    role: "PARTNER_USER",
    partnerId: input.partnerId,
    status: "ACTIVE",
    firstName: input.firstName ?? null,
    lastName: input.lastName ?? null,
    phone: input.phone ?? null,
    jobTitle: input.jobTitle ?? null,
    gender: null,
    partnerName: partner?.name ?? null,
    partnerStatus: partner?.status ?? null,
    lastLoginAt: null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  users.unshift(user);
  return user;
}

export async function updateUser(_token: string, userId: string, input: UpdateUserInput) {
  await delay();
  const u = users.find((x) => x.id === userId);
  if (!u) throw new Error("User not found");
  Object.assign(u, input, { updatedAt: nowIso() });
  applyPartnerInfo(u);
  return { ...u };
}

export async function deactivateUser(token: string, userId: string) {
  const u = await updateUser(token, userId, {});
  const ref = users.find((x) => x.id === userId)!;
  ref.status = "INACTIVE";
  ref.updatedAt = nowIso();
  return { ...ref };
}

export async function reactivateUser(token: string, userId: string) {
  const u = await updateUser(token, userId, {});
  const ref = users.find((x) => x.id === userId)!;
  ref.status = "ACTIVE";
  ref.updatedAt = nowIso();
  return { ...ref };
}

export async function deleteUser(_token: string, userId: string) {
  await delay();
  const idx = users.findIndex((x) => x.id === userId);
  if (idx < 0) throw new Error("User not found");
  const [removed] = users.splice(idx, 1);
  return removed;
}
