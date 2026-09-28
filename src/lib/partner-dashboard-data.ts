import type { Deal } from "@/lib/deals-api";
import type { Lead } from "@/lib/leads-api";
import { dealFlowMeta } from "@/lib/mock-store";
import { parseDealDescription, type DealStage, DEAL_STAGES } from "@/lib/deal-payload";
import { getEffectiveRebate, type RebatePeriod } from "@/lib/partner-config-store";

export type Tier = "Silver" | "Gold" | "Platinum";

export interface TierThreshold {
  name: Tier;
  minRevenue: number;
  rebatePercent: number;
  marketingSupport: number;
  certRequirement: string;
}

export const TIER_THRESHOLDS: TierThreshold[] = [
  { name: "Silver", minRevenue: 0, rebatePercent: 15, marketingSupport: 3500, certRequirement: "1 Seller" },
  { name: "Gold", minRevenue: 175000, rebatePercent: 20, marketingSupport: 7500, certRequirement: "2 Sellers + 1 Technical" },
  { name: "Platinum", minRevenue: 500000, rebatePercent: 25, marketingSupport: 15000, certRequirement: "3 Sellers + 2 Technical" },
];

export interface PeriodInfo {
  label: string;
  period: RebatePeriod;
  startDate: Date;
  endDate: Date;
  progressPct: number;
  daysRemaining: number;
  previousLabel: string;
}

export function getCurrentPeriodInfo(period: RebatePeriod, now = new Date()): PeriodInfo {
  const y = now.getFullYear();
  let start: Date;
  let end: Date;
  let label: string;
  let previousLabel: string;

  if (period === "yearly") {
    start = new Date(y, 0, 1);
    end = new Date(y + 1, 0, 1);
    label = `${y}`;
    previousLabel = `${y - 1}`;
  } else if (period === "quarterly") {
    const q = Math.floor(now.getMonth() / 3);
    start = new Date(y, q * 3, 1);
    end = new Date(y, q * 3 + 3, 1);
    label = `Q${q + 1} ${y}`;
    const pq = q === 0 ? 4 : q;
    const py = q === 0 ? y - 1 : y;
    previousLabel = `Q${pq} ${py}`;
  } else {
    start = new Date(y, now.getMonth(), 1);
    end = new Date(y, now.getMonth() + 1, 1);
    label = now.toLocaleString("en", { month: "short", year: "numeric" });
    const prev = new Date(y, now.getMonth() - 1, 1);
    previousLabel = prev.toLocaleString("en", { month: "short", year: "numeric" });
  }

  const totalMs = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  const progressPct = Math.max(0, Math.min(100, Math.round((elapsed / totalMs) * 100)));
  const daysRemaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86400000));
  return { label, period, startDate: start, endDate: end, progressPct, daysRemaining, previousLabel };
}

export function getStageOfDeal(deal: Deal): DealStage {
  if (deal.status === "WON") return "Won";
  if (deal.status === "LOST") return "Lost";
  const meta = dealFlowMeta[deal.id];
  const desc = meta?.description ?? null;
  const parsed = parseDealDescription(desc);
  return parsed.stage ?? "Identified";
}

export interface StageBucket {
  stage: DealStage;
  count: number;
  value: number;
}

export function bucketDealsByStage(deals: Deal[]): StageBucket[] {
  const map = new Map<DealStage, StageBucket>();
  DEAL_STAGES.forEach((s) => map.set(s, { stage: s, count: 0, value: 0 }));
  deals.forEach((d) => {
    const s = getStageOfDeal(d);
    const b = map.get(s)!;
    b.count += 1;
    b.value += d.expectedRevenueAmount ?? 0;
  });
  return DEAL_STAGES.map((s) => map.get(s)!);
}

export function getTierContext(partnerType: string | null, partnerTier: string | null) {
  const rebate = getEffectiveRebate(partnerType, partnerTier);
  const tierName = (partnerTier as Tier) || "Silver";
  const currentIdx = TIER_THRESHOLDS.findIndex((t) => t.name === tierName);
  const current = TIER_THRESHOLDS[currentIdx >= 0 ? currentIdx : 0];
  const next = TIER_THRESHOLDS[Math.min((currentIdx >= 0 ? currentIdx : 0) + 1, TIER_THRESHOLDS.length - 1)];
  const isTop = current === next;
  // Mock current annual SW revenue: derive from won deals later if available
  return { current, next, isTop, rebate };
}

export interface InactiveItem {
  id: string;
  kind: "deal" | "lead";
  name: string;
  stage: string;
  value: number | null;
  daysInactive: number;
}

export function computeInactive(deals: Deal[], leads: Lead[], now = new Date()): InactiveItem[] {
  const items: InactiveItem[] = [];
  deals.forEach((d) => {
    if (d.status !== "OPEN") return;
    const days = Math.floor((now.getTime() - Date.parse(d.updatedAt)) / 86400000);
    if (days >= 7) {
      items.push({
        id: d.id,
        kind: "deal",
        name: d.name,
        stage: getStageOfDeal(d),
        value: d.expectedRevenueAmount,
        daysInactive: days,
      });
    }
  });
  leads.forEach((l) => {
    if (l.status !== "DRAFT" && l.status !== "SUBMITTED") return;
    const days = Math.floor((now.getTime() - Date.parse(l.updatedAt)) / 86400000);
    if (days >= 7) {
      items.push({
        id: l.id,
        kind: "lead",
        name: l.title,
        stage: l.status,
        value: null,
        daysInactive: days,
      });
    }
  });
  return items.sort((a, b) => b.daysInactive - a.daysInactive).slice(0, 6);
}

export type CertStatus = "active" | "missing" | "expiring" | "not-started";
export interface CertItem {
  id: string;
  name: string;
  role: string;
  status: CertStatus;
  required: boolean;
}

export function getMockCertifications(tier: Tier): CertItem[] {
  return [
    { id: "c1", name: "Seller Certification", role: "Sales Manager", status: "missing", required: true },
    { id: "c2", name: "Technical Support", role: "Pre-sales Engineer", status: "not-started", required: tier !== "Silver" },
  ];
}

export function formatCurrency(amount: number, currency = "EUR") {
  return new Intl.NumberFormat("en-DE", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export const STAGE_COLORS: Record<DealStage, string> = {
  Identified: "#94a3b8",
  Qualified: "#3266ad",
  Proposal: "#7F77DD",
  Negotiation: "#BA7517",
  Won: "#1D9E75",
  Lost: "#E24B4A",
};