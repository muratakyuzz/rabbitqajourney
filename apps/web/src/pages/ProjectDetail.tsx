import { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { ArrowLeft, Check, CheckCircle2, FileText, PanelRight, Pencil, Plus, Sparkles, Trash2, X } from "lucide-react";
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
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { AlertTriangle } from "lucide-react";
import { CredentialsSection, DocumentsTab } from "./project/Phase2Tabs";
import { GoLiveTab, ProjectAlertsPanel, RisksTab, TicketsTab } from "./project/Phase3Tabs";
import { ContinuityTab, MeetingExtras } from "./project/ContinuityTab";
import { DiscoveryTab } from "./project/DiscoveryContent";
import { ActionFields, type ActionDraft, EnumSelect, MeetingDetailDialog, MeetingDialog, NONE, PersonSelect } from "./project/MeetingDialog";
import { stepClickTarget, workspaceAvailable } from "./project/workspaces";
import { PhaseWorkspaceSheet } from "./project/workspaces/PhaseWorkspaceSheet";
import { VisibleIcon } from "@/components/rq/VisibleIcon";
import { Switch } from "@/components/ui/switch";
import { IntegrationsTab } from "./project/IntegrationsTab";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { effectiveStatus } from "@/lib/rabbitqa/ai-mock";
import { stepConditionResult } from "@rabbitqa/shared/domain/completion";
import {
  ActionStatusBadge, HealthBadge, PhaseStatusBadge, Pill, PriorityBadge, StepStatusBadge, isOverdue,
} from "@/components/rq/Badges";
import { useAuth } from "@/lib/auth-context";
import { personName, projectProgress, useAlertViews, useComputedAlerts, useRq } from "@/lib/rabbitqa/store";
import { derivePhaseStatus } from "@rabbitqa/shared/domain/alerts";
import { canEditFlow, canEditItem, canManageProject, canSeeCredentials, selectableUsers } from "@/lib/rabbitqa/perm";
import { isActivePhase, isOpenStep, previousStep } from "@rabbitqa/shared/domain/flow";
import { businessDaysBetween } from "@rabbitqa/shared/domain/business-days";
import {
  ACTION_STATUS_LABEL, BALL_LABEL, COMMIT_STATUS_LABEL, COMPLETION_LABEL, CONTACT_ROLE_LABEL, ENTITY_LABEL, HEALTH_LABEL, MEETING_STATUS_LABEL, MEETING_TYPE_LABEL,
  PHASE_STATUS_LABEL, PRIORITY_LABEL, STEP_STATUS_LABEL, INSTALL_LABEL, LLM_LABEL, SOURCE_LABEL, fmtDate, fmtDateTime, todayISO,
} from "@rabbitqa/shared/domain/labels";
import type {
  Action, ActionStatus, Ball, ContactRole, Dependency, Health, MeetingStatus, MeetingType, Phase, PhaseStatus, Priority, Project, Step, StepStatus,
} from "@rabbitqa/shared/domain/types";

function AiSourceBadge({ action }: { action: Action }) {
  const { state } = useRq();
  if (action.source !== "teams" && action.source !== "email") return <span className="text-xs text-muted-foreground">{SOURCE_LABEL[action.source]}</span>;
  const ins = state.insights.find((i) => i.id === action.insightId);
  return (
    <Tooltip>
      <TooltipTrigger asChild><span><Pill tone="info"><Sparkles className="h-3 w-3" />{SOURCE_LABEL[action.source]}</Pill></span></TooltipTrigger>
      <TooltipContent className="max-w-xs">
        {ins ? <><p className="text-xs">“{ins.sourceRef.excerpt}”</p>{ins.reviewedBy && <p className="text-xs mt-1 opacity-80">Onaylayan: {personName(state, ins.reviewedBy)}, {ins.reviewedAt ? fmtDate(ins.reviewedAt) : ""}</p>}</> : <p className="text-xs">AI önerisinden oluşturuldu</p>}
      </TooltipContent>
    </Tooltip>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { state } = useRq();
  const { user } = useAuth();
  const project = state.projects.find((p) => p.id === id);
  const allAlerts = useAlertViews();
  const [alertsOpen, setAlertsOpen] = useState(() => searchParams.get("panel") === "alerts" || searchParams.get("tab") === "alerts");

  if (!project) {
    return <Card><EmptyState title="Proje bulunamadı" description="Bu proje mevcut değil veya erişiminiz yok." /></Card>;
  }
  const progress = projectProgress(state, project.id);
  const manage = canManageProject(user, project);
  const pendingAi = state.insights.filter((i) => i.projectId === project.id && effectiveStatus(state, i) === "pending").length;
  const openAlerts = allAlerts.filter((a) => a.projectId === project.id && a.status === "open");

  return (
    <div className="space-y-6">
      <div>
        <Link to="/app/projects" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Projeler
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex flex-wrap items-center gap-2">{project.customerName}
              {pendingAi > 0 && <Link to={`/app/insights?project=${project.id}`}><Pill tone="info"><Sparkles className="h-3 w-3" />{pendingAi} AI önerisi</Pill></Link>}
              {openAlerts.length > 0 && (
                <button type="button" onClick={() => setAlertsOpen(true)}>
                  <Pill tone={openAlerts.some((a) => a.level === "red") ? "danger" : "warning"}>
                    <AlertTriangle className="h-3 w-3" />{openAlerts.length} açık uyarı
                  </Pill>
                </button>
              )}
            </h1>
            <p className="text-sm text-muted-foreground">{project.name}</p>
          </div>
          <div className="flex items-start gap-2">
            <Button asChild variant="outline" size="sm"><Link to={`/app/projects/${project.id}/report`}><FileText className="h-4 w-4 mr-1" />Haftalık rapor</Link></Button>
            <HealthCard project={project} canEdit={manage} />
          </div>
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

      <ProjectTabs project={project} searchParams={searchParams} />
      <Sheet open={alertsOpen} onOpenChange={setAlertsOpen}>
        <SheetContent side="right" className="w-full sm:max-w-[640px] overflow-y-auto">
          <SheetTitle className="sr-only">Uyarılar</SheetTitle>
          <div className="mt-6">
            <ProjectAlertsPanel project={project} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

/** Eski `?tab=` parametresini yeni sekme/çalışma alanı adlarına çevirir (plan §6.5 parametre eşlemesi). */
function legacyTabToWorkspace(raw: string | null): string | null {
  if (raw === "handover" || raw === "kickoff") return "00";
  if (raw === "training") return "04";
  if (raw === "adaptation") return "05";
  return null;
}

function ProjectTabs({ project, searchParams }: { project: Project; searchParams: URLSearchParams }) {
  const { user } = useAuth();
  const showAccess = canSeeCredentials(user, project);
  const raw = searchParams.get("tab");
  const legacyWs = legacyTabToWorkspace(raw);
  // Sekme olarak artık var olmayan değerler ("training", "adaptation", "alerts", "handover", "kickoff", "tickets")
  // ve yetkisiz "access" her zaman "phases"e düşer; geçerli kalan değerler aynen kullanılır.
  const validTabs = new Set(["phases", "actions", "meetings", "discovery", "documents", "risks", "golive", "continuity", "integrations", "contacts", "history", ...(showAccess ? ["access"] : [])]);
  const tab = raw && validTabs.has(raw) ? raw : "phases";
  const ws = legacyWs ?? searchParams.get("ws");
  return (
    <Tabs key={tab} defaultValue={tab}>
      <TabsList className="flex-wrap h-auto">
        <TabsTrigger value="phases">Aşamalar ve adımlar</TabsTrigger>
        <TabsTrigger value="actions">Aksiyonlar</TabsTrigger>
        <TabsTrigger value="meetings">Toplantılar</TabsTrigger>
        <TabsTrigger value="discovery">Keşif ve takımlar</TabsTrigger>
        {showAccess && <TabsTrigger value="access">Erişim bilgileri</TabsTrigger>}
        <TabsTrigger value="documents">Dokümanlar</TabsTrigger>
        <TabsTrigger value="risks">Riskler ve kararlar</TabsTrigger>
        <TabsTrigger value="golive">Go-Live</TabsTrigger>
        <TabsTrigger value="continuity">Süreklilik</TabsTrigger>
        <TabsTrigger value="integrations">Entegrasyonlar</TabsTrigger>
        <TabsTrigger value="contacts">Müşteri kişileri</TabsTrigger>
        <TabsTrigger value="history">Müşteri geçmişi</TabsTrigger>
        <Tooltip>
          <TooltipTrigger asChild>
            <span><TabsTrigger value="tickets" disabled>Destek kayıtları <Pill tone="muted" className="ml-1">Faz 2</Pill></TabsTrigger></span>
          </TooltipTrigger>
          <TooltipContent>Faz 2'de gelecek</TooltipContent>
        </Tooltip>
      </TabsList>
      <TabsContent value="phases"><PhasesTab project={project} initialWorkspace={ws ?? undefined} /></TabsContent>
      <TabsContent value="actions"><ActionsTab project={project} /></TabsContent>
      <TabsContent value="meetings"><MeetingsTab project={project} /></TabsContent>
      <TabsContent value="discovery"><DiscoveryTab project={project} /></TabsContent>
      {showAccess && <TabsContent value="access"><CredentialsSection project={project} layout="tab" /></TabsContent>}
      <TabsContent value="documents"><DocumentsTab project={project} /></TabsContent>
      <TabsContent value="risks"><RisksTab project={project} /></TabsContent>
      <TabsContent value="golive"><GoLiveTab project={project} /></TabsContent>
      <TabsContent value="continuity"><ContinuityTab project={project} renderCheckinDialog={(close) => <MeetingDialog project={project} onClose={close} defaultType="checkin" />} /></TabsContent>
      <TabsContent value="integrations"><IntegrationsTab project={project} /></TabsContent>
      <TabsContent value="contacts"><ContactsTab project={project} /></TabsContent>
      <TabsContent value="history"><HistoryTab project={project} /></TabsContent>
    </Tabs>
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
const DepIcon = ({ dep }: { dep: Dependency }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
        <span className="font-mono">{dep === "previous" ? "↳" : "∥"}</span>{dep === "previous" ? "Önceki" : "Bağımsız"}
      </span>
    </TooltipTrigger>
    <TooltipContent>{dep === "previous" ? "Önceki adım tamamlanınca açılır (aşamanın ilk adımıysa aşama başlayınca)" : "Aşama başlayınca açılır"}</TooltipContent>
  </Tooltip>
);

export function isNewlyActivated(at: string | null | undefined) {
  if (!at) return false;
  return businessDaysBetween(at.slice(0, 10), todayISO()) <= 1;
}

function CompletionHint({ step }: { step: Step }) {
  const { state } = useRq();
  const done = step.status === "done" || step.status === "out_of_scope";
  const label = <span className="block text-xs text-muted-foreground">{COMPLETION_LABEL[step.completion]}</span>;
  if (done) return label;
  const tip = step.completion === "meeting"
    ? `${step.meetingType ? MEETING_TYPE_LABEL[step.meetingType] : ""} toplantısı kaydedilince tamamlanır`
    : (() => {
        const r = stepConditionResult(state, step);
        return r ? `Eksik: ${r.missing.map((m) => m.label).join(", ")}` : "";
      })();
  return (
    <Tooltip>
      <TooltipTrigger asChild><span>{label}</span></TooltipTrigger>
      <TooltipContent>{tip}</TooltipContent>
    </Tooltip>
  );
}

function PhasesTab({ project, initialWorkspace }: { project: Project; initialWorkspace?: string }) {
  const { state, completePhase } = useRq();
  const { user } = useAuth();
  const manage = canManageProject(user, project);
  const phases = state.phases.filter((p) => p.projectId === project.id).sort((a, b) => a.order - b.order);
  const [editStep, setEditStep] = useState<Step | null>(null);
  const [editPhase, setEditPhase] = useState<Phase | null>(null);
  const [ws, setWs] = useState<{ phaseId: string; field: string | null; nonce: number } | null>(() => {
    if (!initialWorkspace || !workspaceAvailable(initialWorkspace, user, project)) return null;
    const ph = phases.find((p) => p.code === initialWorkspace);
    return ph ? { phaseId: ph.id, field: null, nonce: 0 } : null;
  });
  const [meetingFormType, setMeetingFormType] = useState<MeetingType | null>(null);
  const [meetingDetailId, setMeetingDetailId] = useState<string | null>(null);
  const activeIds = phases.filter(isActivePhase).map((p) => p.id);
  const today = todayISO();
  const computed = useComputedAlerts();
  const openAlerts = useAlertViews().filter((a) => a.projectId === project.id && a.status === "open");
  const alertsFor = (entity: "phase" | "step", entityId: string) => openAlerts.filter((a) => a.entity === entity && a.entityId === entityId);

  const onStepClick = (ph: Phase, s: Step) => {
    const hasWorkspace = workspaceAvailable(ph.code, user, project);
    const target = stepClickTarget(state, s, { hasWorkspace, canManage: manage, canEdit: canEditItem(user, project, s.ownerId) });
    if (target.kind === "workspace") setWs((cur) => ({ phaseId: ph.id, field: target.field, nonce: (cur?.phaseId === ph.id ? cur.nonce : 0) + 1 }));
    else if (target.kind === "meeting_form") setMeetingFormType(target.type);
    else if (target.kind === "meeting_detail") setMeetingDetailId(target.meetingId);
    else if (target.kind === "step_dialog") setEditStep(s);
  };

  return (
    <>
      <Accordion type="multiple" defaultValue={activeIds} className="space-y-2">
        {phases.map((ph, idx) => {
          const steps = state.steps.filter((s) => s.phaseId === ph.id).sort((a, b) => a.order - b.order);
          const counted = steps.filter((s) => s.status !== "out_of_scope");
          const done = counted.filter((s) => s.status === "done").length;
          const locked = ph.status === "locked";
          const prevPh = phases[idx - 1];
          const hasWorkspace = workspaceAvailable(ph.code, user, project);
          const phaseAlerts = alertsFor("phase", ph.id);
          return (
            <AccordionItem key={ph.id} value={ph.id} className={`rounded-lg border bg-card px-4 ${locked ? "opacity-80" : ""}`}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex flex-1 flex-wrap items-center gap-3 text-left pr-3">
                  <span className="font-mono text-xs text-muted-foreground">{ph.code}</span>
                  <span className="font-semibold">{ph.name}</span>
                  {phaseAlerts.length > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span><AlertTriangle className={`h-4 w-4 ${phaseAlerts.some((a) => a.level === "red") ? "text-destructive" : "text-warning"}`} /></span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {phaseAlerts.map((a) => <div key={a.key}>{a.title}</div>)}
                      </TooltipContent>
                    </Tooltip>
                  )}
                  <PhaseStatusBadge status={derivePhaseStatus(ph, computed)} />
                  {locked && (
                    <span className="text-xs text-muted-foreground font-normal">
                      {ph.dependency === "independent" ? "Bağımsız" : prevPh ? `Önceki aşama (${prevPh.code} ${prevPh.name}) tamamlanınca başlar` : ""}
                    </span>
                  )}
                  {!locked && ph.activatedAt && ph.status !== "done" && <span className="text-xs text-muted-foreground font-normal">Başladı: {fmtDate(ph.activatedAt)}</span>}
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
                  <div className="ml-auto flex gap-2">
                    {hasWorkspace && (
                      <Button size="sm" variant="outline" onClick={() => setWs((cur) => ({ phaseId: ph.id, field: null, nonce: (cur?.phaseId === ph.id ? cur.nonce : 0) + 1 }))}>
                        <PanelRight className="h-3.5 w-3.5 mr-1" />Formu aç
                      </Button>
                    )}
                    {manage && <Button size="sm" variant="outline" onClick={() => setEditPhase(ph)}><Pencil className="h-3.5 w-3.5 mr-1" />Aşamayı düzenle</Button>}
                    {manage && ph.status !== "done" && !locked && (
                      <Button size="sm" onClick={() => {
                        const err = completePhase(ph.id);
                        if (err) toast.error(`Aşama tamamlanamaz: ${err}`);
                      }}><CheckCircle2 className="h-3.5 w-3.5 mr-1" />Aşamayı tamamla</Button>
                    )}
                  </div>
                </div>
                {steps.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    {ph.code === "05" ? "Keşif'te takım eklendiğinde her takım için 5 adım otomatik oluşur." : "Adım yok."}
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Adım</TableHead><TableHead>Başlangıç</TableHead><TableHead>Süre</TableHead><TableHead>Sorumlu</TableHead><TableHead>Top kimde</TableHead>
                        <TableHead>Aktifleşti</TableHead><TableHead>Termin</TableHead><TableHead>Durum</TableHead><TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {steps.map((s) => {
                        const sLocked = s.status === "locked";
                        const late = isOpenStep(s) && !!s.due && s.due < today;
                        const lateDays = late ? businessDaysBetween(s.due!, today) : 0;
                        const prev = previousStep(steps, s);
                        const target = stepClickTarget(state, s, { hasWorkspace, canManage: manage, canEdit: canEditItem(user, project, s.ownerId) });
                        const rowClickable = target.kind !== "none";
                        const titleTooltip = sLocked && (s.completion === "data" || s.completion === "meeting") ? "Sırası gelmedi — veri şimdiden girilebilir" : null;
                        const stepAlerts = alertsFor("step", s.id);
                        return (
                          <TableRow
                            key={s.id}
                            className={`${s.status === "out_of_scope" || sLocked ? "opacity-60" : ""} ${rowClickable ? "cursor-pointer" : ""}`}
                            onClick={rowClickable ? () => onStepClick(ph, s) : undefined}
                          >
                            <TableCell className="font-medium">
                              {titleTooltip ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button type="button" className="text-left hover:underline" onClick={(e) => { e.stopPropagation(); if (rowClickable) onStepClick(ph, s); }}>{s.title}</button>
                                  </TooltipTrigger>
                                  <TooltipContent>{titleTooltip}</TooltipContent>
                                </Tooltip>
                              ) : (
                                <button type="button" className="text-left hover:underline" onClick={(e) => { e.stopPropagation(); if (rowClickable) onStepClick(ph, s); }}>{s.title}</button>
                              )}
                              {s.required && <span className="text-destructive ml-1" title="Zorunlu">*</span>}
                              {isOpenStep(s) && isNewlyActivated(s.activatedAt) && <Pill tone="info" className="ml-2">Yeni</Pill>}
                              {stepAlerts.length > 0 && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-flex ml-2"><AlertTriangle className={`h-3.5 w-3.5 ${stepAlerts.some((a) => a.level === "red") ? "text-destructive" : "text-warning"}`} /></span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {stepAlerts.map((a) => <div key={a.key}>{a.title}</div>)}
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </TableCell>
                            <TableCell><DepIcon dep={s.dependency} /></TableCell>
                            <TableCell className="whitespace-nowrap text-xs">{s.durationDays} iş günü</TableCell>
                            <TableCell>{personName(state, s.ownerId)}</TableCell>
                            <TableCell><Pill tone={s.ball === "customer" ? "warning" : "muted"}>{BALL_LABEL[s.ball]}</Pill></TableCell>
                            <TableCell className="text-xs">{fmtDate(s.activatedAt)}</TableCell>
                            <TableCell className={late ? "text-destructive font-medium" : ""}>
                              {sLocked ? <span>— <span className="text-xs text-muted-foreground">({s.durationDays} iş günü)</span></span> : (
                                <span className="flex flex-wrap items-center gap-1">{fmtDate(s.due)}{late && <Pill tone="danger">{lateDays} iş günü gecikti</Pill>}</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {sLocked ? (
                                <Tooltip>
                                  <TooltipTrigger asChild><span><StepStatusBadge status={s.status} /></span></TooltipTrigger>
                                  <TooltipContent>{s.dependency === "independent" || !prev ? "Aşama başlayınca açılır" : `${prev.title} tamamlanınca açılır`}</TooltipContent>
                                </Tooltip>
                              ) : <StepStatusBadge status={s.status} />}
                              {(s.completion === "data" || s.completion === "meeting") && <CompletionHint step={s} />}
                            </TableCell>
                            <TableCell>
                              {canEditItem(user, project, s.ownerId) && (
                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setEditStep(s); }} aria-label="Adımı düzenle"><Pencil className="h-3.5 w-3.5" /></Button>
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
      {ws && (() => {
        const phase = phases.find((p) => p.id === ws.phaseId);
        return phase ? <PhaseWorkspaceSheet project={project} phase={phase} focus={{ field: ws.field, nonce: ws.nonce }} onClose={() => setWs(null)} /> : null;
      })()}
      {meetingFormType && <MeetingDialog project={project} defaultType={meetingFormType} onClose={() => setMeetingFormType(null)} />}
      {meetingDetailId && <MeetingDetailDialog meetingId={meetingDetailId} onClose={() => setMeetingDetailId(null)} />}
    </>
  );
}

function StepDialog({ step, project, onClose }: { step: Step; project: Project; onClose: () => void }) {
  const { state, updateStep } = useRq();
  const { user } = useAuth();
  const flow = canEditFlow(user, project);
  const locked = step.status === "locked";
  const dataOrMeeting = step.completion === "data" || step.completion === "meeting";
  const [ownerId, setOwnerId] = useState(step.ownerId);
  const [ball, setBall] = useState<Ball>(step.ball);
  const [due, setDue] = useState(step.due ?? "");
  const [status, setStatus] = useState<StepStatus>(step.status);
  const [dependency, setDependency] = useState<Dependency>(step.dependency);
  const [durationDays, setDurationDays] = useState(step.durationDays);
  const [reason, setReason] = useState("");
  const needsReason = (due || null) !== step.due || status !== step.status;
  const statusLabels = { ...STEP_STATUS_LABEL } as Partial<Record<StepStatus, string>>;
  if (!locked) delete statusLabels.locked;
  if (dataOrMeeting) {
    const allowed = new Set<StepStatus>([step.status, "out_of_scope"]);
    if (step.status === "out_of_scope") allowed.add("pending");
    (Object.keys(statusLabels) as StepStatus[]).forEach((k) => { if (!allowed.has(k)) delete statusLabels[k]; });
  }
  const condition = dataOrMeeting ? stepConditionResult(state, step) : null;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{step.title}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-2"><Label>Sorumlu</Label><PersonSelect value={ownerId} onChange={setOwnerId} projectId={project.id} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2"><Label>Top kimde</Label><EnumSelect value={ball} onChange={setBall} labels={BALL_LABEL} /></div>
            <div className="grid gap-2">
              <Label>Durum</Label>
              {locked ? (
                <>
                  <Input value="Sırası gelmedi" disabled />
                  <p className="text-xs text-muted-foreground">Sırası gelince otomatik açılır; durumu elle değiştirilemez.</p>
                </>
              ) : <EnumSelect value={status} onChange={setStatus} labels={statusLabels as Record<StepStatus, string>} />}
              {dataOrMeeting && !locked && (
                <p className="text-xs text-muted-foreground">Bu adım {step.completion === "data" ? "veriyle" : "toplantıyla"} tamamlanır; elle yalnızca Kapsam dışı yapılabilir.</p>
              )}
            </div>
          </div>
          {condition && (
            <div className="grid gap-1.5 rounded-md border p-3">
              <Label className="text-xs text-muted-foreground">Tamamlanma koşulu</Label>
              <ul className="space-y-1">
                {condition.checks.map((c) => (
                  <li key={c.field} className="flex items-center gap-2 text-sm">
                    {c.met ? <Check className="h-3.5 w-3.5 text-success" /> : <X className="h-3.5 w-3.5 text-destructive" />}
                    {c.label}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!locked && <div className="grid gap-2"><Label>Termin</Label><Input type="date" value={due} onChange={(e) => setDue(e.target.value)} /></div>}
          {flow && (
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Başlangıç</Label>
                <Select value={dependency} onValueChange={(v) => setDependency(v as Dependency)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="previous">Önceki adım tamamlanınca</SelectItem>
                    <SelectItem value="independent">Bağımsız</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Süre (iş günü)</Label>
                <Input type="number" min={1} max={60} value={durationDays} disabled={!locked} onChange={(e) => setDurationDays(Math.max(1, Math.min(60, Number(e.target.value) || 1)))} />
                {!locked && <p className="text-xs text-muted-foreground">Süre yalnızca adım kilitliyken değişir.</p>}
              </div>
            </div>
          )}
          {needsReason && <div className="grid gap-2"><Label>Gerekçe (tarih/durum değişikliğinde zorunlu)</Label><Textarea value={reason} onChange={(e) => setReason(e.target.value)} /></div>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Vazgeç</Button>
          <Button onClick={() => {
            if (needsReason && !reason.trim()) return toast.error("Gerekçe zorunlu");
            const p: Partial<Step> = { ownerId, ball };
            if (!locked) { p.due = due || null; p.status = status; }
            if (flow) { p.dependency = dependency; if (locked) p.durationDays = durationDays; }
            const err = updateStep(step.id, p, reason.trim() || undefined);
            if (err) return toast.error(err);
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
  const locked = phase.status === "locked";
  const initialStatus: PhaseStatus = phase.status === "late" || phase.status === "at_risk" ? "in_progress" : phase.status;
  const [status, setStatus] = useState<PhaseStatus>(initialStatus);
  const [planStart, setPlanStart] = useState(phase.planStart ?? "");
  const [planEnd, setPlanEnd] = useState(phase.planEnd ?? "");
  const [actualStart, setActualStart] = useState(phase.actualStart ?? "");
  const [reason, setReason] = useState("");
  const statusOptions = { ...PHASE_STATUS_LABEL } as Partial<Record<PhaseStatus, string>>;
  delete statusOptions.done;
  delete statusOptions.locked;
  delete statusOptions.late;
  delete statusOptions.at_risk;
  const needsReason = status !== initialStatus || (planEnd || null) !== phase.planEnd || (planStart || null) !== phase.planStart;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{phase.code} — {phase.name}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label>Durum</Label>
            {locked ? (
              <>
                <Input value="Sırası gelmedi" disabled />
                <p className="text-xs text-muted-foreground">Aşamanın sırası gelince otomatik başlar; durumu elle değiştirilemez.</p>
              </>
            ) : (
              <>
                <EnumSelect value={status} onChange={setStatus} labels={(phase.status === "done" ? { ...statusOptions, done: PHASE_STATUS_LABEL.done } : statusOptions) as Record<PhaseStatus, string>} />
                <p className="text-xs text-muted-foreground">"Tamamlandı" için "Aşamayı tamamla" butonunu kullanın.</p>
              </>
            )}
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
            const err = updatePhase(phase.id, {
              ...(status !== initialStatus ? { status } : {}), planStart: planStart || null, planEnd: planEnd || null, actualStart: actualStart || null,
              baselineEnd: phase.baselineEnd ?? (planEnd || null),
            }, reason.trim() || undefined);
            if (err) return toast.error(err);
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
                  <TableCell className="font-medium">{a.title}<VisibleIcon visible={a.isCustomerVisible} /></TableCell>
                  <TableCell>{personName(state, a.ownerId)}</TableCell>
                  <TableCell>{BALL_LABEL[a.ball]}</TableCell>
                  <TableCell className={isOverdue(a.due, a.status === "done" || a.status === "cancelled") ? "text-destructive font-medium" : ""}>{fmtDate(a.due)}</TableCell>
                  <TableCell><PriorityBadge p={a.priority} /></TableCell>
                  <TableCell><ActionStatusBadge status={a.status} /></TableCell>
                  <TableCell><AiSourceBadge action={a} /></TableCell>
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

function ActionDialog({ project, action, onClose, onCreate }: { project: Project; action: Action | null; onClose: () => void; onCreate: (a: ActionDraft) => void }) {
  const { updateAction, state } = useRq();
  const [d, setD] = useState<ActionDraft>(action ? { title: action.title, ownerId: action.ownerId, ball: action.ball, due: action.due, priority: action.priority, status: action.status, isCustomerVisible: action.isCustomerVisible } : { title: "", ownerId: project.csmId, ball: "csm", due: null, priority: "medium", status: "open", isCustomerVisible: true });
  const [reason, setReason] = useState("");
  const needsReason = !!action && (d.due !== action.due || d.status !== action.status);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{action ? "Aksiyonu düzenle" : "Yeni aksiyon"}</DialogTitle></DialogHeader>
        {action?.insightId && (() => { const ins = state.insights.find((i) => i.id === action.insightId); return ins ? (
          <p className="rounded-md border bg-muted/40 px-3 py-2 text-xs"><Sparkles className="inline h-3 w-3 mr-1 text-primary" />Kaynak mesaj ({ins.source === "teams" ? "Teams" : "E-posta"} · {ins.sourceRef.from}): “{ins.sourceRef.excerpt}”</p>
        ) : null; })()}
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


/* ── Meetings ───────────────────────────────────────────── */
function MeetingsTab({ project }: { project: Project }) {
  const { state, updateMeeting } = useRq();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [fType, setFType] = useState("all");
  const [fStatus, setFStatus] = useState("all");
  const meetings = state.meetings
    .filter((m) => m.projectId === project.id)
    .filter((m) => (fType === "all" || m.type === fType) && (fStatus === "all" || m.status === fStatus))
    .sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={fType} onValueChange={setFType}>
            <SelectTrigger className="w-44" aria-label="Tür"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">Tüm türler</SelectItem>{Object.entries(MEETING_TYPE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={fStatus} onValueChange={setFStatus}>
            <SelectTrigger className="w-40" aria-label="Durum"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">Tüm durumlar</SelectItem>{Object.entries(MEETING_STATUS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {canManageProject(user, project) && <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" />Toplantı kaydet</Button>}
      </div>
      {meetings.length === 0 && (
        <Card><EmptyState title={state.meetings.some((m) => m.projectId === project.id) ? "Filtreye uyan toplantı yok" : "Toplantı yok"} description="İlk toplantıyı kaydedin." /></Card>
      )}
      {meetings.map((m) => {
        const acts = state.actions.filter((a) => a.meetingId === m.id);
        const manage = canManageProject(user, project);
        return (
          <Card key={m.id}>
            <CardContent className="p-4 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone="info">{MEETING_TYPE_LABEL[m.type]}</Pill>
                <Pill tone={m.status === "held" ? "success" : m.status === "cancelled" ? "muted" : "info"}>{MEETING_STATUS_LABEL[m.status]}</Pill>
                <VisibleIcon visible={m.isCustomerVisible} />
                <span className="text-sm font-medium">{fmtDate(m.date)}</span>
                {m.type === "adaptation" && <span className="text-xs text-muted-foreground">Takım: {m.teamId ?? "—"}</span>}
                <span className="text-xs text-muted-foreground ml-auto">
                  İç: {m.internalIds.map((i) => personName(state, i)).join(", ") || "—"} · Müşteri: {m.contactIds.map((i) => personName(state, i)).join(", ") || "—"}
                </span>
                {m.status === "planned" && manage && (
                  <Button size="sm" variant="outline" onClick={() => {
                    const err = updateMeeting(m.id, { status: "held" });
                    if (err) toast.error(err); else toast.success("Toplantı Yapıldı olarak işaretlendi");
                  }}>Yapıldı olarak işaretle</Button>
                )}
              </div>
              {m.type === "training" && m.training && (
                <p className="text-sm text-muted-foreground">
                  Eğitmen: {personName(state, m.training.trainerId)}{m.training.modules.length > 0 ? ` · Modüller: ${m.training.modules.join(", ")}` : ""}
                  {m.training.recordingUrl && <> · <a href={m.training.recordingUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">Kayıt linki</a></>}
                </p>
              )}
              {m.notes && <p className="text-sm">{m.notes}</p>}
              {m.decisions && <p className="text-sm"><span className="font-medium">Kararlar: </span>{m.decisions}</p>}
              {acts.length > 0 && (
                <div className="text-sm">
                  <span className="font-medium">Doğan aksiyonlar:</span>
                  <ul className="list-disc pl-5 text-muted-foreground">{acts.map((a) => <li key={a.id}>{a.title} — {personName(state, a.ownerId)} ({fmtDate(a.due)})</li>)}</ul>
                </div>
              )}
              <MeetingExtras meeting={m} canEdit={canManageProject(user, project)} />
            </CardContent>
          </Card>
        );
      })}
      {open && <MeetingDialog project={project} onClose={() => setOpen(false)} />}
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
  installType: "Kurulum tipi", llmChoice: "LLM tercihi", presentationShared: "Sunum paylaşıldı", reqDocShared: "Gereksinim dokümanı paylaşıldı",
  reqDocSharedAt: "Paylaşım tarihi", teamInfo: "Takım bilgisi", measurements: "KPI ölçümleri", participants: "Katılımcılar", date: "Tarih", notes: "Notlar", required: "Zorunlu",
  noCommitments: "Taahhüt yok", teamId: "Takım",
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
    if (field === "discoveryAnswers" || field === "teamInfo" || field === "measurements") return "(güncellendi)";
    if (field === "installType") return (INSTALL_LABEL as Record<string, string>)[v] ?? v;
    if (field === "llmChoice") return (LLM_LABEL as Record<string, string>)[v] ?? v;
    if (v === "true") return "Evet";
    if (v === "false") return "Hayır";
    if (/^\d{4}-\d{2}-\d{2}/.test(v)) return fmtDate(v);
    return v.length > 80 ? v.slice(0, 80) + "…" : v;
  };

  const events = [
    ...state.audit.filter((a) => a.projectId === project.id && !(a.entity === "meeting" && a.kind === "create")).map((a) => ({ at: a.at, type: a.entity, userId: a.userId, a, m: null as null | (typeof state.meetings)[number] })),
    ...state.meetings.filter((m) => m.projectId === project.id).map((m) => ({ at: m.date + "T12:00:00", type: "meeting", userId: m.internalIds[0] ?? "", a: null, m })),
  ]
    .filter((e) => (kind === "all" || e.type === kind || (kind === "insight" && !!e.a?.reason?.startsWith("AI Insight"))) && (userF === "all" || e.userId === userF) && (!from || e.at.slice(0, 10) >= from) && (!to || e.at.slice(0, 10) <= to))
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
                  <Pill tone={e.m ? "info" : e.a?.kind === "view" ? "warning" : "muted"}>{ENTITY_LABEL[e.type] ?? e.type}</Pill>
                  {e.a && <span>{personName(state, e.a.userId)}</span>}
                </div>
                {e.m ? (
                  <p className="text-sm mt-1">
                    <span className="font-medium">{MEETING_TYPE_LABEL[e.m.type]} toplantısı</span>
                    {e.m.status !== "held" && <span className="text-muted-foreground"> ({MEETING_STATUS_LABEL[e.m.status]})</span>}
                    {" "}— Katılımcılar: {[...e.m.internalIds, ...e.m.contactIds].map((x) => personName(state, x)).join(", ")}
                  </p>
                ) : e.a && (
                  <div className="text-sm mt-1">
                    <span className="font-medium">{e.a.label}</span>
                    {e.a.field && (
                      <span className="text-muted-foreground"> · {FIELD_LABEL[e.a.field] ?? e.a.field}: {valueText(e.a.field, e.a.oldValue)} → <span className="text-foreground">{valueText(e.a.field, e.a.newValue)}</span></span>
                    )}
                    {e.a.kind === "create" && !e.a.label.includes("açıldı") && !["project", "training", "credential", "document", "adaptation"].includes(e.a.entity) && <span className="text-muted-foreground"> · oluşturuldu</span>}
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
