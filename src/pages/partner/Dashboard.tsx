import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { useAuth } from "@/lib/auth-context";
import { listLeads, type Lead } from "@/lib/leads-api";
import { listDeals, type Deal } from "@/lib/deals-api";
import { getMyPartner, type Partner } from "@/lib/partners-api";
import { KpiBar } from "@/components/partner-dashboard/KpiBar";
import { TierStatusCard } from "@/components/partner-dashboard/TierStatusCard";
import { ActionRequiredCard, type AlertItem } from "@/components/partner-dashboard/ActionRequiredCard";
import { PipelineFunnel } from "@/components/partner-dashboard/PipelineFunnel";
import { CommissionCard } from "@/components/partner-dashboard/CommissionCard";
import { CertificationCard } from "@/components/partner-dashboard/CertificationCard";
import {
  STAGE_COLORS,
  bucketDealsByStage,
  computeInactive,
  formatCurrency,
  getCurrentPeriodInfo,
  getMockCertifications,
  getTierContext,
  type Tier,
} from "@/lib/partner-dashboard-data";

function formatRelative(input: string) {
  const ts = Date.parse(input);
  if (Number.isNaN(ts)) return "just now";
  const diff = Math.round((ts - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const abs = Math.abs(diff);
  if (abs < 60) return rtf.format(diff, "second");
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  return rtf.format(Math.round(diff / 86400), "day");
}

export default function PartnerDashboard() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [p, l, d] = await Promise.all([
          getMyPartner(token).catch(() => null),
          listLeads(token),
          listDeals(token),
        ]);
        setPartner(p);
        setLeads(l);
        setDeals(d);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [token]);

  const data = useMemo(() => {
    const tierCtx = getTierContext(partner?.partnerType ?? "Reseller", partner?.partnerTier ?? "Silver");
    const rebatePeriod = tierCtx.rebate.enabled ? tierCtx.rebate.period : "quarterly";
    const period = getCurrentPeriodInfo(rebatePeriod);
    const rebatePct = tierCtx.rebate.enabled ? tierCtx.rebate.percent : tierCtx.current.rebatePercent;

    const activeLeads = leads.filter((l) => l.status === "DRAFT" || l.status === "SUBMITTED").length;
    const weekAgo = Date.now() - 7 * 86400000;
    const newLeads = leads.filter((l) => Date.parse(l.createdAt) >= weekAgo).length;

    const activeDeals = deals.filter((d) => d.status === "OPEN").length;
    const pipelineValue = deals
      .filter((d) => d.status === "OPEN")
      .reduce((s, d) => s + (d.expectedRevenueAmount ?? 0), 0);

    const wonValue = deals
      .filter((d) => d.status === "WON")
      .reduce((s, d) => s + (d.expectedRevenueAmount ?? 0), 0);
    const lostCount = deals.filter((d) => d.status === "LOST").length;
    const wonCount = deals.filter((d) => d.status === "WON").length;
    const winRate = wonCount + lostCount > 0 ? wonCount / (wonCount + lostCount) : 0;

    const buckets = bucketDealsByStage(deals);
    const estCommission = Math.round(wonValue * (rebatePct / 100) * (period.progressPct / 100));
    const lastPaid = Math.round(wonValue * (rebatePct / 100) * 0.6);
    const inactive = computeInactive(deals, leads);

    const certs = getMockCertifications((tierCtx.current.name as Tier) ?? "Silver");
    const missingRequired = certs.filter((c) => c.required && c.status === "missing");

    const alerts: AlertItem[] = [];
    if (missingRequired.length > 0) {
      alerts.push({
        id: "missing-cert",
        tone: "red",
        title: `Missing required certification: ${missingRequired[0].name}`,
        description: "Blocks commission payment until completed.",
      });
    }
    if (period.daysRemaining <= 30 && period.daysRemaining > 0) {
      alerts.push({
        id: "period-ending",
        tone: "amber",
        title: `${period.label} ends in ${period.daysRemaining} days`,
        description: "Close pending deals to maximize rebate.",
      });
    }
    if (tierCtx.current.marketingSupport > 0) {
      alerts.push({
        id: "mkt-budget",
        tone: "blue",
        title: `${formatCurrency(tierCtx.current.marketingSupport)} marketing support available`,
        description: "Request co-marketing activities from your partner manager.",
      });
    }

    return {
      tierCtx,
      period,
      rebatePct,
      rebatePeriod,
      activeLeads,
      newLeads,
      activeDeals,
      pipelineValue,
      wonValue,
      winRate,
      buckets,
      estCommission,
      lastPaid,
      inactive,
      certs,
      alerts,
    };
  }, [partner, leads, deals]);

  const recentDeals = useMemo(
    () => [...deals].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, 5),
    [deals],
  );
  const recentActivity = useMemo(() => {
    const events = [
      ...deals.map((d) => ({ ts: d.updatedAt, text: `Deal "${d.name}" updated` })),
      ...leads.map((l) => ({ ts: l.updatedAt, text: `Lead "${l.title}" ${l.status.toLowerCase()}` })),
    ];
    return events.sort((a, b) => Date.parse(b.ts) - Date.parse(a.ts)).slice(0, 6);
  }, [deals, leads]);

  const rebatePeriodLabel = data.rebatePeriod.charAt(0).toUpperCase() + data.rebatePeriod.slice(1);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="Your partner portal overview" />

      {isLoading ? <LoadingState variant="cards" /> : null}
      {error ? <ErrorState description={error} onRetry={() => window.location.reload()} /> : null}

      {!isLoading && !error ? (
        <>
          <KpiBar
            activeLeads={data.activeLeads}
            newLeadsThisWeek={data.newLeads}
            activeDeals={data.activeDeals}
            pipelineValue={data.pipelineValue}
            estimatedCommission={data.estCommission}
            periodLabel={data.period.label}
            rebatePercent={data.rebatePct}
            marketingSupport={data.tierCtx.current.marketingSupport || null}
          />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="flex flex-col gap-4 lg:col-span-1">
              <TierStatusCard
                current={data.tierCtx.current}
                next={data.tierCtx.next}
                isTop={data.tierCtx.isTop}
                currentAnnualRevenue={data.wonValue}
                rebatePeriodLabel={rebatePeriodLabel}
              />
              <ActionRequiredCard alerts={data.alerts} inactive={data.inactive} />
            </div>

            <div className="lg:col-span-2">
              <PipelineFunnel
                buckets={data.buckets}
                winRate={data.winRate}
                activePipelineValue={data.pipelineValue}
                totalWonValue={data.wonValue}
              />
            </div>

            <div className="flex flex-col gap-4 lg:col-span-1">
              <CommissionCard
                period={data.period}
                rebatePercent={data.rebatePct}
                tierName={data.tierCtx.current.name}
                estimated={data.estCommission}
                lastPaid={data.lastPaid}
              />
              <CertificationCard certs={data.certs} tierRequirementSummary={data.tierCtx.current.certRequirement} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="shadow-none">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-foreground">Recent deals</h3>
                  <button
                    onClick={() => navigate("/app/partner/deals")}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    View all
                  </button>
                </div>
                <div className="divide-y divide-border">
                  {recentDeals.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No deals yet.</p>
                  ) : (
                    recentDeals.map((d) => {
                      const stage = d.status === "WON" ? "Won" : d.status === "LOST" ? "Lost" : "Open";
                      const color = STAGE_COLORS[stage as keyof typeof STAGE_COLORS] ?? "#94a3b8";
                      return (
                        <div
                          key={d.id}
                          onClick={() => navigate(`/app/partner/deals/${d.id}`)}
                          className="flex items-center justify-between py-2.5 cursor-pointer hover:bg-muted/40 -mx-2 px-2 rounded-md transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                              style={{ background: `${color}22`, color }}
                            >
                              {stage}
                            </span>
                            <p className="text-sm font-medium text-foreground truncate">{d.name}</p>
                          </div>
                          <div className="text-right shrink-0 ml-3">
                            <p className="text-sm font-medium tabular-nums text-foreground">
                              {d.expectedRevenueAmount ? formatCurrency(d.expectedRevenueAmount) : "—"}
                            </p>
                            <p className="text-[11px] text-muted-foreground">{formatRelative(d.updatedAt)}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardContent className="p-5">
                <h3 className="text-base font-semibold text-foreground mb-4">Recent activity</h3>
                <div className="space-y-3">
                  {recentActivity.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No recent activity.</p>
                  ) : (
                    recentActivity.map((a, i) => (
                      <div key={i} className="flex items-start justify-between gap-3 text-sm">
                        <p className="text-foreground">{a.text}</p>
                        <span className="shrink-0 text-[11px] text-muted-foreground">{formatRelative(a.ts)}</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
