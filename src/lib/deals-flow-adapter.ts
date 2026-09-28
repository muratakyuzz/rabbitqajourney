import { createDeal, getDeal as getDealRaw, listDeals, updateDeal, updateDealStatus, type Deal } from "@/lib/deals-api";
import { dealFlowMeta, type DealFlowMeta } from "@/lib/mock-store";

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

function readMeta(id: string): DealFlowMeta {
  return dealFlowMeta[id] ?? {};
}

function writeMeta(id: string, patch: DealFlowMeta) {
  dealFlowMeta[id] = { ...dealFlowMeta[id], ...patch };
}

function mapDealStatusToLeadStatus(deal: Deal, meta: DealFlowMeta): LeadStatus {
  if (deal.status === "WON") return "APPROVED";
  if (deal.status === "LOST") return "REJECTED";
  return meta.status ?? "DRAFT";
}

function mapDealToLead(deal: Deal): Lead {
  const meta = readMeta(deal.id);
  const status = mapDealStatusToLeadStatus(deal, meta);
  return {
    id: deal.id,
    partnerId: deal.partnerId,
    partnerName: deal.partnerName,
    createdByUserId: deal.createdByUserId,
    createdByEmail: deal.createdByEmail,
    title: deal.name,
    description: meta.description ?? null,
    packageType: meta.packageType ?? "MEDIUM",
    addons: meta.addons ?? [],
    status,
    rejectionReason: status === "REJECTED" ? (meta.rejectionReason ?? "Marked as lost") : null,
    createdAt: deal.createdAt,
    updatedAt: deal.updatedAt,
  };
}

export async function listLeads(token: string, filters?: { status?: LeadStatus; partnerId?: string }) {
  let backendStatus: "OPEN" | "WON" | "LOST" | undefined;
  if (filters?.status === "APPROVED") backendStatus = "WON";
  if (filters?.status === "REJECTED") backendStatus = "LOST";
  if (filters?.status === "DRAFT" || filters?.status === "SUBMITTED") backendStatus = "OPEN";

  const deals = await listDeals(token, { status: backendStatus, partnerId: filters?.partnerId });
  const mapped = deals.map(mapDealToLead);
  if (!filters?.status) return mapped;
  return mapped.filter((item) => item.status === filters.status);
}

export async function createLead(token: string, input: LeadUpsertInput) {
  const created = await createDeal(token, { partnerId: input.partnerId, name: input.title });
  writeMeta(created.id, {
    description: input.description ?? null,
    packageType: input.packageType,
    addons: input.addons ?? [],
    status: "DRAFT",
    rejectionReason: null,
  });
  return mapDealToLead(created);
}

export async function getLead(token: string, leadId: string) {
  const deal = await getDealRaw(token, leadId);
  return mapDealToLead(deal);
}

export async function updateLead(token: string, leadId: string, input: Partial<LeadUpsertInput>) {
  const patch: DealFlowMeta = {};
  if (input.description !== undefined) patch.description = input.description ?? null;
  if (input.packageType !== undefined) patch.packageType = input.packageType;
  if (input.addons !== undefined) patch.addons = input.addons;
  if (Object.keys(patch).length > 0) writeMeta(leadId, patch);
  if (input.title !== undefined) await updateDeal(token, leadId, { name: input.title });
  const deal = await getDealRaw(token, leadId);
  return mapDealToLead(deal);
}

export async function submitLead(token: string, leadId: string) {
  const deal = await getDealRaw(token, leadId);
  writeMeta(leadId, { status: "SUBMITTED" });
  return mapDealToLead(deal);
}

export async function approveLead(token: string, leadId: string) {
  const updated = await updateDealStatus(token, leadId, "WON");
  writeMeta(leadId, { status: "APPROVED", rejectionReason: null });
  return mapDealToLead(updated);
}

export async function rejectLead(token: string, leadId: string, rejectionReason: string) {
  const updated = await updateDealStatus(token, leadId, "LOST");
  writeMeta(leadId, { status: "REJECTED", rejectionReason });
  return mapDealToLead(updated);
}
