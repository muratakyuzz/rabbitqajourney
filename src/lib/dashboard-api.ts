import { computeDashboardSummary, delay } from "@/lib/mock-store";

export interface DashboardSummary {
  totalLeads: number;
  activeDeals: number;
  expectedRevenue: number;
  recentActivity: Array<{
    occurredAt: string;
    userId?: string | null;
    user: string;
    action: string;
    partnerId?: string | null;
    target: string;
    targetType?: "PARTNER" | "DOCUMENT" | "LEAD";
  }>;
}

export async function getDashboardSummary(_token: string) {
  await delay();
  return computeDashboardSummary();
}
