import { Card, CardContent } from "@/components/ui/card";
import { Zap, Handshake, Coins, Megaphone, type LucideIcon } from "lucide-react";
import { formatCurrency } from "@/lib/partner-dashboard-data";

interface Props {
  activeLeads: number;
  newLeadsThisWeek: number;
  activeDeals: number;
  pipelineValue: number;
  estimatedCommission: number;
  periodLabel: string;
  rebatePercent: number;
  marketingSupport: number | null;
}

export function KpiBar({
  activeLeads,
  newLeadsThisWeek,
  activeDeals,
  pipelineValue,
  estimatedCommission,
  periodLabel,
  rebatePercent,
  marketingSupport,
}: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Tile
        icon={Zap}
        label="Active leads"
        value={String(activeLeads)}
        sub={newLeadsThisWeek > 0 ? `+${newLeadsThisWeek} this week` : "No new this week"}
      />
      <Tile
        icon={Handshake}
        label="Active deals"
        value={String(activeDeals)}
        sub={`${formatCurrency(pipelineValue)} pipeline`}
      />
      <Tile
        icon={Coins}
        label="Est. commission"
        value={formatCurrency(estimatedCommission)}
        sub={`${periodLabel} · ${rebatePercent}%`}
        accent
      />
      <Tile
        icon={Megaphone}
        label="Marketing support"
        value={marketingSupport != null ? formatCurrency(marketingSupport) : "—"}
        sub={marketingSupport != null ? "Annual budget" : "Not in your tier"}
      />
    </div>
  );
}

function Tile({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <Card className="shadow-none">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
          <Icon className={`h-4 w-4 ${accent ? "text-amber-500" : "text-muted-foreground"}`} />
        </div>
        <div className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}