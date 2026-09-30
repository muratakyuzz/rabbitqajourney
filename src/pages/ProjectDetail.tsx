import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/EmptyState";
import {
  ActionStatusBadge, HealthBadge, PhaseStatusBadge, Pill, PriorityBadge, StepStatusBadge, isOverdue,
} from "@/components/rq/Badges";
import { useAuth } from "@/lib/auth-context";
import { personName, projectProgress, useRq } from "@/lib/rabbitqa/store";
import { canEditItem, canManageProject, isAllSeeing } from "@/lib/rabbitqa/perm";
import {
  ACTION_STATUS_LABEL, BALL_LABEL, COMMIT_STATUS_LABEL, CONTACT_ROLE_LABEL, ENTITY_LABEL, HEALTH_LABEL, MEETING_TYPE_LABEL,
  PHASE_STATUS_LABEL, PRIORITY_LABEL, STEP_STATUS_LABEL, fmtDate, fmtDateTime, todayISO,
} from "@/lib/rabbitqa/labels";
import type {
  Action, ActionStatus, Ball, Commitment, CommitmentStatus, ContactRole, Health, MeetingType, Phase, PhaseStatus, Priority, Project, Step, StepStatus,
} from "@/lib/rabbitqa/types";

const NONE = "__none";

function PersonSelect({ value, onChange, projectId, includeContacts = true }: { value: string | null; onChange: (v: string | null) => void; projectId: string; includeContacts?: boolean }) {
  const { state } = useRq();
  return (
    <Select value={value ?? NONE} onValueChange={(v) => onChange(v === NONE ? null : v)}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>Atanmadı</SelectItem>
        {state.users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
        {includeContacts && state.contacts.filter((c) => c.projectId === projectId).map((c) => (
          <SelectItem key={c.id} value={c.id}>{c.name} (müşteri)</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function EnumSelect<T extends string>({ value, onChange, labels }: { value: T; onChange: (v: T) => void; labels: Record<T, string> }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as T)}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        {(Object.keys(labels) as T[]).map((k) => <SelectItem key={k} value={k}>{labels[k]}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const { state } = useRq();
  const { user } = useAuth();
  const project = state.projects.find((p) => p.id === id);

  if (!project) {
    return <Card><EmptyState title="Proje bulunamadı" description="Bu proje mevcut değil veya erişiminiz yok." /></Card>;
  }
  const progress = projectProgress(state, project.id);
  const manage = canManageProject(user, project);

  return (
    <div className="space-y-6">
      <div>
        <Link to="/app/projects" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Projeler
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{project.customerName}</h1>
            <p className="text-sm text-muted-foreground">{project.name}</p>
          </div>
          <HealthCard project={project} canEdit={manage} />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <Stat label="CSM" value={personName(state, project.csmId)} />
          <Stat label="Başlangıç" value={fmtDate(project.startDate)} />
          <Stat label="Hedef Go-Live" value={fmtDate(project.goLiveDate)} />
          <Card className="p-3">
            <p className="text-xs text-muted-foreground">İlerleme</p>
            <div className="flex items-center gap-2 mt-1.5"><Progress value={progress} className="h-2" /><span className="text-sm font-medium">%{progress}</span></div>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="phases">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="phases">Aşamalar ve adımlar</TabsTrigger>
          <TabsTrigger value="actions">Aksiyonlar</TabsTrigger>
          <TabsTrigger value="meetings">Toplantılar</TabsTrigger>
          <TabsTrigger value="handover">Satış devri</TabsTrigger>
          <TabsTrigger value="discovery">Keşif ve takımlar</TabsTrigger>
          <TabsTrigger value="contacts">Müşteri kişileri</TabsTrigger>
          <TabsTrigger value="history">Müşteri geçmişi</TabsTrigger>
        </TabsList>
        <TabsContent value="phases"><PhasesTab project={project} /></TabsContent>
        <TabsContent value="actions"><ActionsTab project={project} /></TabsContent>
        <TabsContent value="meetings"><MeetingsTab project={project} /></TabsContent>
        <TabsContent value="handover"><HandoverTab project={project} /></TabsContent>
        <TabsContent value="discovery"><DiscoveryTab project={project} /></TabsContent>
        <TabsContent value="contacts"><ContactsTab project={project} /></TabsContent>
        <TabsContent value="history"><HistoryTab project={project} /></TabsContent>
      </Tabs>
    </div>
  );
}

const Stat = ({ label, value }: { label: string; value: string }) => (
  <Card className="p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm font-medium mt-1">{value}</p></Card>
);

/* ── Health ─────────────────────────────────────────────── */
function HealthCard({ project, canEdit }: { project: Project; canEdit: boolean }) {
  const { updateProject } = useRq();
  const [open, setOpen] = useState(false);
  const [health, setHealth] = useState<Health>(project.health);
  const [reason, setReason] = useState("");
  return (
    <div className="flex items-center gap-2">
      <div className="text-right">
        <HealthBadge health={project.health} />
        {project.healthReason && <p className="text-xs text-muted-foreground mt-1 max-w-xs">{project.healthReason}</p>}
      </div>
      {canEdit && (
        <Button variant="outline" size="sm" onClick={() => { setHealth(project.health); setReason(""); setOpen(true); }}>Sağlığı güncelle</Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Proje sağlığı</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <EnumSelect value={health} onChange={setHealth} labels={HEALTH_LABEL} />
            <div className="grid gap-2"><Label>Gerekçe (zorunlu)</Label><Textarea value={reason} onChange={(e) => setReason(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button onClick={() => {
              if (!reason.trim()) return toast.error("Gerekçe zorunlu");
              updateProject(project.id, { health, healthReason: reason.trim() }, reason.trim());
              setOpen(false);
            }}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Phases & steps ─────────────────────────────────────── */
function PhasesTab({ project }: { project: Project }) {
  const { state, completePhase } = useRq();
  const { user } = useAuth();
  const manage = canManageProject(user, project);
  const phases = state.phases.filter((p) => p.projectId === project.id).sort((a, b) => a.order - b.order);
  const [editStep, setEditStep] = useState<Step | null>(null);
  const [editPhase, setEditPhase] = useState<Phase | null>(null);
  const current = phases.find((p) => p.status !== "done" && p.status !== "out_of_scope");

  return (
    <>
      <Accordion type="multiple" defaultValue={current ? [current.id] : []} className="space-y-2">
        {phases.map((ph) => {
          const steps = state.steps.filter((s) => s.phaseId === ph.id).sort((a, b) => a.order - b.order);
          const counted = steps.filter((s) => s.status !== "out_of_scope");
          const done = counted.filter((s) => s.status === "done").length;
          return (
            <AccordionItem key={ph.id} value={ph.id} className="rounded-lg border bg-card px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex flex-1 flex-wrap items-center gap-3 text-left pr-3">
                  <span className="font-mono text-xs text-muted-foreground">{ph.code}</span>
                  <span className="font-semibold">{ph.name}</span>
                  <PhaseStatusBadge status={ph.status} />
                  <span className="ml-auto text-xs text-muted-foreground font-normal">
                    {done}/{counted.length} adım · Plan: {fmtDate(ph.planStart)} – {fmtDate(ph.planEnd)}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-muted-foreground mb-3">
                  <span>Baseline bitiş: {fmtDate(ph.baselineEnd)}</span>
                  <span>Gerçekleşen: {fmtDate(ph.actualStart)} – {fmtDate(ph.actualEnd)}</span>
                  {ph.approvedBy && <span>Onaylayan: {personName(state, ph.approvedBy)} · {fmtDate(ph.approvedAt)}</span>}
                  {manage && (
                    <div className="ml-auto flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditPhase(ph)}><Pencil className="h-3.5 w-3.5 mr-1" />Aşamayı düzenle</Button>
                      {ph.status !== "done" && (
                        <Button size="sm" onClick={() => {
                          const err = completePhase(ph.id);
                          err ? toast.error(`Aşama tamamlanamaz: ${err}`) : toast.success(`${ph.name} tamamlandı`);
                        }}><CheckCircle2 className="h-3.5 w-3.5 mr-1" />Aşamayı tamamla</Button>
                      )}
                    </div>
                  )}
                </div>
                {steps.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    {ph.code === "05" ? "Keşif'te takım eklendiğinde her takım için 5 adım otomatik oluşur." : "Adım yok."}
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Adım</TableHead><TableHead>Sorumlu</TableHead><TableHead>Top kimde</TableHead>
                        <TableHead>Termin</TableHead><TableHead>Durum</TableHead><TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {steps.map((s) => {
                        const late = isOverdue(s.due, s.status === "done" || s.status === "out_of_scope");
                        return (
                          <TableRow key={s.id} className={s.status === "out_of_scope" ? "opacity-60" : ""}>
                            <TableCell className="font-medium">
                              {s.title}{s.required && <span className="text-destructive ml-1" title="Zorunlu">*</span>}
                            </TableCell>
                            <TableCell>{personName(state, s.ownerId)}</TableCell>
                            <TableCell><Pill tone={s.ball === "customer" ? "warning" : "muted"}>{BALL_LABEL[s.ball]}</Pill></TableCell>
                            <TableCell className={late ? "text-destructive font-medium" : ""}>{fmtDate(s.due)}</TableCell>
                            <TableCell><StepStatusBadge status={s.status} /></TableCell>
                            <TableCell>
                              {canEditItem(user, project, s.ownerId) && (
                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditStep(s)} aria-label="Adımı düzenle"><Pencil className="h-3.5 w-3.5" /></Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
      {editStep && <StepDialog step={editStep} project={project} onClose={() => setEditStep(null)} />}
      {editPhase && <PhaseDialog phase={editPhase} onClose={() => setEditPhase(null)} />}
    </>
  );
}

function StepDialog({ step, project, onClose }: { step: Step; project: Project; onClose: () => void }) {
  const { updateStep } = useRq();
  const [ownerId, setOwnerId] = useState(step.ownerId);
  const [ball, setBall] = useState<Ball>(step.ball);
  const [due, setDue] = useState(step.due ?? "");
  const [status, setStatus] = useState<StepStatus>(step.status);
  const [reason, setReason] = useState("");
  const needsReason = (due || null) !== step.due || status !== step.status;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{step.title}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-2"><Label>Sorumlu</Label><PersonSelect value={ownerId} onChange={setOwnerId} projectId={project.id} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2"><Label>Top kimde</Label><EnumSelect value={ball} onChange={setBall} labels={BALL_LABEL} /></div>
            <div className="grid gap-2"><Label>Durum</Label><EnumSelect value={status} onChange={setStatus} labels={STEP_STATUS_LABEL} /></div>
          </div>
          <div className="grid gap-2"><Label>Termin</Label><Input type="date" value={due} onChange={(e) => setDue(e.target.value)} /></div>
          {needsReason && <div className="grid gap-2"><Label>Gerekçe (tarih/durum değişikliğinde zorunlu)</Label><Textarea value={reason} onChange={(e) => setReason(e.target.value)} /></div>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Vazgeç</Button>
          <Button onClick={() => {
            if (needsReason && !reason.trim()) return toast.error("Gerekçe zorunlu");
            updateStep(step.id, { ownerId, ball, due: due || null, status }, reason.trim() || undefined);
            toast.success("Adım güncellendi");
            onClose();
          }}>Kaydet</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PhaseDialog({ phase, onClose }: { phase: Phase; onClose: () => void }) {
  const { updatePhase } = useRq();
  const [status, setStatus] = useState<PhaseStatus>(phase.status);
  const [planStart, setPlanStart] = useState(phase.planStart ?? "");
  const [planEnd, setPlanEnd] = useState(phase.planEnd ?? "");
  const [actualStart, setActualStart] = useState(phase.actualStart ?? "");
  const [reason, setReason] = useState("");
  const statusOptions = { ...PHASE_STATUS_LABEL } as Partial<Record<PhaseStatus, string>>;
  delete statusOptions.done;
  const needsReason = status !== phase.status || (planEnd || null) !== phase.planEnd || (planStart || null) !== phase.planStart;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{phase.code} — {phase.name}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label>Durum</Label>
            <EnumSelect value={status} onChange={setStatus} labels={(phase.status === "done" ? PHASE_STATUS_LABEL : statusOptions) as Record<PhaseStatus, string>} />
            <p className="text-xs text-muted-foreground">"Tamamlandı" için "Aşamayı tamamla" butonunu kullanın.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2"><Label>Plan başlangıç</Label><Input type="date" value={planStart} onChange={(e) => setPlanStart(e.target.value)} /></div>
            <div className="grid gap-2"><Label>Plan bitiş</Label><Input type="date" value={planEnd} onChange={(e) => setPlanEnd(e.target.value)} /></div>
          </div>
          <div className="grid gap-2"><Label>Gerçekleşen başlangıç</Label><Input type="date" value={actualStart} onChange={(e) => setActualStart(e.target.value)} /></div>
          <p className="text-xs text-muted-foreground">İlk plan (baseline) korunur: {fmtDate(phase.baselineEnd)}</p>
          {needsReason && <div className="grid gap-2"><Label>Gerekçe (zorunlu)</Label><Textarea value={reason} onChange={(e) => setReason(e.target.value)} /></div>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Vazgeç</Button>
          <Button onClick={() => {
            if (needsReason && !reason.trim()) return toast.error("Gerekçe zorunlu");
            updatePhase(phase.id, {
              status, planStart: planStart || null, planEnd: planEnd || null, actualStart: actualStart || null,
              baselineEnd: phase.baselineEnd ?? (planEnd || null),
            }, reason.trim() || undefined);
            onClose();
          }}>Kaydet</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Actions ────────────────────────────────────────────── */
function ActionsTab({ project }: { project: Project }) {
  const { state, addAction } = useRq();
  const { user } = useAuth();
  const [edit, setEdit] = useState<Action | null>(null);
  const [creating, setCreating] = useState(false);
  const actions = state.actions.filter((a) => a.projectId === project.id).sort((a, b) => (a.due ?? "9").localeCompare(b.due ?? "9"));
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Aksiyonlar</CardTitle>
        {canManageProject(user, project) && <Button size="sm" onClick={() => setCreating(true)}><Plus className="h-4 w-4 mr-1" />Aksiyon ekle</Button>}
      </CardHeader>
      <CardContent>
        {actions.length === 0 ? <EmptyState title="Aksiyon yok" description="Toplantılardan veya elle aksiyon ekleyebilirsiniz." /> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Başlık</TableHead><TableHead>Sahip</TableHead><TableHead>Top</TableHead><TableHead>Termin</TableHead>
              <TableHead>Öncelik</TableHead><TableHead>Durum</TableHead><TableHead>Kaynak</TableHead><TableHead className="w-10" />
            </TableRow></TableHeader>
            <TableBody>
              {actions.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.title}</TableCell>
                  <TableCell>{personName(state, a.ownerId)}</TableCell>
                  <TableCell>{BALL_LABEL[a.ball]}</TableCell>
                  <TableCell className={isOverdue(a.due, a.status === "done" || a.status === "cancelled") ? "text-destructive font-medium" : ""}>{fmtDate(a.due)}</TableCell>
                  <TableCell><PriorityBadge p={a.priority} /></TableCell>
                  <TableCell><ActionStatusBadge status={a.status} /></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{a.source === "meeting" ? "Toplantı" : a.source === "rule" ? "Otomatik kural" : "Elle"}</TableCell>
                  <TableCell>{canEditItem(user, project, a.ownerId) && <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEdit(a)} aria-label="Aksiyonu düzenle"><Pencil className="h-3.5 w-3.5" /></Button>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      {(edit || creating) && (
        <ActionDialog
          project={project}
          action={edit}
          onClose={() => { setEdit(null); setCreating(false); }}
          onCreate={(a) => addAction({ ...a, projectId: project.id, source: "manual", meetingId: null })}
        />
      )}
    </Card>
  );
}

type ActionDraft = { title: string; ownerId: string | null; ball: Ball; due: string | null; priority: Priority; status: ActionStatus };

function ActionDialog({ project, action, onClose, onCreate }: { project: Project; action: Action | null; onClose: () => void; onCreate: (a: ActionDraft) => void }) {
  const { updateAction } = useRq();
  const [d, setD] = useState<ActionDraft>(action ?? { title: "", ownerId: project.csmId, ball: "csm", due: null, priority: "medium", status: "open" });
  const [reason, setReason] = useState("");
  const needsReason = !!action && (d.due !== action.due || d.status !== action.status);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{action ? "Aksiyonu düzenle" : "Yeni aksiyon"}</DialogTitle></DialogHeader>
        <ActionFields d={d} setD={setD} projectId={project.id} showStatus />
        {needsReason && <div className="grid gap-2"><Label>Gerekçe (zorunlu)</Label><Textarea value={reason} onChange={(e) => setReason(e.target.value)} /></div>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Vazgeç</Button>
          <Button onClick={() => {
            if (!d.title.trim()) return toast.error("Başlık zorunlu");
            if (needsReason && !reason.trim()) return toast.error("Gerekçe zorunlu");
            if (action) updateAction(action.id, d, reason.trim() || undefined); else onCreate(d);
            onClose();
          }}>Kaydet</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ActionFields({ d, setD, projectId, showStatus }: { d: ActionDraft; setD: (d: ActionDraft) => void; projectId: string; showStatus?: boolean }) {
  return (
    <div className="grid gap-3">
      <div className="grid gap-2"><Label>Başlık</Label><Input value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2"><Label>Sahip</Label><PersonSelect value={d.ownerId} onChange={(v) => setD({ ...d, ownerId: v })} projectId={projectId} /></div>
        <div className="grid gap-2"><Label>Top kimde</Label><EnumSelect value={d.ball} onChange={(v) => setD({ ...d, ball: v })} labels={BALL_LABEL} /></div>
        <div className="grid gap-2"><Label>Termin</Label><Input type="date" value={d.due ?? ""} onChange={(e) => setD({ ...d, due: e.target.value || null })} /></div>
        <div className="grid gap-2"><Label>Öncelik</Label><EnumSelect value={d.priority} onChange={(v) => setD({ ...d, priority: v })} labels={PRIORITY_LABEL} /></div>
        {showStatus && <div className="grid gap-2"><Label>Durum</Label><EnumSelect value={d.status} onChange={(v) => setD({ ...d, status: v })} labels={ACTION_STATUS_LABEL} /></div>}
      </div>
    </div>
  );
}

/* ── Meetings ───────────────────────────────────────────── */
function MeetingsTab({ project }: { project: Project }) {
  const { state } = useRq();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const meetings = state.meetings.filter((m) => m.projectId === project.id).sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        {canManageProject(user, project) && <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" />Toplantı kaydet</Button>}
      </div>
      {meetings.length === 0 && <Card><EmptyState title="Toplantı yok" description="İlk toplantıyı kaydedin." /></Card>}
      {meetings.map((m) => {
        const acts = state.actions.filter((a) => a.meetingId === m.id);
        return (
          <Card key={m.id}>
            <CardContent className="p-4 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone="info">{MEETING_TYPE_LABEL[m.type]}</Pill>
                <span className="text-sm font-medium">{fmtDate(m.date)}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  İç: {m.internalIds.map((i) => personName(state, i)).join(", ") || "—"} · Müşteri: {m.contactIds.map((i) => personName(state, i)).join(", ") || "—"}
                </span>
              </div>
              {m.notes && <p className="text-sm">{m.notes}</p>}
              {m.decisions && <p className="text-sm"><span className="font-medium">Kararlar: </span>{m.decisions}</p>}
              {acts.length > 0 && (
                <div className="text-sm">
                  <span className="font-medium">Doğan aksiyonlar:</span>
                  <ul className="list-disc pl-5 text-muted-foreground">{acts.map((a) => <li key={a.id}>{a.title} — {personName(state, a.ownerId)} ({fmtDate(a.due)})</li>)}</ul>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
      {open && <MeetingDialog project={project} onClose={() => setOpen(false)} />}
    </div>
  );
}

function MeetingDialog({ project, onClose }: { project: Project; onClose: () => void }) {
  const { state, addMeeting } = useRq();
  const [type, setType] = useState<MeetingType>("checkin");
  const [date, setDate] = useState(todayISO());
  const [internalIds, setInternalIds] = useState<string[]>(project.csmId ? [project.csmId] : []);
  const [contactIds, setContactIds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [decisions, setDecisions] = useState("");
  const [actions, setActions] = useState<ActionDraft[]>([]);
  const contacts = state.contacts.filter((c) => c.projectId === project.id);
  const toggle = (arr: string[], set: (v: string[]) => void, id: string, on: boolean) => set(on ? [...arr, id] : arr.filter((x) => x !== id));
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Toplantı kaydet</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2"><Label>Tür</Label><EnumSelect value={type} onChange={setType} labels={MEETING_TYPE_LABEL} /></div>
            <div className="grid gap-2"><Label>Tarih</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          </div>
          <div className="grid gap-2">
            <Label>İç katılımcılar</Label>
            <div className="flex flex-wrap gap-3">{state.users.map((u) => (
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
            <div className="flex items-center justify-between">
              <Label>Toplantıdan doğan aksiyonlar</Label>
              <Button size="sm" variant="outline" onClick={() => setActions([...actions, { title: "", ownerId: project.csmId, ball: "csm", due: null, priority: "medium", status: "open" }])}><Plus className="h-3.5 w-3.5 mr-1" />Aksiyon</Button>
            </div>
            {actions.map((a, i) => (
              <div key={i} className="rounded-lg border p-3 relative">
                <Button size="icon" variant="ghost" className="h-7 w-7 absolute right-2 top-2" onClick={() => setActions(actions.filter((_, j) => j !== i))} aria-label="Kaldır"><Trash2 className="h-3.5 w-3.5" /></Button>
                <ActionFields d={a} setD={(v) => setActions(actions.map((x, j) => (j === i ? v : x)))} projectId={project.id} />
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Vazgeç</Button>
          <Button onClick={() => {
            if (actions.some((a) => !a.title.trim())) return toast.error("Aksiyon başlıkları boş olamaz");
            addMeeting({ projectId: project.id, type, date, internalIds, contactIds, notes, decisions }, actions);
            toast.success("Toplantı kaydedildi");
            onClose();
          }}>Kaydet</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Handover & commitments ─────────────────────────────── */
function HandoverTab({ project }: { project: Project }) {
  const { state, updateProject, addCommitment, updateCommitment } = useRq();
  const { user } = useAuth();
  const manage = canManageProject(user, project);
  const [text, setText] = useState("");
  const [phaseCode, setPhaseCode] = useState("07");
  const [editC, setEditC] = useState<Commitment | null>(null);
  const commitments = state.commitments.filter((c) => c.projectId === project.id);
  const phases = state.phases.filter((p) => p.projectId === project.id).sort((a, b) => a.order - b.order);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="text-base">Satış devri</CardTitle></CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid gap-2">
            <Label>CSM {isAllSeeing(user) ? "" : "(Manager atar)"}</Label>
            <Select value={project.csmId ?? NONE} disabled={!isAllSeeing(user)} onValueChange={(v) => updateProject(project.id, { csmId: v === NONE ? null : v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Atanmadı</SelectItem>
                {state.users.filter((u) => u.role === "csm").map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Devir alınan satışçı</Label>
            <Select value={project.salespersonId ?? NONE} disabled={!manage} onValueChange={(v) => updateProject(project.id, { salespersonId: v === NONE ? null : v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Seçilmedi</SelectItem>
                {state.salespeople.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Lisans modeli</Label>
            <Input defaultValue={project.licenseModel} disabled={!manage} onBlur={(e) => updateProject(project.id, { licenseModel: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label>Satın alınan modüller</Label>
            <div className="grid grid-cols-3 gap-2">
              {state.modules.map((m) => (
                <label key={m} className="flex items-center gap-2 text-sm">
                  <Checkbox disabled={!manage} checked={project.purchasedModules.includes(m)}
                    onCheckedChange={(c) => updateProject(project.id, { purchasedModules: c ? [...project.purchasedModules, m] : project.purchasedModules.filter((x) => x !== m) })} />
                  {m}
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Sözler ve taahhütler</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {commitments.length === 0 && <p className="text-sm text-muted-foreground">Taahhüt girilmedi.</p>}
          {commitments.map((c) => (
            <div key={c.id} className="rounded-lg border p-3 flex items-start gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium">{c.text}</p>
                <p className="text-xs text-muted-foreground">Hedef aşama: {phases.find((p) => p.code === c.targetPhaseCode)?.name ?? c.targetPhaseCode}{c.note ? ` · ${c.note}` : ""}</p>
              </div>
              <Pill tone={c.status === "met" ? "success" : c.status === "unmet" ? "danger" : "warning"}>{COMMIT_STATUS_LABEL[c.status]}</Pill>
              {manage && <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditC(c)} aria-label="Taahhüdü düzenle"><Pencil className="h-3.5 w-3.5" /></Button>}
            </div>
          ))}
          {manage && (
            <div className="flex gap-2 pt-2 border-t">
              <Input placeholder="Yeni taahhüt" value={text} onChange={(e) => setText(e.target.value)} />
              <Select value={phaseCode} onValueChange={setPhaseCode}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>{phases.map((p) => <SelectItem key={p.code} value={p.code}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
              <Button onClick={() => {
                if (!text.trim()) return;
                addCommitment({ projectId: project.id, text: text.trim(), targetPhaseCode: phaseCode, status: "open", note: "" });
                setText("");
              }}>Ekle</Button>
            </div>
          )}
        </CardContent>
      </Card>
      {editC && <CommitmentDialog c={editC} onClose={() => setEditC(null)} onSave={(p, r) => updateCommitment(editC.id, p, r)} />}
    </div>
  );
}

function CommitmentDialog({ c, onClose, onSave }: { c: Commitment; onClose: () => void; onSave: (p: Partial<Commitment>, reason?: string) => void }) {
  const [status, setStatus] = useState<CommitmentStatus>(c.status);
  const [note, setNote] = useState(c.note);
  const [reason, setReason] = useState("");
  const needsReason = status !== c.status;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{c.text}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-2"><Label>Durum</Label><EnumSelect value={status} onChange={setStatus} labels={COMMIT_STATUS_LABEL} /></div>
          <div className="grid gap-2"><Label>Not</Label><Textarea value={note} onChange={(e) => setNote(e.target.value)} /></div>
          {needsReason && <div className="grid gap-2"><Label>Gerekçe (zorunlu)</Label><Textarea value={reason} onChange={(e) => setReason(e.target.value)} /></div>}
        </div>
        <DialogFooter>
          <Button onClick={() => {
            if (needsReason && !reason.trim()) return toast.error("Gerekçe zorunlu");
            onSave({ status, note }, reason.trim() || undefined);
            onClose();
          }}>Kaydet</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Discovery & teams ──────────────────────────────────── */
function DiscoveryTab({ project }: { project: Project }) {
  const { state, updateProject, addTeam } = useRq();
  const { user } = useAuth();
  const manage = canManageProject(user, project);
  const [team, setTeam] = useState("");
  const groups = useMemo(() => {
    const g: Record<string, typeof state.questions> = {};
    state.questions.forEach((q) => { (g[q.group] ??= []).push(q); });
    return g;
  }, [state.questions]);
  const mismatch = project.desiredModules.filter((m) => !project.purchasedModules.includes(m));

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle className="text-base">Keşif formu</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          {Object.entries(groups).map(([g, qs]) => (
            <div key={g} className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{g}</p>
              {qs.map((q) => (
                <div key={q.id} className="grid gap-1.5">
                  <Label className="leading-snug">{q.text}{q.required && <span className="text-destructive ml-1">*</span>}</Label>
                  <Textarea
                    defaultValue={project.discoveryAnswers[q.id] ?? ""} disabled={!manage} rows={2}
                    className={q.required && !project.discoveryAnswers[q.id] ? "border-warning" : ""}
                    onBlur={(e) => updateProject(project.id, { discoveryAnswers: { ...project.discoveryAnswers, [q.id]: e.target.value } })}
                  />
                </div>
              ))}
            </div>
          ))}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Kullanılmak istenen modüller</p>
            <div className="grid grid-cols-3 gap-2">
              {state.modules.map((m) => (
                <label key={m} className="flex items-center gap-2 text-sm">
                  <Checkbox disabled={!manage} checked={project.desiredModules.includes(m)}
                    onCheckedChange={(c) => updateProject(project.id, { desiredModules: c ? [...project.desiredModules, m] : project.desiredModules.filter((x) => x !== m) })} />
                  {m}
                </label>
              ))}
            </div>
            {mismatch.length > 0 && (
              <p className="text-sm text-warning-foreground bg-warning/15 border border-warning/40 rounded-md px-3 py-2">
                Lisans uyumsuzluğu: {mismatch.join(", ")} satın alınan modüller arasında yok.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Takımlar</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {project.teams.length === 0 && <p className="text-sm text-muted-foreground">Takım tanımlanmadı.</p>}
          {project.teams.map((t) => <div key={t} className="rounded-lg border px-3 py-2 text-sm font-medium">{t}</div>)}
          {manage && (
            <div className="flex gap-2 pt-2">
              <Input placeholder="Takım adı" value={team} onChange={(e) => setTeam(e.target.value)} />
              <Button onClick={() => {
                if (!team.trim()) return;
                addTeam(project.id, team.trim());
                toast.success("Takım eklendi, Uyarlama aşamasına 5 adım açıldı");
                setTeam("");
              }}>Ekle</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Contacts ───────────────────────────────────────────── */
function ContactsTab({ project }: { project: Project }) {
  const { state, addContact } = useRq();
  const { user } = useAuth();
  const [f, setF] = useState({ name: "", title: "", email: "", phone: "", role: "pm" as ContactRole });
  const contacts = state.contacts.filter((c) => c.projectId === project.id);
  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {contacts.length === 0 ? <EmptyState title="Kişi yok" description="Müşteri tarafındaki kişileri ekleyin." /> : (
          <Table>
            <TableHeader><TableRow><TableHead>Ad</TableHead><TableHead>Unvan</TableHead><TableHead>E-posta</TableHead><TableHead>Telefon</TableHead><TableHead>Rol</TableHead></TableRow></TableHeader>
            <TableBody>{contacts.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell><TableCell>{c.title || "—"}</TableCell>
                <TableCell>{c.email || "—"}</TableCell><TableCell>{c.phone || "—"}</TableCell>
                <TableCell>{CONTACT_ROLE_LABEL[c.role]}</TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        )}
        {canManageProject(user, project) && (
          <div className="grid gap-2 sm:grid-cols-6 items-end border-t pt-4">
            <Input placeholder="Ad soyad" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            <Input placeholder="Unvan" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
            <Input placeholder="E-posta" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
            <Input placeholder="Telefon" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
            <EnumSelect value={f.role} onChange={(v) => setF({ ...f, role: v })} labels={CONTACT_ROLE_LABEL} />
            <Button onClick={() => {
              if (!f.name.trim()) return toast.error("Ad zorunlu");
              addContact({ ...f, projectId: project.id });
              setF({ name: "", title: "", email: "", phone: "", role: "pm" });
            }}>Kişi ekle</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── History ────────────────────────────────────────────── */
const FIELD_LABEL: Record<string, string> = {
  status: "Durum", due: "Termin", ownerId: "Sorumlu", ball: "Top kimde", planEnd: "Plan bitiş", planStart: "Plan başlangıç",
  actualStart: "Gerçekleşen başlangıç", actualEnd: "Gerçekleşen bitiş", health: "Sağlık", healthReason: "Sağlık gerekçesi",
  csmId: "CSM", salespersonId: "Satışçı", licenseModel: "Lisans modeli", purchasedModules: "Satın alınan modüller",
  desiredModules: "İstenen modüller", discoveryAnswers: "Keşif cevapları", priority: "Öncelik", title: "Başlık", note: "Not",
  approvedBy: "Onaylayan", approvedAt: "Onay tarihi", ballSince: "Top el değiştirme", baselineEnd: "Baseline",
};

function HistoryTab({ project }: { project: Project }) {
  const { state } = useRq();
  const [kind, setKind] = useState("all");
  const [userF, setUserF] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const valueText = (field: string | undefined, v: string | undefined) => {
    if (!v) return "—";
    if (field === "ownerId" || field === "csmId" || field === "approvedBy") return personName(state, v);
    if (field === "salespersonId") return state.salespeople.find((s) => s.id === v)?.name ?? v;
    if (field === "ball") return BALL_LABEL[v as Ball] ?? v;
    if (field === "status") return (STEP_STATUS_LABEL as Record<string, string>)[v] ?? (PHASE_STATUS_LABEL as Record<string, string>)[v] ?? (ACTION_STATUS_LABEL as Record<string, string>)[v] ?? (COMMIT_STATUS_LABEL as Record<string, string>)[v] ?? v;
    if (field === "health") return HEALTH_LABEL[v as Health] ?? v;
    if (field === "priority") return PRIORITY_LABEL[v as Priority] ?? v;
    if (field === "discoveryAnswers") return "(güncellendi)";
    if (/^\d{4}-\d{2}-\d{2}/.test(v)) return fmtDate(v);
    return v.length > 80 ? v.slice(0, 80) + "…" : v;
  };

  const events = [
    ...state.audit.filter((a) => a.projectId === project.id && !(a.entity === "meeting" && a.kind === "create")).map((a) => ({ at: a.at, type: a.entity, userId: a.userId, a, m: null as null | (typeof state.meetings)[number] })),
    ...state.meetings.filter((m) => m.projectId === project.id).map((m) => ({ at: m.date + "T12:00:00", type: "meeting", userId: m.internalIds[0] ?? "", a: null, m })),
  ]
    .filter((e) => (kind === "all" || e.type === kind) && (userF === "all" || e.userId === userF) && (!from || e.at.slice(0, 10) >= from) && (!to || e.at.slice(0, 10) <= to))
    .sort((x, y) => y.at.localeCompare(x.at));

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex flex-wrap gap-3">
          <Select value={kind} onValueChange={setKind}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm kayıtlar</SelectItem>
              {Object.entries(ENTITY_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={userF} onValueChange={setUserF}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm kullanıcılar</SelectItem>
              {state.users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="date" className="w-40" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Başlangıç tarihi" />
          <Input type="date" className="w-40" value={to} onChange={(e) => setTo(e.target.value)} aria-label="Bitiş tarihi" />
        </div>
        {events.length === 0 ? <EmptyState title="Kayıt yok" description="Filtrelere uyan kayıt bulunamadı." /> : (
          <ol className="relative border-l ml-2 space-y-4">
            {events.map((e, i) => (
              <li key={i} className="ml-4">
                <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-background bg-primary" />
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{e.m ? fmtDate(e.m.date) : fmtDateTime(e.at)}</span>
                  <Pill tone={e.m ? "info" : "muted"}>{ENTITY_LABEL[e.type] ?? e.type}</Pill>
                  {e.a && <span>{personName(state, e.a.userId)}</span>}
                </div>
                {e.m ? (
                  <p className="text-sm mt-1">
                    <span className="font-medium">{MEETING_TYPE_LABEL[e.m.type]} toplantısı</span> — Katılımcılar: {[...e.m.internalIds, ...e.m.contactIds].map((x) => personName(state, x)).join(", ")}
                  </p>
                ) : e.a && (
                  <div className="text-sm mt-1">
                    <span className="font-medium">{e.a.label}</span>
                    {e.a.field && (
                      <span className="text-muted-foreground"> · {FIELD_LABEL[e.a.field] ?? e.a.field}: {valueText(e.a.field, e.a.oldValue)} → <span className="text-foreground">{valueText(e.a.field, e.a.newValue)}</span></span>
                    )}
                    {e.a.kind === "create" && e.a.entity !== "project" && <span className="text-muted-foreground"> · oluşturuldu</span>}
                    {e.a.reason && <p className="text-xs text-muted-foreground italic">Gerekçe: {e.a.reason}</p>}
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
