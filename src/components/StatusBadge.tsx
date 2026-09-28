import { cn } from "@/lib/utils";
type StatusType = string;

const statusConfig: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-muted text-muted-foreground border-border" },
  SUBMITTED: { label: "Submitted", className: "bg-info/10 text-info border-info/20" },
  APPROVED: { label: "Approved", className: "bg-success/10 text-success border-success/20" },
  REJECTED: { label: "Rejected", className: "bg-destructive/10 text-destructive border-destructive/20" },
  OPEN: { label: "Open", className: "bg-info/10 text-info border-info/20" },
  WON: { label: "Won", className: "bg-success/10 text-success border-success/20" },
  LOST: { label: "Lost", className: "bg-destructive/10 text-destructive border-destructive/20" },
  ACTIVE: { label: "Active", className: "bg-success/10 text-success border-success/20" },
  INACTIVE: { label: "Inactive", className: "bg-muted text-muted-foreground border-border" },
  active: { label: "Active", className: "bg-success/10 text-success border-success/20" },
  inactive: { label: "Inactive", className: "bg-muted text-muted-foreground border-border" },
};

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, className: "bg-muted text-muted-foreground border-border" };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
