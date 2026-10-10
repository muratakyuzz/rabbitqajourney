import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Pill, StepStatusBadge } from "@/components/rq/Badges";
import { personName, useRq } from "@/lib/rabbitqa/store";
import { latestHeldMeeting } from "@rabbitqa/shared/domain/completion";
import { fmtDate } from "@rabbitqa/shared/domain/labels";
import type { MeetingType, Project } from "@rabbitqa/shared/domain/types";
import { MeetingDialog, MeetingDetailDialog } from "../MeetingDialog";

/** Bir aşama panelindeki tek toplantı adımı: yapıldı toplantıyı gösterir, planlıysa "Yapıldı" işaretler, yoksa kaydet. */
export function MeetingStepSection({ project, stepKey, type, title, readOnly, teamId }: {
  project: Project; stepKey: string; type: MeetingType; title: string; readOnly: boolean; teamId?: string | null;
}) {
  const { state, updateMeeting } = useRq();
  const [meetingFormOpen, setMeetingFormOpen] = useState(false);
  const [meetingDetailId, setMeetingDetailId] = useState<string | null>(null);

  const step = state.steps.find((s) => s.projectId === project.id && s.key === stepKey);
  const held = latestHeldMeeting(state, project.id, type);
  const planned = state.meetings
    .filter((m) => m.projectId === project.id && m.type === type && m.status === "planned" && (teamId === undefined || m.teamId === teamId))
    .sort((a, b) => b.date.localeCompare(a.date))[0];

  return (
    <section data-field={`meeting:${type}`} className="space-y-3">
      <div className="flex items-center gap-1.5">
        <h3 className="text-sm font-semibold">{title}</h3>
        {step && <span className="inline-flex items-center gap-1.5 ml-auto"><StepStatusBadge status={step.status} />{step.due && <span className="text-xs text-muted-foreground">{fmtDate(step.due)}</span>}</span>}
      </div>
      {held ? (
        <div className="text-sm space-y-1">
          <p>{fmtDate(held.date)} · {[...held.internalIds, ...held.contactIds].map((i) => personName(state, i)).join(", ") || "—"}</p>
          <Button size="sm" variant="outline" onClick={() => setMeetingDetailId(held.id)}>Toplantıyı gör</Button>
        </div>
      ) : planned ? (
        <div className="text-sm space-y-2">
          <Pill tone="info">Planlandı · {fmtDate(planned.date)}</Pill>
          {!readOnly && (
            <div>
              <Button size="sm" variant="outline" onClick={() => {
                const err = updateMeeting(planned.id, { status: "held" });
                if (err) toast.error(err);
              }}>Yapıldı olarak işaretle</Button>
            </div>
          )}
        </div>
      ) : readOnly ? (
        <p className="text-sm text-muted-foreground">Henüz kaydedilmedi.</p>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setMeetingFormOpen(true)}>Toplantı kaydet</Button>
      )}
      {meetingFormOpen && (
        <MeetingDialog project={project} defaultType={type} defaultTeamId={teamId ?? null} onClose={() => setMeetingFormOpen(false)} />
      )}
      {meetingDetailId && <MeetingDetailDialog meetingId={meetingDetailId} onClose={() => setMeetingDetailId(null)} />}
    </section>
  );
}
