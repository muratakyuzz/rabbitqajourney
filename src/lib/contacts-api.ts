import { contacts, delay, nextId, nowIso, partners } from "@/lib/mock-store";

export type ContactStatus = "ACTIVE" | "INACTIVE";

export interface ContactRecord {
  id: string;
  email: string;
  partnerId: string;
  status: ContactStatus;
  firstName: string;
  lastName: string;
  phone: string | null;
  jobTitle: string | null;
  loginPortalEnabled: boolean;
  linkedUserId?: string | null;
  partnerName: string | null;
  partnerStatus: ContactStatus | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactInput {
  email: string;
  partnerId: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  jobTitle?: string | null;
  loginPortalEnabled: boolean;
}

export interface UpdateContactInput {
  email?: string;
  partnerId?: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  jobTitle?: string | null;
  loginPortalEnabled?: boolean;
  status?: ContactStatus;
}

function attach(c: ContactRecord) {
  const partner = partners.find((p) => p.id === c.partnerId);
  c.partnerName = partner?.name ?? null;
  c.partnerStatus = partner?.status ?? null;
}

export async function listContacts(_token: string, filters?: { status?: ContactStatus; partnerId?: string }) {
  await delay();
  return contacts.filter((c) => {
    if (filters?.status && c.status !== filters.status) return false;
    if (filters?.partnerId && c.partnerId !== filters.partnerId) return false;
    return true;
  }).map((c) => { attach(c); return { ...c }; });
}

export async function getContact(_token: string, contactId: string) {
  await delay();
  const c = contacts.find((x) => x.id === contactId);
  if (!c) throw new Error("Contact not found");
  attach(c);
  return { ...c };
}

export async function createContact(_token: string, input: CreateContactInput) {
  await delay();
  const partner = partners.find((p) => p.id === input.partnerId);
  const c: ContactRecord = {
    id: nextId("c"),
    email: input.email,
    partnerId: input.partnerId,
    status: "ACTIVE",
    firstName: input.firstName,
    lastName: input.lastName,
    phone: input.phone ?? null,
    jobTitle: input.jobTitle ?? null,
    loginPortalEnabled: input.loginPortalEnabled,
    linkedUserId: null,
    partnerName: partner?.name ?? null,
    partnerStatus: partner?.status ?? null,
    lastLoginAt: null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  contacts.unshift(c);
  return c;
}

export async function updateContact(_token: string, contactId: string, input: UpdateContactInput) {
  await delay();
  const c = contacts.find((x) => x.id === contactId);
  if (!c) throw new Error("Contact not found");
  Object.assign(c, input, { updatedAt: nowIso() });
  attach(c);
  return { ...c };
}

export async function deleteContact(_token: string, contactId: string) {
  await delay();
  const idx = contacts.findIndex((x) => x.id === contactId);
  if (idx < 0) throw new Error("Contact not found");
  const [removed] = contacts.splice(idx, 1);
  return removed;
}
