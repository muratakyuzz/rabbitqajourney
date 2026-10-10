import { useId, useState } from "react";
import { Link } from "react-router";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pill } from "@/components/rq/Badges";
import { personName, useRq } from "@/lib/rabbitqa/store";
import { selectableUsers } from "@/lib/rabbitqa/perm";
import { useServerAction } from "@/lib/rabbitqa/use-server-action";
import { createMeeting, patchMeeting } from "@/lib/api/meetings";
import { ballForOwner } from "@rabbitqa/shared/domain/ball";
import { meetingHeldError, stepsCompletedByMeeting } from "@rabbitqa/shared/domain/meetings";
import { ACTION_STATUS_LABEL, BALL_LABEL, MEETING_STATUS_LABEL, MEETING_TYPE_LABEL, PRIORITY_LABEL, fmtDate, todayISO } from "@rabbitqa/shared/domain/labels";
import type { ActionStatus, Ball, Meeting, MeetingStatus, MeetingType, Priority, Project } from "@rabbitqa/shared/domain/types";

export const NONE = "__none";

export function PersonSelect({ value, onChange, projectId, includeContacts = true }: { value: string | null; onChange: (v: string | null) => void; projectId: string; includeContacts?: boolean }) {
  const { state } = useRq();
  return (
    <Select value={value ?? NONE} onValueChange={(v) => onChange(v === NONE ? null : v)}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>Atanmadı</SelectItem>
        {selectableUsers(state, value).map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
        {includeContacts && state.contacts.filter((c) => c.projectId === projectId).map((c) => (
          <SelectItem key={c.id} value={c.id}>{c.name} (müşteri)</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function EnumSelect<T extends string>({ id, value, onChange, labels, disabled }: { id?: string; value: T; onChange: (v: T) => void; labels: Record<T, string>; disabled?: boolean }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as T)} disabled={disabled}>
      <SelectTrigger id={id}><SelectValue /></SelectTrigger>
      <SelectContent>
        {(Object.keys(labels) as T[]).map((k) => <SelectItem key={k} value={k}>{labels[k]}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

export type ActionDraft = { title: string; ownerId: string | null; ball: Ball; due: string | null; priority: Priority; status: ActionStatus; isCustomerVisible: boolean };

/** The ball follows the owner (shared ballForOwner, same as the API); it is chosen by hand only without an owner. */
/** `creating`: a new action cannot start as cancelled (cancelling needs a reason, API #6/#7). */
export function ActionFields({ d, setD, projectId, showStatus, creating }: { d: ActionDraft; setD: (d: ActionDraft) => void; projectId: string; showStatus?: boolean; creating?: boolean }) {
  const { state } = useRq();
  const titleId = useId();
  const statusLabels = creating ? (({ cancelled: _c, ...rest }) => rest)(ACTION_STATUS_LABEL) as Record<ActionStatus, string> : ACTION_STATUS_LABEL;
  return (
    <div className="grid gap-3">
      <div className="grid gap-2"><Label htmlFor={titleId}>Başlık</Label><Input id={titleId} value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2"><Label>Sahip</Label><PersonSelect value={d.ownerId} onChange={(v) => setD({ ...d, ownerId: v, ball: ballForOwner(v, state.users, d.ball) })} projectId={projectId} /></div>
        <div className="grid gap-2">
          <Label>Top kimde</Label>
          <EnumSelect value={d.ball} onChange={(v) => setD({ ...d, ball: v })} labels={BALL_LABEL} disabled={!!d.ownerId} />
          {d.ownerId && <p className="text-xs text-muted-foreground">Sahipten belirlenir.</p>}
        </div>
        <div className="grid gap-2"><Label>Termin</Label><Input type="date" value={d.due ?? ""} onChange={(e) => setD({ ...d, due: e.target.value || null })} /></div>
        <div className="grid gap-2"><Label>Öncelik</Label><EnumSelect value={d.priority} onChange={(v) => setD({ ...d, priority: v })} labels={PRIORITY_LABEL} /></div>
        {showStatus && <div className="grid gap-2"><Label>Durum</Label><EnumSelect value={d.status} onChange={(v) => setD({ ...d, status: v })} labels={statusLabels} /></div>}
      </div>
      <label className="flex items-center gap-3 text-sm"><Switch checked={d.isCustomerVisible} onCheckedChange={(c) => setD({ ...d, isCustomerVisible: c })} />Müşteriye görünür</label>
    </div>
  );
}

export function MeetingDialog({ project, onClose, defaultType = "checkin", defaultStatus, defaultTeamId, onSaved }: {
  project: Project; onClose: () => void; defaultType?: MeetingType; defaultStatus?: MeetingStatus; defaultTeamId?: string | null; onSaved?: (meetingId: string) => void;
}) {
  const { state, addDocument } = useRq();
  const { busy, run } = useServerAction();
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<MeetingType>(defaultType);
  const [visible, setVisible] = useState(false);
  const [docs, setDocs] = useState<string[]>([]);
  const [docName, setDocName] = useState("");
  const [date, setDate] = useState(todayISO());
  const [statusTouched, setStatusTouched] = useState(defaultStatus !== undefined);
  const [status, setStatus] = useState<MeetingStatus>(defaultStatus ?? "held"); // default date is today
  const [teamId, setTeamId] = useState<string | null>(defaultTeamId ?? null);
  const [internalIds, setInternalIds] = useState<string[]>(project.csmId ? [project.csmId] : []);
  const [contactIds, setContactIds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [decisions, setDecisions] = useState("");
  const [actions, setActions] = useState<ActionDraft[]>([]);
  const [trainerId, setTrainerId] = useState<string | null>(project.csmId);
  const [trainingModules, setTrainingModules] = useState<string[]>([]);
  const [recordingUrl, setRecordingUrl] = useState("");
  const contacts = state.contacts.filter((c) => c.projectId === project.id);
  const toggle = (arr: string[], set: (v: string[]) => void, id: string, on: boolean) => set(on ? [...arr, id] : arr.filter((x) => x !== id));
  const onDateChange = (v: string) => {
    setDate(v);
    if (!statusTouched) setStatus(v > todayISO() ? "planned" : "held");
  };
  const meeting: Omit<Meeting, "id" | "projectId"> = {
    type, date, status, internalIds, contactIds, notes, decisions, isCustomerVisible: visible,
    teamId: type === "adaptation" ? teamId : null,
    ...(type === "training" ? { training: { trainerId, modules: trainingModules, recordingUrl } } : {}),
  };
  // "Kaydedince tamamlanır": what the save would complete, from the shared rules (no copy of them here)
  const completes = stepsCompletedByMeeting(state, { ...meeting, id: "m_preview", projectId: project.id });

  const save = async () => {
    setError(null);
    if (actions.some((a) => !a.title.trim())) return setError("Aksiyon başlıkları boş olamaz.");
    const heldErr = meetingHeldError(meeting, todayISO());
    if (heldErr) return setError(heldErr.message);
    let mid: string | null = null;
    // the meeting and its actions go in one request: all or nothing on the server
    const err = await run(async () => {
      const res = await createMeeting(project.id, { ...meeting, actions });
      mid = res.meeting.id;
      return res;
    });
    if (err || !mid) return setError(err);
    const savedId: string = mid;
    // documents stay in the mockup store; they are linked to the server's meeting id
    docs.forEach((name) => addDocument({ projectId: project.id, type: "other", name, linkType: "meeting", linkId: savedId }));
    toast.success(status === "held" ? "Toplantı kaydedildi" : "Toplantı planlandı");
    onSaved?.(savedId);
    onClose();
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Toplantı kaydet</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-2"><Label>Tür</Label><EnumSelect value={type} onChange={setType} labels={MEETING_TYPE_LABEL} /></div>
            <div className="grid gap-2"><Label>Tarih</Label><Input type="date" value={date} onChange={(e) => onDateChange(e.target.value)} /></div>
            <div className="grid gap-2">
              <Label htmlFor="meeting-status">Durum</Label>
              <EnumSelect id="meeting-status" value={status} onChange={(v) => { setStatus(v); setStatusTouched(true); }} labels={MEETING_STATUS_LABEL} />
            </div>
          </div>
          {type === "adaptation" && (
            <div className="grid gap-2">
              <Label>Takım</Label>
              {project.teams.length === 0 ? <p className="text-xs text-muted-foreground">Önce Keşif'te takım ekleyin.</p> : (
                <Select value={teamId ?? NONE} onValueChange={(v) => setTeamId(v === NONE ? null : v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Takım seçilmedi</SelectItem>
                    {project.teams.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
          {type === "training" && (
            <div className="grid gap-3 rounded-md border p-3">
              <div className="grid gap-2">
                <Label>Eğitmen</Label>
                <Select value={trainerId ?? NONE} onValueChange={(v) => setTrainerId(v === NONE ? null : v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Seçilmedi</SelectItem>
                    {selectableUsers(state).map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Anlatılan modüller</Label>
                <div className="grid grid-cols-3 gap-2">{state.modules.map((m) => (
                  <label key={m} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={trainingModules.includes(m)} onCheckedChange={(c) => toggle(trainingModules, setTrainingModules, m, !!c)} />{m}
                  </label>
                ))}</div>
              </div>
              <div className="grid gap-2"><Label>Kayıt linki</Label><Input value={recordingUrl} onChange={(e) => setRecordingUrl(e.target.value)} /></div>
            </div>
          )}
          <div className="grid gap-2">
            <Label>İç katılımcılar</Label>
            <div className="flex flex-wrap gap-3">{selectableUsers(state).map((u) => (
              <label key={u.id} className="flex items-center gap-2 text-sm"><Checkbox checked={internalIds.includes(u.id)} onCheckedChange={(c) => toggle(internalIds, setInternalIds, u.id, !!c)} />{u.name}</label>
            ))}</div>
          </div>
          <div className="grid gap-2">
            <Label>Müşteri katılımcıları</Label>
            {contacts.length === 0 ? <p className="text-xs text-muted-foreground">Önce "Müşteri kişileri" sekmesinden kişi ekleyin.</p> : (
              <div className="flex flex-wrap gap-3">{contacts.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm"><Checkbox checked={contactIds.includes(c.id)} onCheckedChange={(v) => toggle(contactIds, setContactIds, c.id, !!v)} />{c.name}</label>
              ))}</div>
            )}
          </div>
          <div className="grid gap-2"><Label>Notlar</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          <div className="grid gap-2"><Label>Alınan kararlar</Label><Textarea value={decisions} onChange={(e) => setDecisions(e.target.value)} /></div>
          <div className="grid gap-2">
            <Label>Ekler</Label>
            {docs.length === 0 ? <p className="text-xs text-muted-foreground">Ek yok.</p> : <ul className="text-sm list-disc pl-5">{docs.map((d, i) => <li key={i}>{d}</li>)}</ul>}
            <div className="flex gap-2"><Input placeholder="Doküman adı (örn. Sunum.pdf)" value={docName} onChange={(e) => setDocName(e.target.value)} />
              <Button type="button" variant="outline" onClick={() => { if (docName.trim()) { setDocs([...docs, docName.trim()]); setDocName(""); } }}>Ek ekle</Button></div>
          </div>
          <label className="flex items-center gap-3 text-sm"><Switch checked={visible} onCheckedChange={setVisible} />Müşteriye görünür</label>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>Toplantıdan doğan aksiyonlar</Label>
              <Button size="sm" variant="outline" onClick={() => setActions([...actions, { title: "", ownerId: project.csmId, ball: ballForOwner(project.csmId, state.users, "csm"), due: null, priority: "medium", status: "open", isCustomerVisible: true }])}><Plus className="h-3.5 w-3.5 mr-1" />Aksiyon</Button>
            </div>
            {actions.map((a, i) => (
              <div key={i} className="rounded-lg border p-3 relative">
                <Button size="icon" variant="ghost" className="h-7 w-7 absolute right-2 top-2" onClick={() => setActions(actions.filter((_, j) => j !== i))} aria-label="Kaldır"><Trash2 className="h-3.5 w-3.5" /></Button>
                <ActionFields d={a} setD={(v) => setActions(actions.map((x, j) => (j === i ? v : x)))} projectId={project.id} />
              </div>
            ))}
          </div>
        </div>
        {completes.length > 0 && (
          <p className="text-sm text-muted-foreground">Kaydedince tamamlanır: <span className="font-medium text-foreground">{completes.map((x) => x.title).join(", ")}</span></p>
        )}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Vazgeç</Button>
          <Button disabled={busy} onClick={() => void save()}>{busy ? "Kaydediliyor…" : "Kaydet"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Cancelling a planned meeting needs a reason (API #19); the API error stays in the dialog. */
export function MeetingCancelDialog({ meeting, onClose }: { meeting: Meeting; onClose: () => void }) {
  const { busy, run } = useServerAction();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const save = async () => {
    const err = await run(() => patchMeeting(meeting.id, { status: "cancelled", reason: reason.trim() }));
    if (err) return setError(err);
    toast.success("Toplantı iptal edildi");
    onClose();
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Toplantıyı iptal et</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">{MEETING_TYPE_LABEL[meeting.type]} · {fmtDate(meeting.date)}</p>
        <div className="grid gap-2"><Label htmlFor="meeting-cancel-reason">Gerekçe</Label><Textarea id="meeting-cancel-reason" value={reason} onChange={(e) => setReason(e.target.value)} /></div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Vazgeç</Button>
          <Button disabled={busy || !reason.trim()} onClick={() => void save()}>{busy ? "Kaydediliyor…" : "İptal et"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function MeetingDetailDialog({ meetingId, onClose }: { meetingId: string; onClose: () => void }) {
  const { state } = useRq();
  const meeting = state.meetings.find((m) => m.id === meetingId);
  if (!meeting) return null;
  const acts = state.actions.filter((a) => a.meetingId === meeting.id);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{MEETING_TYPE_LABEL[meeting.type]} toplantısı</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone={meeting.status === "held" ? "success" : meeting.status === "cancelled" ? "muted" : "info"}>{MEETING_STATUS_LABEL[meeting.status]}</Pill>
            <span className="text-sm font-medium">{fmtDate(meeting.date)}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            İç: {meeting.internalIds.map((i) => personName(state, i)).join(", ") || "—"} · Müşteri: {meeting.contactIds.map((i) => personName(state, i)).join(", ") || "—"}
          </p>
          {meeting.type === "adaptation" && meeting.teamId && <p className="text-sm text-muted-foreground">Takım: {meeting.teamId}</p>}
          {meeting.type === "training" && meeting.training && (
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Eğitmen: {personName(state, meeting.training.trainerId)}</p>
              {meeting.training.modules.length > 0 && <p>Modüller: {meeting.training.modules.join(", ")}</p>}
              {meeting.training.recordingUrl && <a href={meeting.training.recordingUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">Kayıt linki</a>}
            </div>
          )}
          {meeting.notes && <p className="text-sm">{meeting.notes}</p>}
          {meeting.decisions && <p className="text-sm"><span className="font-medium">Kararlar: </span>{meeting.decisions}</p>}
          {acts.length > 0 && (
            <div className="text-sm">
              <span className="font-medium">Doğan aksiyonlar:</span>
              <ul className="list-disc pl-5 text-muted-foreground">{acts.map((a) => <li key={a.id}>{a.title} — {personName(state, a.ownerId)} ({fmtDate(a.due)})</li>)}</ul>
            </div>
          )}
          <Link className="text-sm text-primary hover:underline" to={`/app/projects/${meeting.projectId}?tab=meetings`}>Toplantılar sekmesinde gör</Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
