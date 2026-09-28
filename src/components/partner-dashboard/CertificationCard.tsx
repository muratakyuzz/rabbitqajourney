import { Award, CheckCircle2, AlertTriangle, Circle, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CertItem } from "@/lib/partner-dashboard-data";

interface Props {
  certs: CertItem[];
  tierRequirementSummary: string;
}

const STATUS_META = {
  active: { label: "Active", icon: CheckCircle2, cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" },
  missing: { label: "Missing", icon: XCircle, cls: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30" },
  expiring: { label: "Expiring", icon: AlertTriangle, cls: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30" },
  "not-started": { label: "Not started", icon: Circle, cls: "bg-muted text-muted-foreground border-border" },
} as const;

export function CertificationCard({ certs, tierRequirementSummary }: Props) {
  const hasMissingRequired = certs.some((c) => c.required && c.status === "missing");

  return (
    <Card className="shadow-none relative overflow-hidden">
      {hasMissingRequired ? <div className="absolute top-0 inset-x-0 h-[3px] bg-red-500" /> : null}
      <CardContent className={cn("p-5", hasMissingRequired && "pt-[18px]")}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-semibold text-foreground">Certifications</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Required: {tierRequirementSummary}</p>
          </div>
          <Award className="h-4 w-4 text-muted-foreground" />
        </div>

        <ul className="space-y-2">
          {certs.map((c) => {
            const meta = STATUS_META[c.status];
            const Icon = meta.icon;
            return (
              <li key={c.id} className="flex items-center gap-3 rounded-md border border-border px-3 py-2">
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{c.role}</p>
                </div>
                <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold", meta.cls)}>
                  {meta.label}
                </span>
              </li>
            );
          })}
        </ul>

        {hasMissingRequired ? (
          <p className="mt-3 text-[11px] text-red-700 dark:text-red-300">
            Missing required certification impacts commission payout.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}