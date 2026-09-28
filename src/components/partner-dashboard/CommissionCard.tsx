import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, type PeriodInfo } from "@/lib/partner-dashboard-data";

interface Props {
  period: PeriodInfo;
  rebatePercent: number;
  tierName: string;
  estimated: number;
  lastPaid: number;
}

export function CommissionCard({ period, rebatePercent, tierName, estimated, lastPaid }: Props) {
  return (
    <Card className="shadow-none relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-[3px] bg-amber-500" />
      <CardContent className="p-5 pt-[18px]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">Commission · {period.label}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {rebatePercent}% rebate · {tierName} tier
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="rounded-md border border-border bg-muted/30 px-3 py-2.5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Estimated</p>
            <p className="text-lg font-semibold text-foreground tabular-nums mt-0.5">{formatCurrency(estimated)}</p>
          </div>
          <div className="rounded-md border border-border bg-muted/30 px-3 py-2.5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Last paid</p>
            <p className="text-lg font-semibold text-foreground tabular-nums mt-0.5">{formatCurrency(lastPaid)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{period.previousLabel}</p>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>Period progress</span>
            <span className="tabular-nums font-medium text-foreground">{period.progressPct}%</span>
          </div>
          <Progress value={period.progressPct} className="h-1.5" />
          <p className="text-[11px] text-muted-foreground mt-1.5">{period.daysRemaining} days remaining</p>
        </div>
      </CardContent>
    </Card>
  );
}