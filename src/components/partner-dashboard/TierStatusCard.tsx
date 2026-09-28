import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import type { TierThreshold } from "@/lib/partner-dashboard-data";
import { formatCurrency } from "@/lib/partner-dashboard-data";

interface Props {
  current: TierThreshold;
  next: TierThreshold;
  isTop: boolean;
  currentAnnualRevenue: number;
  rebatePeriodLabel: string;
}

export function TierStatusCard({ current, next, isTop, currentAnnualRevenue, rebatePeriodLabel }: Props) {
  const [open, setOpen] = useState(false);
  const gap = Math.max(0, next.minRevenue - currentAnnualRevenue);
  const span = next.minRevenue - current.minRevenue || 1;
  const pct = isTop ? 100 : Math.max(0, Math.min(100, Math.round(((currentAnnualRevenue - current.minRevenue) / span) * 100)));

  return (
    <Card className="shadow-none">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Partner tier</p>
            <p className="text-lg font-semibold text-foreground mt-1">{current.name}</p>
          </div>
          <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300">
            {current.rebatePercent}% · {rebatePeriodLabel}
          </Badge>
        </div>

        {!isTop ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="w-full text-left rounded-md border border-border bg-muted/30 px-3 py-2.5 hover:bg-muted/60 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                {current.name} → {next.name}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold tabular-nums text-foreground">{pct}%</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </div>
            <Progress value={pct} className="h-1.5 mt-2" />
          </button>
        ) : (
          <div className="rounded-md border border-border bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground">
            Top tier reached
          </div>
        )}

        <div className="flex items-center gap-2 mt-3">
          <Chip label="Current" value={`${current.rebatePercent}%`} tone="amber" />
          {!isTop ? <Chip label="Next" value={`${next.rebatePercent}%`} tone="green" /> : null}
        </div>
      </CardContent>

      {!isTop ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 text-xs font-medium text-primary hover:underline"
        >
          View next tier →
        </button>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {current.name} → {next.name}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">What you unlock at the next tier</p>
          </DialogHeader>

          <div className="rounded-lg border border-border overflow-hidden">
            <div className="grid grid-cols-3 bg-muted/40 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              <div className="px-4 py-2.5">Metric</div>
              <div className="px-4 py-2.5 border-l border-border">Current · {current.name}</div>
              <div className="px-4 py-2.5 border-l border-border bg-emerald-500/5 text-emerald-700 dark:text-emerald-300">
                Next · {next.name}
              </div>
            </div>
            <CompareRow label="Annual SW Revenue" current={formatCurrency(currentAnnualRevenue)} next={`${formatCurrency(next.minRevenue)} required`} />
            <CompareRow label="Rebate Rate" current={`${current.rebatePercent}% · ${rebatePeriodLabel}`} next={`${next.rebatePercent}% · ${rebatePeriodLabel}`} />
            <CompareRow label="Marketing Support" current={`${formatCurrency(current.marketingSupport)} / year`} next={`${formatCurrency(next.marketingSupport)} / year`} />
            <CompareRow label="Certified Personnel" current={current.certRequirement} next={next.certRequirement} />
            <CompareRow label="Priority Enablement" current="✓" next="✓" />
            <CompareRow label="Co-marketing Budget" current="✓" next="✓" last />
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-foreground">Progress to {next.name}</p>
              <p className="text-sm font-semibold tabular-nums text-foreground">{pct}%</p>
            </div>
            <Progress value={pct} className="h-2" />
            <p className="mt-2 text-xs tabular-nums text-muted-foreground">
              {formatCurrency(currentAnnualRevenue)} / {formatCurrency(next.minRevenue)}
            </p>
            <p className="mt-2 text-sm text-foreground">
              You need <span className="font-semibold tabular-nums">{formatCurrency(gap)}</span> more in annual SW revenue to reach {next.name}.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function Chip({ label, value, tone }: { label: string; value: string; tone: "amber" | "green" }) {
  const cls =
    tone === "amber"
      ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  return (
    <div className={`rounded-md border px-2 py-1 text-[11px] font-medium ${cls}`}>
      <span className="opacity-70">{label}</span> <span className="font-semibold">{value}</span>
    </div>
  );
}

function CompareRow({ label, current, next, last }: { label: string; current: string; next: string; last?: boolean }) {
  return (
    <div className={`grid grid-cols-3 text-sm ${last ? "" : "border-b border-border"}`}>
      <div className="px-4 py-2.5 text-muted-foreground">{label}</div>
      <div className="px-4 py-2.5 border-l border-border text-foreground tabular-nums">{current}</div>
      <div className="px-4 py-2.5 border-l border-border bg-emerald-500/5 font-medium text-foreground tabular-nums">{next}</div>
    </div>
  );
}