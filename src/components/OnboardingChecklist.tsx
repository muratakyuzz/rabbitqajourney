import { CheckCircle2, CircleDashed } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type PartnerOnboardingStatus } from "@/lib/partner-onboarding-api";

export interface OnboardingChecklistItem {
  id: string;
  title: string;
  description: string;
  status: PartnerOnboardingStatus;
}

interface OnboardingChecklistProps {
  tasks?: OnboardingChecklistItem[];
  loading?: boolean;
  editable?: boolean;
  onStatusChange?: (taskId: string, status: PartnerOnboardingStatus) => void;
  updatingTaskId?: string | null;
  showFallbackWhenEmpty?: boolean;
  showContinueAction?: boolean;
}

const fallbackTasks: OnboardingChecklistItem[] = [
  { id: "company", title: "Complete company profile", description: "Add address, website, and partner details.", status: "DONE" },
  { id: "first-lead", title: "Submit first lead", description: "Create and submit your first opportunity.", status: "DONE" },
  { id: "first-deal", title: "Create first deal", description: "Convert an approved lead into a deal record.", status: "CURRENT" },
  { id: "training", title: "Finish onboarding training", description: "Complete onboarding learning path.", status: "TODO" },
];

const statusLabelMap: Record<PartnerOnboardingStatus, string> = {
  TODO: "Todo",
  CURRENT: "Current",
  DONE: "Done",
};

export default function OnboardingChecklist({
  tasks,
  loading = false,
  editable = false,
  onStatusChange,
  updatingTaskId = null,
  showFallbackWhenEmpty = true,
  showContinueAction = true,
}: OnboardingChecklistProps) {
  const onboardingSteps = tasks && tasks.length > 0
    ? tasks
    : (showFallbackWhenEmpty ? fallbackTasks : []);
  const completedCount = onboardingSteps.filter((step) => step.status === "DONE").length;
  const progress = onboardingSteps.length > 0 ? Math.round((completedCount / onboardingSteps.length) * 100) : 0;
  const nextStepId = onboardingSteps.find((step) => step.status === "CURRENT")?.id
    ?? onboardingSteps.find((step) => step.status === "TODO")?.id;

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-card-foreground">Onboarding Progress</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {completedCount}/{onboardingSteps.length} steps completed
          </p>
        </div>
        <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">{progress}%</span>
      </div>

      <Progress value={progress} className="h-2" />

      {loading ? <p className="text-sm text-muted-foreground">Loading onboarding tasks...</p> : null}

      {!loading && onboardingSteps.length > 0 ? (
        <div className="space-y-3">
          {onboardingSteps.map((step) => {
            const isDone = step.status === "DONE";
            const isCurrent = step.status === "CURRENT" || step.id === nextStepId;

            return (
              <div
                key={step.id}
                className={`flex items-start gap-3 rounded-lg border p-3 ${
                  isDone
                    ? "border-border border-l-4 border-l-success bg-success/5"
                    : isCurrent
                      ? "border-primary/50 bg-primary/5"
                      : "border-dashed border-muted-foreground/30 bg-muted/20"
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                ) : (
                  <CircleDashed className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${isDone ? "text-foreground line-through" : "text-foreground"}`}>
                    {step.title}
                  </p>
                  <p className={`text-xs text-muted-foreground ${isDone ? "line-through" : ""}`}>
                    {step.description}
                  </p>
                  {isCurrent ? <p className="mt-1 text-[11px] font-medium text-primary">Current step</p> : null}
                </div>
                {editable && onStatusChange ? (
                  <Select
                    value={step.status === "CURRENT" ? undefined : step.status}
                    onValueChange={(value) => onStatusChange(step.id, value as PartnerOnboardingStatus)}
                    disabled={updatingTaskId === step.id}
                  >
                    <SelectTrigger className="h-8 w-28 text-xs">
                      <SelectValue placeholder={statusLabelMap[step.status]} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODO">{statusLabelMap.TODO}</SelectItem>
                      <SelectItem value="DONE">{statusLabelMap.DONE}</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="rounded-full border border-muted-foreground/25 bg-background px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {statusLabelMap[step.status]}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ) : null}

      {!loading && onboardingSteps.length === 0 ? (
        <p className="text-sm text-muted-foreground">No onboarding tasks found for this partner.</p>
      ) : null}

      {!editable && showContinueAction ? (
        <div className="flex justify-end">
          <Button size="sm" variant="outline">Continue Onboarding</Button>
        </div>
      ) : null}
    </div>
  );
}
