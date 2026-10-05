import { useEffect, useRef } from "react";
import { Check, Circle } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { PhaseStatusBadge } from "@/components/rq/Badges";
import { useAuth } from "@/lib/auth-context";
import { personName, useComputedAlerts, useRq } from "@/lib/rabbitqa/store";
import { derivePhaseStatus } from "@/lib/rabbitqa/alerts";
import { stepConditionResult } from "@/lib/rabbitqa/completion";
import { canAssignCsm, canManageProject } from "@/lib/rabbitqa/perm";
import type { MeetingType, Phase, Project, RqState, Step } from "@/lib/rabbitqa/types";
import { PHASE_WORKSPACES } from "./index";
import { highlightField } from "./highlight";

function stepField(state: RqState, s: Step): string | null {
  if (s.completion === "meeting") return s.meetingType ? `meeting:${s.meetingType as MeetingType}` : null;
  if (s.completion === "data") return stepConditionResult(state, s)?.missing[0]?.field ?? null;
  return null;
}

export function PhaseWorkspaceSheet({ project, phase, focus, onClose }: {
  project: Project; phase: Phase; focus: { field: string | null; nonce: number }; onClose: () => void;
}) {
  const { state } = useRq();
  const { user } = useAuth();
  const computed = useComputedAlerts();
  const contentRef = useRef<HTMLDivElement>(null);
  const readOnly = !canManageProject(user, project);
  const csmEditable = canAssignCsm(user);
  const steps = state.steps.filter((s) => s.phaseId === phase.id).sort((a, b) => a.order - b.order);
  const counted = steps.filter((s) => s.status !== "out_of_scope");
  const done = counted.filter((s) => s.status === "done").length;
  const W = PHASE_WORKSPACES[phase.code];

  useEffect(() => {
    if (!focus.field) return;
    const t = setTimeout(() => { if (contentRef.current) highlightField(contentRef.current, focus.field!); }, 150);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus.nonce]);

  return (
    <Sheet open modal={false} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-[640px] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
        <div ref={contentRef} className="space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">{phase.code}</span>
              <SheetTitle className="text-lg">{phase.name}</SheetTitle>
              <PhaseStatusBadge status={derivePhaseStatus(phase, computed)} />
            </div>
            <SheetDescription className="mt-1">{done}/{counted.length} adım</SheetDescription>
            {readOnly && <p className="text-xs text-muted-foreground mt-1">Bu paneli yalnızca görüntüleyebilirsiniz.</p>}
          </div>

          <ul className="space-y-1">
            {steps.map((s) => {
              const clickable = s.status !== "done" && s.status !== "out_of_scope";
              const icon = s.status === "done" ? <Check className="h-3.5 w-3.5 text-success" /> : s.status === "out_of_scope" ? null : <Circle className="h-3.5 w-3.5 text-muted-foreground" />;
              const content = (
                <span className="flex items-center gap-2 text-sm">
                  {icon}
                  <span className={s.status === "out_of_scope" ? "text-muted-foreground" : ""}>
                    {s.status === "out_of_scope" ? "Kapsam dışı — " : ""}{s.title}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">{personName(state, s.ownerId)}</span>
                </span>
              );
              if (!clickable) return <li key={s.id} className="rounded-md px-2 py-1.5">{content}</li>;
              const field = stepField(state, s);
              return (
                <li key={s.id}>
                  <button type="button" className="w-full rounded-md px-2 py-1.5 text-left hover:bg-muted/60" onClick={() => field && highlightField(contentRef.current!, field)}>
                    {content}
                  </button>
                </li>
              );
            })}
          </ul>

          {W && <W project={project} phase={phase} readOnly={readOnly} csmEditable={csmEditable} />}
        </div>
      </SheetContent>
    </Sheet>
  );
}
