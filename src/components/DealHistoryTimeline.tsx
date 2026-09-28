import { useEffect, useState } from "react";
import { Activity, ArrowRight, CheckCircle, FileEdit, MessageSquare, MessageSquarePlus, MessageSquareX, Plus, RefreshCw, XCircle } from "lucide-react";

import { getDealHistory, type DealHistoryEntry, type DealHistoryEventType } from "@/lib/deal-history";
import { cn } from "@/lib/utils";

interface Props {
  dealId: string;
  refreshKey?: number;
}

const ICONS: Record<DealHistoryEventType, React.ReactNode> = {
  stage_changed: <RefreshCw className="h-3.5 w-3.5" />,
  status_changed: <Activity className="h-3.5 w-3.5" />,
  deal_updated: <FileEdit className="h-3.5 w-3.5" />,
  deal_created: <Plus className="h-3.5 w-3.5" />,
  approved: <CheckCircle className="h-3.5 w-3.5" />,
  rejected: <XCircle className="h-3.5 w-3.5" />,
  note_added: <MessageSquarePlus className="h-3.5 w-3.5" />,
  note_edited: <MessageSquare className="h-3.5 w-3.5" />,
  note_deleted: <MessageSquareX className="h-3.5 w-3.5" />,
};

const COLORS: Record<DealHistoryEventType, string> = {
  stage_changed: "bg-primary/10 text-primary ring-primary/20",
  status_changed: "bg-accent text-accent-foreground ring-border",
  deal_updated: "bg-muted text-muted-foreground ring-border",
  deal_created: "bg-muted text-muted-foreground ring-border",
  approved: "bg-success/10 text-success ring-success/20",
  rejected: "bg-destructive/10 text-destructive ring-destructive/20",
  note_added: "bg-primary/10 text-primary ring-primary/20",
  note_edited: "bg-muted text-muted-foreground ring-border",
  note_deleted: "bg-destructive/10 text-destructive ring-destructive/20",
};

const LABELS: Record<DealHistoryEventType, string> = {
  stage_changed: "Stage changed",
  status_changed: "Status changed",
  deal_updated: "Deal updated",
  deal_created: "Deal created",
  approved: "Deal approved",
  rejected: "Deal rejected",
  note_added: "Note added",
  note_edited: "Note edited",
  note_deleted: "Note deleted",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.round(d / 30);
  return `${mo}mo ago`;
}

export function DealHistoryTimeline({ dealId, refreshKey }: Props) {
  const [entries, setEntries] = useState<DealHistoryEntry[]>([]);

  useEffect(() => {
    setEntries(getDealHistory(dealId));
  }, [dealId, refreshKey]);

  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/20 p-10 text-center">
        <Activity className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No history yet. Changes will appear here as the deal evolves.</p>
      </div>
    );
  }

  return (
    <ol className="relative space-y-5">
      <span aria-hidden className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />
      {entries.map((e) => (
        <li key={e.id} className="relative pl-10">
          <span
            className={cn(
              "absolute left-0 top-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-background",
              COLORS[e.type],
            )}
          >
            {ICONS[e.type]}
          </span>
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-medium text-foreground">{LABELS[e.type]}</span>
                {e.fromValue || e.toValue ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    {e.fromValue ? (
                      <span className="rounded-md bg-muted px-1.5 py-0.5 text-foreground">{e.fromValue}</span>
                    ) : null}
                    {e.fromValue && e.toValue ? <ArrowRight className="h-3 w-3" /> : null}
                    {e.toValue ? (
                      <span className="rounded-md bg-primary/10 text-primary px-1.5 py-0.5">{e.toValue}</span>
                    ) : null}
                  </span>
                ) : null}
              </div>
              <span className="text-xs text-muted-foreground tabular-nums" title={formatDate(e.at)}>
                {relativeTime(e.at)}
              </span>
            </div>
            {e.message ? (
              <p className="mt-1.5 text-sm text-muted-foreground whitespace-pre-wrap">{e.message}</p>
            ) : null}
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-foreground">
                  {(e.actorName ?? "S").slice(0, 1).toUpperCase()}
                </span>
                <span>
                  {e.actorName ?? "System"}
                  {e.actorRole ? <span className="text-muted-foreground"> · {e.actorRole}</span> : null}
                </span>
              </div>
              <span className="tabular-nums">{formatDate(e.at)}</span>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
