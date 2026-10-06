import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { Pill } from "@/components/rq/Badges";
import { personName, useRq } from "@/lib/rabbitqa/store";
import { fmtDate } from "@/lib/rabbitqa/labels";
import { MeetingDialog } from "../MeetingDialog";
import type { WorkspaceProps } from "./index";

/** 04 Eğitim paneli: Eğitim toplantıları listesi (data-field="training:sessions" / "training:pending"). */
export function TrainingWorkspace({ project, readOnly }: WorkspaceProps) {
  const { state, updateMeeting } = useRq();
  const [open, setOpen] = useState(false);
  const sessions = state.meetings
    .filter((m) => m.projectId === project.id && m.type === "training")
    .sort((a, b) => a.date.localeCompare(b.date));
  const nonCancelled = sessions.filter((m) => m.status !== "cancelled");
  const done = nonCancelled.filter((m) => m.status === "held").length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{done}/{nonCancelled.length} session yapıldı</p>
        {!readOnly && <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" />Session ekle</Button>}
      </div>
      <div data-field="training:sessions" className="space-y-3">
        {sessions.length === 0 && <Card><EmptyState title="Eğitim session'ı yok" description="İlk session'ı planlayın." /></Card>}
        <div data-field="training:pending" className="space-y-3">
          {sessions.map((m) => (
            <Card key={m.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{fmtDate(m.date)}</span>
                  <Pill tone={m.status === "held" ? "success" : m.status === "cancelled" ? "muted" : "info"}>
                    {m.status === "held" ? "Yapıldı" : m.status === "cancelled" ? "İptal" : "Planlandı"}
                  </Pill>
                  <span className="text-xs text-muted-foreground">Eğitmen: {personName(state, m.training?.trainerId ?? null)}</span>
                  <span className="text-xs text-muted-foreground">Katılımcı: {m.internalIds.length + m.contactIds.length}</span>
                  {m.status === "planned" && !readOnly && (
                    <Button size="sm" variant="outline" className="ml-auto" onClick={() => {
                      const err = updateMeeting(m.id, { status: "held" });
                      if (err) toast.error(err);
                    }}>Yapıldı olarak işaretle</Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">{(m.training?.modules ?? []).map((mod) => <Pill key={mod} tone="muted">{mod}</Pill>)}</div>
                {m.training?.recordingUrl && <a href={m.training.recordingUrl} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">Kayıt linki</a>}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      {open && <MeetingDialog project={project} defaultType="training" defaultStatus="planned" onClose={() => setOpen(false)} />}
    </div>
  );
}
