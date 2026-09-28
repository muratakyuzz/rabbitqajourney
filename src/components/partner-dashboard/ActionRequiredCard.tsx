import { AlertCircle, Clock, Sparkles, Moon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatCurrency, type InactiveItem } from "@/lib/partner-dashboard-data";

export type AlertTone = "red" | "amber" | "blue";
export interface AlertItem {
  id: string;
  tone: AlertTone;
  title: string;
  description?: string;
}

const TONE: Record<AlertTone, { accent: string; bg: string; text: string; icon: typeof AlertCircle }> = {
  red: { accent: "bg-red-500", bg: "bg-red-500/5", text: "text-red-700 dark:text-red-300", icon: AlertCircle },
  amber: { accent: "bg-amber-500", bg: "bg-amber-500/5", text: "text-amber-700 dark:text-amber-300", icon: Clock },
  blue: { accent: "bg-blue-500", bg: "bg-blue-500/5", text: "text-blue-700 dark:text-blue-300", icon: Sparkles },
};

interface Props {
  alerts: AlertItem[];
  inactive: InactiveItem[];
}

export function ActionRequiredCard({ alerts, inactive }: Props) {
  const total = alerts.length + inactive.length;

  return (
    <Card className="shadow-none flex-1">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground">Action required</h3>
          {total > 0 ? (
            <Badge variant="outline" className="border-foreground/20 bg-foreground/5 font-semibold">
              {total}
            </Badge>
          ) : null}
        </div>

        <div className="space-y-2">
          {alerts.length === 0 && inactive.length === 0 ? (
            <p className="text-sm text-muted-foreground">All clear — nothing needs your attention.</p>
          ) : null}

          {alerts.map((a) => {
            const t = TONE[a.tone];
            const Icon = t.icon;
            return (
              <div
                key={a.id}
                className={cn("relative flex items-start gap-3 rounded-md border border-border pl-4 pr-3 py-2.5", t.bg)}
              >
                <span className={cn("absolute left-0 top-2 bottom-2 w-1 rounded-r-full", t.accent)} />
                <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", t.text)} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{a.title}</p>
                  {a.description ? <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p> : null}
                </div>
              </div>
            );
          })}
        </div>

        {inactive.length > 0 ? (
          <div className="mt-5">
            <div className="flex items-center gap-2 mb-2">
              <Moon className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Inactive opportunities
              </p>
            </div>
            <div className="space-y-1.5">
              {inactive.map((item) => {
                const isCritical = item.daysInactive >= 14;
                return (
                  <div
                    key={`${item.kind}-${item.id}`}
                    className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2"
                  >
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full shrink-0",
                        isCritical ? "bg-red-500" : "bg-amber-500",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {item.kind === "deal" ? "Deal" : "Lead"} · {item.stage}
                        {item.value != null ? ` · ${formatCurrency(item.value)}` : ""}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        isCritical
                          ? "bg-red-500/10 text-red-700 dark:text-red-300"
                          : "bg-amber-500/10 text-amber-700 dark:text-amber-300",
                      )}
                    >
                      {item.daysInactive}d
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}