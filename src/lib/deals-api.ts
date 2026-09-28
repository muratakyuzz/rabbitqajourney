import { dealFlowMeta, deals, delay, nextId, nowIso, partners } from "@/lib/mock-store";
import { seedAuthUsers } from "@/lib/mock-store";

export type DealStatus = "OPEN" | "WON" | "LOST";

export interface Deal {
  id: string;
  partnerId: string;
  partnerName: string | null;
  leadId: string | null;
  createdByUserId: string;
  createdByEmail: string | null;
  name: string;
  status: DealStatus;
  expectedRevenueAmount: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDealInput {
  partnerId?: string;
  name: string;
  leadId?: string | null;
  expectedRevenueAmount?: number | null;
}

export interface UpdateDealInput {
  name?: string;
  leadId?: string | null;
  expectedRevenueAmount?: number | null;
}

function userFromToken(token: string) {
  const id = token.replace(/^mock-token::/, "");
  return seedAuthUsers.find((x) => x.id === id);
}

export async function listDeals(_token: string, filters?: { status?: DealStatus; partnerId?: string }) {
  await delay();
  return deals.filter((d) => {
    if (filters?.status && d.status !== filters.status) return false;
    if (filters?.partnerId && d.partnerId !== filters.partnerId) return false;
    return true;
  }).map((d) => ({ ...d, partnerName: partners.find((p) => p.id === d.partnerId)?.name ?? d.partnerName }));
}

export async function getDeal(_token: string, id: string) {
  await delay();
  const d = deals.find((x) => x.id === id);
  if (!d) throw new Error("Deal not found");
  return { ...d, partnerName: partners.find((p) => p.id === d.partnerId)?.name ?? d.partnerName };
}

export async function createDeal(token: string, input: CreateDealInput) {
  await delay();
  const u = userFromToken(token);
  const partnerId = input.partnerId ?? u?.partnerId ?? partners[0].id;
  const partner = partners.find((p) => p.id === partnerId);
  const d: Deal = {
    id: nextId("D"),
    partnerId,
    partnerName: partner?.name ?? null,
    leadId: input.leadId ?? null,
    createdByUserId: u?.id ?? "u-admin-1",
    createdByEmail: u?.email ?? null,
    name: input.name,
    status: "OPEN",
    expectedRevenueAmount: input.expectedRevenueAmount ?? null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  deals.unshift(d);
  dealFlowMeta[d.id] = { status: "DRAFT", description: null, packageType: "MEDIUM", addons: [] };
  return d;
}

export async function updateDeal(_token: string, id: string, input: UpdateDealInput) {
  await delay();
  const d = deals.find((x) => x.id === id);
  if (!d) throw new Error("Deal not found");
  if (input.name !== undefined) d.name = input.name;
  if (input.leadId !== undefined) d.leadId = input.leadId ?? null;
  if (input.expectedRevenueAmount !== undefined) d.expectedRevenueAmount = input.expectedRevenueAmount ?? null;
  d.updatedAt = nowIso();
  return { ...d };
}

export async function updateDealStatus(_token: string, id: string, status: "WON" | "LOST") {
  await delay();
  const d = deals.find((x) => x.id === id);
  if (!d) throw new Error("Deal not found");
  d.status = status;
  d.updatedAt = nowIso();
  return { ...d };
}
