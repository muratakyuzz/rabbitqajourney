import { useState, type ReactNode } from "react";

import { Info, Paperclip, Plus } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/EmptyState";
import { Pill } from "@/components/rq/Badges";
import { useAuth } from "@/lib/auth-context";
import { canManageProject } from "@/lib/rabbitqa/perm";
import { personName, useRq } from "@/lib/rabbitqa/store";
import { useMeetingPatch } from "@/lib/rabbitqa/use-meeting-patch";
import { RISK_STATUS_LABEL, TICKET_STATUS_LABEL, TICKET_TYPE_LABEL, fmtDate } from "@rabbitqa/shared/domain/labels";
import type { Meeting, Project, TicketType } from "@rabbitqa/shared/domain/types";

/* ── Süreklilik ─────────────────────────────────────────── */
export function ContinuityTab({ project, renderCheckinDialog }: { project: Project; renderCheckinDialog: (close: () => void) => ReactNode }) {
  const { state } = useRq();
  const { user } = useAuth();
  const manage = canManageProject(user, project);
  const [open, setOpen] = useState(false);
  const goLive = state.phases.find((p) => p.projectId === project.id && p.code === "07");
  const checkins = state.meetings.filter((m) => m.projectId === project.id && m.type === "checkin").sort((a, b) => b.date.localeCompare(a.date));
  const tickets = state.tickets.filter((t) => t.projectId === project.id && t.status !== "resolved" && t.status !== "closed");
  const kpis = state.kpis.filter((k) => k.projectId === project.id);

  return (
    <div className="space-y-4">
      {goLive?.status !== "done" && (
        <div className="flex items-start gap-2 rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />Go-Live sonrası takip modu — Go-Live tamamlandığında bu sekme projenin düzenli takibi için kullanılır.
        </div>
      )}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Periyodik check-in toplantıları</CardTitle>
          {manage && <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" />Check-in ekle</Button>}
        </CardHeader>
        <CardContent>
          {checkins.length === 0 ? <EmptyState title="Check-in yok" description="İlk check-in toplantısını ekleyin." /> : (
            <ul className="space-y-2">{checkins.map((m) => (
              <li key={m.id} className="rounded-md border p-3 text-sm">
                <p className="font-medium">{fmtDate(m.date)} · {m.internalIds.map((i) => personName(state, i)).join(", ") || "—"}</p>
                {m.notes && <p className="text-muted-foreground">{m.notes}</p>}
              </li>
            ))}</ul>
          )}
        </CardContent>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Açık destek kayıtları</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">{(Object.keys(TICKET_TYPE_LABEL) as TicketType[]).map((k) => (
              <Pill key={k} tone="info">{TICKET_TYPE_LABEL[k]}: {tickets.filter((t) => t.type === k).length}</Pill>
            ))}</div>
            {tickets.length === 0 ? <p className="text-sm text-muted-foreground">Açık destek kaydı yok.</p> : (
              <ul className="text-sm space-y-1">{tickets.map((t) => (
                <li key={t.id}>{t.title} <span className="text-muted-foreground">· {TICKET_TYPE_LABEL[t.type]} · {TICKET_STATUS_LABEL[t.status]}</span></li>
              ))}</ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">KPI son ölçümleri</CardTitle></CardHeader>
          <CardContent>
            {kpis.length === 0 ? <p className="text-sm text-muted-foreground">KPI tanımlanmadı.</p> : (
              <ul className="text-sm space-y-2">{kpis.map((k) => {
                const last = k.measurements.at(-1);
                const ok = last && k.target !== null && (k.baseline === null || k.target >= k.baseline ? last.value >= k.target : last.value <= k.target);
                return (
                  <li key={k.id} className="flex items-center justify-between gap-2">
                    <span>{k.name}<span className="block text-xs text-muted-foreground">Son: {last ? `${last.value} ${k.unit} (${fmtDate(last.date)})` : "ölçüm yok"} · Hedef: {k.target ?? "—"} {k.unit}</span></span>
                    {last && k.target !== null ? <Pill tone={ok ? "success" : "warning"}>{ok ? "Hedefte" : "Gerisinde"}</Pill> : <Pill tone="muted">Ölçülemez</Pill>}
                  </li>
                );
              })}</ul>
            )}
          </CardContent>
        </Card>
      </div>
      {open && renderCheckinDialog(() => setOpen(false))}
    </div>
  );
}

/* ── Toplantı ekleri ve bağlı kararlar ──────────────────── */
export function MeetingExtras({ meeting, canEdit }: { meeting: Meeting; canEdit: boolean }) {
  const { state, addDocument } = useRq();
  const { busy, patch } = useMeetingPatch();
  const [name, setName] = useState("");
  const docs = state.documents.filter((d) => d.linkType === "meeting" && d.linkId === meeting.id);
  const decisions = state.risks.filter((r) => r.kind === "decision" && r.meetingId === meeting.id);
  return (
    <div className="space-y-2 border-t pt-2 text-sm">
      {decisions.length > 0 && (
        <div><span className="font-medium">Bağlı kararlar:</span>
          <ul className="list-disc pl-5 text-muted-foreground">{decisions.map((r) => <li key={r.id}>{r.title} · {fmtDate(r.decidedAt)} · {RISK_STATUS_LABEL[r.status]}</li>)}</ul>
        </div>
      )}
      <div>
        <span className="font-medium inline-flex items-center gap-1"><Paperclip className="h-3.5 w-3.5" />Ekler:</span>{" "}
        {docs.length === 0 ? <span className="text-muted-foreground">Ek yok.</span> : docs.map((d) => <span key={d.id} className="mr-2">{d.name}</span>)}
      </div>
      {canEdit && (
        <div className="flex flex-wrap items-center gap-2">
          <Input className="h-8 max-w-xs" placeholder="Doküman adı" value={name} onChange={(e) => setName(e.target.value)} />
          <Button size="sm" variant="outline" onClick={() => {
            if (!name.trim()) return toast.error("Doküman adı zorunlu");
            addDocument({ projectId: meeting.projectId, type: "other", name: name.trim(), linkType: "meeting", linkId: meeting.id });
            setName(""); toast.success("Ek eklendi");
          }}>Ek ekle</Button>
          <label className="ml-auto flex items-center gap-2 text-xs"><Switch checked={meeting.isCustomerVisible} disabled={busy} onCheckedChange={(c) => void patch(meeting.id, { isCustomerVisible: c })} />Müşteriye görünür</label>
        </div>
      )}
    </div>
  );
}
