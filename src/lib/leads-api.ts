import { delay, leads, nextId, nowIso, partners } from "@/lib/mock-store";
import { seedAuthUsers } from "@/lib/mock-store";

export type LeadStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
export type PackageType = "SMALL" | "MEDIUM" | "LARGE";

export interface Lead {
  id: string;
  partnerId: string;
  partnerName: string | null;
  createdByUserId: string;
  createdByEmail: string | null;
  title: string;
  description: string | null;
  packageType: PackageType;
  addons: string[];
  status: LeadStatus;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadUpsertInput {
  partnerId?: string;
  title: string;
  description?: string | null;
  packageType: PackageType;
  addons?: string[];
}

function userFromToken(token: string) {
  const id = token.replace(/^mock-token::/, "");
  return seedAuthUsers.find((x) => x.id === id);
}

export async function listLeads(_token: string, filters?: { status?: LeadStatus; partnerId?: string }) {
  await delay();
  // For partner users, also constrain by their partner unless a filter overrides.
  return leads.filter((l) => {
    if (filters?.status && l.status !== filters.status) return false;
    if (filters?.partnerId && l.partnerId !== filters.partnerId) return false;
    return true;
  }).map((l) => ({ ...l, partnerName: partners.find((p) => p.id === l.partnerId)?.name ?? l.partnerName }));
}

export async function getLead(_token: string, leadId: string) {
  await delay();
  const l = leads.find((x) => x.id === leadId);
  if (!l) throw new Error("Lead not found");
  return { ...l, partnerName: partners.find((p) => p.id === l.partnerId)?.name ?? l.partnerName };
}

export async function createLead(token: string, input: LeadUpsertInput) {
  await delay();
  const u = userFromToken(token);
  const partnerId = input.partnerId ?? u?.partnerId ?? partners[0].id;
  const partner = partners.find((p) => p.id === partnerId);
  const lead: Lead = {
    id: nextId("L"),
    partnerId,
    partnerName: partner?.name ?? null,
    createdByUserId: u?.id ?? "u-admin-1",
    createdByEmail: u?.email ?? null,
    title: input.title,
    description: input.description ?? null,
    packageType: input.packageType,
    addons: input.addons ?? [],
    status: "DRAFT",
    rejectionReason: null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  leads.unshift(lead);
  return lead;
}

export async function updateLead(_token: string, leadId: string, input: Partial<LeadUpsertInput>) {
  await delay();
  const l = leads.find((x) => x.id === leadId);
  if (!l) throw new Error("Lead not found");
  if (input.title !== undefined) l.title = input.title;
  if (input.description !== undefined) l.description = input.description ?? null;
  if (input.packageType !== undefined) l.packageType = input.packageType;
  if (input.addons !== undefined) l.addons = input.addons;
  if (input.partnerId !== undefined) {
    l.partnerId = input.partnerId;
    l.partnerName = partners.find((p) => p.id === input.partnerId)?.name ?? null;
  }
  l.updatedAt = nowIso();
  return { ...l };
}

async function setStatus(leadId: string, status: LeadStatus, rejectionReason: string | null = null) {
  const l = leads.find((x) => x.id === leadId);
  if (!l) throw new Error("Lead not found");
  l.status = status;
  l.rejectionReason = rejectionReason;
  l.updatedAt = nowIso();
  return { ...l };
}

export async function submitLead(_token: string, leadId: string) {
  await delay();
  return setStatus(leadId, "SUBMITTED");
}

export async function approveLead(_token: string, leadId: string) {
  await delay();
  return setStatus(leadId, "APPROVED");
}

export async function rejectLead(_token: string, leadId: string, rejectionReason: string) {
  await delay();
  return setStatus(leadId, "REJECTED", rejectionReason);
}
