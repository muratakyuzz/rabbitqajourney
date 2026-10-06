import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/EmptyState";
import { StepStatusBadge } from "@/components/rq/Badges";
import { useRq } from "@/lib/rabbitqa/store";
import { adaptationCondition } from "@/lib/rabbitqa/completion";
import { ADAPTATION_ITEM_LABEL, fmtDate } from "@/lib/rabbitqa/labels";
import type { AdaptationItem } from "@/lib/rabbitqa/types";
import { MeetingDialog } from "../MeetingDialog";
import type { WorkspaceProps } from "./index";

const ITEMS: AdaptationItem[] = ["projectCreated", "docsIdentified", "docsUploaded", "aiTrained", "firstSamples"];

function TeamCard({ project, teamId, label, readOnly }: { project: WorkspaceProps["project"]; teamId: string | null; label: string; readOnly: boolean }) {
  const { state, setAdaptationCheck } = useRq();
  const [sessionOpen, setSessionOpen] = useState(false);
  const stepKey = `adapt:${teamId ?? "general"}`;
  const step = state.steps.find((s) => s.projectId === project.id && s.key === stepKey);
  const cond = adaptationCondition(state, project.id, teamId);
  const info = teamId ? project.teamInfo[teamId] : undefined;
  const meetings = state.meetings
    .filter((m) => m.projectId === project.id && m.type === "adaptation" && m.teamId === teamId)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2">{label}{step && <StepStatusBadge status={step.status} />}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {info && <p className="text-xs text-muted-foreground">Müşteri sorumlusu: {info.contact || "—"} · Kullanıcı sayısı: {info.users ?? "—"}</p>}
        <div className="space-y-1.5">
          {ITEMS.map((item) => {
            const check = cond.checks.find((c) => c.field === `adapt:${teamId ?? "general"}:${item}`);
            return (
              <label key={item} data-field={`adapt:${teamId ?? "general"}:${item}`} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={check?.met ?? false}
                  disabled={readOnly}
                  onCheckedChange={(c) => setAdaptationCheck(project.id, teamId, item, !!c)}
                />
                {ADAPTATION_ITEM_LABEL[item]}
              </label>
            );
          })}
        </div>
        <div className="space-y-1.5 border-t pt-2">
          {meetings.length === 0 ? (
            <p className="text-xs text-muted-foreground">Henüz Uyarlama toplantısı yok.</p>
          ) : meetings.map((m) => (
            <p key={m.id} className="text-xs text-muted-foreground">
              {fmtDate(m.date)} · {[...m.internalIds, ...m.contactIds].length} katılımcı · {m.notes ? m.notes.slice(0, 80) : "—"} · {m.status === "held" ? "Yapıldı" : m.status === "cancelled" ? "İptal" : "Planlandı"}
            </p>
          ))}
          {!readOnly && <Button size="sm" variant="outline" onClick={() => setSessionOpen(true)}><Plus className="h-3.5 w-3.5 mr-1" />Session ekle</Button>}
        </div>
      </CardContent>
      {sessionOpen && <MeetingDialog project={project} defaultType="adaptation" defaultTeamId={teamId} onClose={() => setSessionOpen(false)} />}
    </Card>
  );
}

/** 05 Uyarlama paneli: takım başına kontrol listesi kartı (ya da takım yoksa "Genel"). */
export function AdaptationWorkspace({ project, readOnly }: WorkspaceProps) {
  const { state } = useRq();
  const generalStep = state.steps.find((s) => s.projectId === project.id && s.key === "adapt:general");
  const generalRec = state.adaptations.find((a) => a.projectId === project.id && a.teamId === null);
  const generalHasMark = generalRec ? Object.values(generalRec.checklist).some(Boolean) : false;
  const hideGeneral = project.teams.length > 0 && generalStep && (generalStep.status === "out_of_scope") && !generalHasMark;

  if (project.teams.length === 0) {
    return (
      <div className="space-y-4">
        <EmptyState title="Takım tanımlanmadı" description="Genel uyarlama kontrol listesi" />
        <TeamCard project={project} teamId={null} label="Genel" readOnly={readOnly} />
      </div>
    );
  }

  const doneCount = project.teams.filter((t) => {
    const step = state.steps.find((s) => s.projectId === project.id && s.key === `adapt:${t}`);
    return step?.status === "done";
  }).length;

  return (
    <div className="space-y-4">
      <Card className="p-4 flex items-center gap-4">
        <span className="text-sm font-medium whitespace-nowrap">{doneCount}/{project.teams.length} takım</span>
        <Progress value={(doneCount / project.teams.length) * 100} className="h-2" />
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        {project.teams.map((t) => <TeamCard key={t} project={project} teamId={t} label={t} readOnly={readOnly} />)}
        {!hideGeneral && generalStep && <TeamCard project={project} teamId={null} label="Genel" readOnly={readOnly} />}
      </div>
    </div>
  );
}
