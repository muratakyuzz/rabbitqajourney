import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActionStatus, Health, PhaseStatus, Priority, StepStatus } from "@/lib/rabbitqa/types";
import { ACTION_STATUS_LABEL, HEALTH_LABEL, PHASE_STATUS_LABEL, PRIORITY_LABEL, STEP_STATUS_LABEL } from "@/lib/rabbitqa/labels";

type Tone = "success" | "warning" | "danger" | "info" | "muted";
const TONE: Record<Tone, string> = {
  success: "text-success border-success/25",
  warning: "bg-warning/15 text-warning-foreground border-warning/40",
  danger: "bg-destructive/10 text-destructive border-destructive/25",
  info: "bg-info/10 text-info border-info/25",
  muted: "bg-muted text-muted-foreground border-border",
};

export function Pill({ tone, children, className }: { tone: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium", TONE[tone], className)}>
      {children}
    </span>
  );
}

const HEALTH_TONE: Record<Health, Tone> = { green: "success", yellow: "warning", red: "danger" };
export const HealthBadge = ({ health }: { health: Health }) => (
  <Pill tone={HEALTH_TONE[health]}>
    <span className="h-1.5 w-1.5 rounded-full bg-current" />
    {HEALTH_LABEL[health]}
  </Pill>
);

const PHASE_TONE: Record<PhaseStatus, Tone> = {
  not_started: "muted", in_progress: "info", at_risk: "warning", late: "danger", done: "success", out_of_scope: "muted", locked: "muted",
};
export const PhaseStatusBadge = ({ status }: { status: PhaseStatus }) => <Pill tone={PHASE_TONE[status]}>{status === "locked" && <Lock className="h-3 w-3" />}{PHASE_STATUS_LABEL[status]}</Pill>;

const STEP_TONE: Record<StepStatus, Tone> = { pending: "muted", in_progress: "info", done: "success", out_of_scope: "muted", locked: "muted" };
export const StepStatusBadge = ({ status }: { status: StepStatus }) => (
  <Pill tone={STEP_TONE[status]} className={status === "out_of_scope" ? "line-through" : ""}>{status === "locked" && <Lock className="h-3 w-3" />}{STEP_STATUS_LABEL[status]}</Pill>
);

const ACTION_TONE: Record<ActionStatus, Tone> = { open: "muted", in_progress: "info", done: "success", cancelled: "muted" };
export const ActionStatusBadge = ({ status }: { status: ActionStatus }) => <Pill tone={ACTION_TONE[status]}>{ACTION_STATUS_LABEL[status]}</Pill>;

const PRIO_TONE: Record<Priority, Tone> = { low: "muted", medium: "info", high: "danger" };
export const PriorityBadge = ({ p }: { p: Priority }) => <Pill tone={PRIO_TONE[p]}>{PRIORITY_LABEL[p]}</Pill>;

export function isOverdue(due: string | null, done: boolean) {
  if (!due || done) return false;
  const t = new Date();
  const today = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  return due < today;
}
