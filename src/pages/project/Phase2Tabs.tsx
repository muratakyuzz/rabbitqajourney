import { useState } from "react";
import { Eye, EyeOff, FileText, Plus } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/EmptyState";
import { Pill, StepStatusBadge } from "@/components/rq/Badges";
import { useAuth } from "@/lib/auth-context";
import { personName, useRq } from "@/lib/rabbitqa/store";
import { canManageProject, canSeeCredentials, selectableUsers } from "@/lib/rabbitqa/perm";
import { Link } from "react-router-dom";
import { KpiChart } from "@/components/rq/KpiChart";
import { VisibleIcon } from "@/components/rq/VisibleIcon";
import { DOC_TYPE_LABEL, INSTALL_LABEL, LLM_LABEL, MEETING_TYPE_LABEL, fmtDate, todayISO } from "@/lib/rabbitqa/labels";
import type { DocType, InstallType, LlmChoice, Project } from "@/lib/rabbitqa/types";

const NONE = "__none";

/* ── Kick-off ───────────────────────────────────────────── */
export function KickoffTab({ project }: { project: Project }) {
  const { state, setKickoff } = useRq();
  const { user } = useAuth();
  const manage = canManageProject(user, project);
  const [installType, setInstallType] = useState<InstallType | null>(project.installType);
  const [llm, setLlm] = useState<LlmChoice | null>(project.llmChoice);
  const [presentation, setPresentation] = useState(project.presentationShared);
  const [reqDoc, setReqDoc] = useState(project.reqDocShared);
  const [reqDocAt, setReqDocAt] = useState(project.reqDocSharedAt ?? "");
  const [reason, setReason] = useState("");

  const choiceChanged = (project.installType && installType !== project.installType) || (project.llmChoice && llm !== project.llmChoice);
  const kickoffMeeting = state.meetings.find((m) => m.projectId === project.id && m.type === "kickoff" && m.status === "held");
  const ruleActions = state.actions.filter((a) => a.projectId === project.id && a.source === "rule");

  const save = () => {
    if (choiceChanged && !reason.trim()) return toast.error("Kurulum tipi veya LLM değişikliğinde gerekçe zorunlu");
    const { error, summary } = setKickoff(project.id, {
      presentationShared: presentation, installType, llmChoice: llm,
      reqDocShared: installType === "onprem" ? reqDoc : false,
      reqDocSharedAt: installType === "onprem" && reqDoc ? reqDocAt || todayISO() : null,
    }, reason.trim() || undefined);
    if (error) return toast.error(error);
    setReason("");
    toast.success("Kick-off bilgileri kaydedildi", {
      description: summary ? <span>{summary}. <Link className="underline" to={`/app/projects/${project.id}?tab=history`}>Müşteri geçmişinde gör</Link></span> : undefined,
      duration: summary ? 8000 : undefined,
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle className="text-base">Kick-off</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="text-sm">
            Kick-off toplantısı:{" "}
            {kickoffMeeting ? <span className="font-medium">{fmtDate(kickoffMeeting.date)} tarihinde yapıldı</span> : <span className="text-muted-foreground">Henüz kaydedilmedi ("Toplantılar" sekmesinden ekleyin)</span>}
          </div>
          <label className="flex items-center gap-3 text-sm">
            <Switch checked={presentation} onCheckedChange={setPresentation} disabled={!manage} />
            Onboarding sunumu müşteriyle paylaşıldı
          </label>

          <div className="space-y-2">
            <Label>Kurulum tipi</Label>
            <RadioGroup value={installType ?? NONE} onValueChange={(v) => setInstallType(v === NONE ? null : v as InstallType)} className="flex gap-6" disabled={!manage}>
              {(Object.keys(INSTALL_LABEL) as InstallType[]).map((k) => (
                <label key={k} className="flex items-center gap-2 text-sm"><RadioGroupItem value={k} />{INSTALL_LABEL[k]}</label>
              ))}
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value={NONE} disabled={project.installType !== null} />Henüz belli değil</label>
            </RadioGroup>
          </div>

          {installType === "onprem" && (
            <div className="rounded-lg border p-3 space-y-3">
              <label className="flex items-center gap-3 text-sm">
                <Switch checked={reqDoc} onCheckedChange={setReqDoc} disabled={!manage} />
                Kurulum gereksinim dokümanı {reqDoc ? "paylaşıldı" : "paylaşılmadı"}
              </label>
              {reqDoc && (
                <div className="grid gap-2 max-w-xs"><Label>Paylaşım tarihi</Label><Input type="date" value={reqDocAt} onChange={(e) => setReqDocAt(e.target.value)} disabled={!manage} /></div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>LLM tercihi</Label>
            <RadioGroup value={llm ?? NONE} onValueChange={(v) => setLlm(v === NONE ? null : v as LlmChoice)} className="grid gap-2" disabled={!manage}>
              {(Object.keys(LLM_LABEL) as LlmChoice[]).map((k) => (
                <label key={k} className="flex items-center gap-2 text-sm"><RadioGroupItem value={k} />{LLM_LABEL[k]}</label>
              ))}
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value={NONE} disabled={project.llmChoice !== null} />Henüz belli değil</label>
            </RadioGroup>
          </div>

          {choiceChanged && (
            <div className="grid gap-2">
              <Label>Değişiklik gerekçesi (zorunlu)</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Neden değişti?" />
              <p className="text-xs text-muted-foreground">Eski adımlar silinmez, "Kapsam dışı" yapılır; yeni adım ve aksiyonlar açılır.</p>
            </div>
          )}
          {manage && <Button onClick={save}>Kaydet</Button>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Otomatik açılan aksiyonlar</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {ruleActions.length === 0 && <p className="text-sm text-muted-foreground">Bu seçimlere bağlı otomatik aksiyon yok.</p>}
          {ruleActions.map((a) => (
            <div key={a.id} className="rounded-lg border p-2.5 text-sm">
              <p className={a.status === "cancelled" ? "line-through text-muted-foreground" : "font-medium"}>{a.title}</p>
              <p className="text-xs text-muted-foreground">{personName(state, a.ownerId)} · {a.status === "cancelled" ? "İptal" : a.status === "done" ? "Tamamlandı" : "Açık"}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/* ── KPI ────────────────────────────────────────────────── */
export function KpiSection({ project }: { project: Project }) {
  const { state, addKpi, addMeasurement, updateKpi } = useRq();
  const { user } = useAuth();
  const manage = canManageProject(user, project);
  const kpis = state.kpis.filter((k) => k.projectId === project.id);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", unit: "", baseline: "", target: "", targetDate: "", visible: true });
  const [measure, setMeasure] = useState<Record<string, string>>({});

  return (
    <Card className="lg:col-span-3">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">KPI'lar</CardTitle>
        {manage && <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" />KPI ekle</Button>}
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {kpis.length === 0 && <p className="text-sm text-muted-foreground">KPI tanımlanmadı.</p>}
        {kpis.map((k) => {
          const current = k.measurements.at(-1)?.value ?? k.baseline;
          const pct = k.baseline !== null && k.target !== null && current !== null && k.target !== k.baseline
            ? Math.max(0, Math.min(100, Math.round(((current - k.baseline) / (k.target - k.baseline)) * 100))) : null;
          const missing = k.baseline === null || k.target === null;
          return (
            <div key={k.id} className="rounded-lg border p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-sm">{k.name}<VisibleIcon visible={k.isCustomerVisible} /></p>
                {missing && <Pill tone="warning">Ölçülemez</Pill>}
              </div>
              <p className="text-xs text-muted-foreground">
                Başlangıç {k.baseline ?? "—"} {k.unit} · Hedef {k.target ?? "—"} {k.unit} · {fmtDate(k.targetDate)}
              </p>
              <div className="flex items-center gap-2">
                <Progress value={pct ?? 0} className="h-2" />
                <span className="text-xs w-24 text-right">Mevcut: {current ?? "—"} {k.unit}</span>
              </div>
              {k.measurements.length > 0 ? <KpiChart kpi={k} /> : <p className="text-xs text-muted-foreground">Henüz ölçüm yok.</p>}
              {manage && <label className="flex items-center gap-2 text-xs"><Switch checked={k.isCustomerVisible} onCheckedChange={(c) => updateKpi(k.id, { isCustomerVisible: c })} />Müşteriye görünür</label>}
              {manage && (
                <div className="flex gap-2">
                  <Input type="number" placeholder="Yeni ölçüm" className="h-8" value={measure[k.id] ?? ""} onChange={(e) => setMeasure({ ...measure, [k.id]: e.target.value })} />
                  <Button size="sm" variant="outline" onClick={() => {
                    const v = Number(measure[k.id]);
                    if (measure[k.id] === undefined || measure[k.id] === "" || isNaN(v)) return;
                    addMeasurement(k.id, { date: todayISO(), value: v });
                    setMeasure({ ...measure, [k.id]: "" });
                  }}>Ekle</Button>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Yeni KPI</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-2"><Label>Ad</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2"><Label>Birim</Label><Input value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} /></div>
              <div className="grid gap-2"><Label>Hedef tarih</Label><Input type="date" value={f.targetDate} onChange={(e) => setF({ ...f, targetDate: e.target.value })} /></div>
              <div className="grid gap-2"><Label>Başlangıç değeri</Label><Input type="number" value={f.baseline} onChange={(e) => setF({ ...f, baseline: e.target.value })} /></div>
              <div className="grid gap-2"><Label>Hedef değer</Label><Input type="number" value={f.target} onChange={(e) => setF({ ...f, target: e.target.value })} /></div>
            </div>
            <label className="flex items-center gap-3 text-sm"><Switch checked={f.visible} onCheckedChange={(c) => setF({ ...f, visible: c })} />Müşteriye görünür</label>
          </div>
          <DialogFooter>
            <Button onClick={() => {
              if (!f.name.trim()) return toast.error("Ad zorunlu");
              addKpi({ projectId: project.id, name: f.name.trim(), unit: f.unit, baseline: f.baseline === "" ? null : Number(f.baseline), target: f.target === "" ? null : Number(f.target), targetDate: f.targetDate || null, isCustomerVisible: f.visible });
              setF({ name: "", unit: "", baseline: "", target: "", targetDate: "", visible: true });
              setOpen(false);
            }}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/* ── Team info row ──────────────────────────────────────── */
export function TeamRow({ project, team }: { project: Project; team: string }) {
  const { setTeamInfo } = useRq();
  const { user } = useAuth();
  const manage = canManageProject(user, project);
  const info = project.teamInfo[team] ?? { contact: "", users: null };
  return (
    <div className="rounded-lg border p-3 space-y-2">
      <p className="text-sm font-medium">{team}</p>
      <div className="grid grid-cols-2 gap-2">
        <Input className="h-8" placeholder="Müşteri sorumlusu" defaultValue={info.contact} disabled={!manage}
          onBlur={(e) => setTeamInfo(project.id, team, { ...info, contact: e.target.value })} />
        <Input className="h-8" type="number" placeholder="Kullanıcı sayısı" defaultValue={info.users ?? ""} disabled={!manage}
          onBlur={(e) => setTeamInfo(project.id, team, { ...info, users: e.target.value === "" ? null : Number(e.target.value) })} />
      </div>
    </div>
  );
}

/* ── Training ───────────────────────────────────────────── */
export function TrainingTab({ project }: { project: Project }) {
  const { state, addTraining, updateTraining } = useRq();
  const { user } = useAuth();
  const manage = canManageProject(user, project);
  const sessions = state.trainings.filter((t) => t.projectId === project.id).sort((a, b) => a.date.localeCompare(b.date));
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ date: todayISO(), trainerId: project.csmId, attendees: "", modules: [] as string[], recordingUrl: "", notes: "", status: "planned" as "planned" | "done" });
  const done = sessions.filter((s) => s.status === "done").length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{done}/{sessions.length} session yapıldı</p>
        {manage && <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" />Session ekle</Button>}
      </div>
      {sessions.length === 0 && <Card><EmptyState title="Eğitim session'ı yok" description="İlk eğitim session'ını planlayın." /></Card>}
      {sessions.map((s) => (
        <Card key={s.id}>
          <CardContent className="p-4 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{fmtDate(s.date)}</span>
              <Pill tone={s.status === "done" ? "success" : "info"}>{s.status === "done" ? "Yapıldı" : "Planlandı"}</Pill>
              <span className="text-xs text-muted-foreground">Eğitmen: {personName(state, s.trainerId)}</span>
              {manage && s.status === "planned" && (
                <Button size="sm" variant="outline" className="ml-auto" onClick={() => updateTraining(s.id, { status: "done" })}>Yapıldı olarak işaretle</Button>
              )}
            </div>
            <p className="text-sm"><span className="text-muted-foreground">Katılımcılar: </span>{s.attendees || "—"}</p>
            <div className="flex flex-wrap gap-1">{s.modules.map((m) => <Pill key={m} tone="muted">{m}</Pill>)}</div>
            {s.recordingUrl && <a href={s.recordingUrl} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">Kayıt linki</a>}
            {s.notes && <p className="text-sm text-muted-foreground">{s.notes}</p>}
          </CardContent>
        </Card>
      ))}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Eğitim session'ı</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2"><Label>Tarih</Label><Input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></div>
              <div className="grid gap-2">
                <Label>Eğitmen</Label>
                <Select value={f.trainerId ?? NONE} onValueChange={(v) => setF({ ...f, trainerId: v === NONE ? null : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Seçilmedi</SelectItem>
                    {selectableUsers(state).map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2"><Label>Katılımcılar</Label><Textarea rows={2} value={f.attendees} onChange={(e) => setF({ ...f, attendees: e.target.value })} /></div>
            <div className="grid gap-2">
              <Label>Anlatılan modüller</Label>
              <div className="grid grid-cols-3 gap-2">{state.modules.map((m) => (
                <label key={m} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={f.modules.includes(m)} onCheckedChange={(c) => setF({ ...f, modules: c ? [...f.modules, m] : f.modules.filter((x) => x !== m) })} />{m}
                </label>
              ))}</div>
            </div>
            <div className="grid gap-2"><Label>Kayıt linki</Label><Input value={f.recordingUrl} onChange={(e) => setF({ ...f, recordingUrl: e.target.value })} /></div>
            <div className="grid gap-2"><Label>Notlar</Label><Textarea rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
            <label className="flex items-center gap-3 text-sm"><Switch checked={f.status === "done"} onCheckedChange={(c) => setF({ ...f, status: c ? "done" : "planned" })} />Session yapıldı</label>
          </div>
          <DialogFooter>
            <Button onClick={() => {
              addTraining({ ...f, projectId: project.id });
              toast.success("Session eklendi, katılımcı girişi adımı açıldı");
              setOpen(false);
              setF({ ...f, attendees: "", modules: [], recordingUrl: "", notes: "" });
            }}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Adaptation ─────────────────────────────────────────── */
export function AdaptationTab({ project }: { project: Project }) {
  const { state, saveAdaptation, updateStep } = useRq();
  const { user } = useAuth();
  const manage = canManageProject(user, project);
  const phase = state.phases.find((p) => p.projectId === project.id && p.code === "05");
  const teamSteps = (team: string) => state.steps.filter((s) => s.phaseId === phase?.id && s.title.startsWith(`${team} — `)).sort((a, b) => a.order - b.order);
  const doneTeams = project.teams.filter((t) => { const st = teamSteps(t); return st.length > 0 && st.every((s) => s.status === "done" || s.status === "out_of_scope"); }).length;

  if (project.teams.length === 0) {
    return <Card><EmptyState title="Takım yok" description="Keşif ve takımlar sekmesinden takım ekleyin; her takım için uyarlama kartı otomatik açılır." /></Card>;
  }
  return (
    <div className="space-y-4">
      <Card className="p-4 flex items-center gap-4">
        <span className="text-sm font-medium whitespace-nowrap">Aşama ilerlemesi: {doneTeams}/{project.teams.length} takım</span>
        <Progress value={(doneTeams / project.teams.length) * 100} className="h-2" />
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        {project.teams.map((team) => {
          const rec = state.adaptations.find((a) => a.projectId === project.id && a.team === team);
          const steps = teamSteps(team);
          return (
            <Card key={team}>
              <CardHeader className="pb-3"><CardTitle className="text-base">{team}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  {steps.map((s) => (
                    <label key={s.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="flex items-center gap-2">
                        <Checkbox checked={s.status === "done"} disabled={!manage || s.status === "locked"}
                          onCheckedChange={(c) => updateStep(s.id, { status: c ? "done" : "pending" }, "Uyarlama kartından güncellendi")} />
                        {s.title.replace(`${team} — `, "")}
                      </span>
                      <StepStatusBadge status={s.status} />
                    </label>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 border-t pt-3">
                  <div className="grid gap-1"><Label className="text-xs">Session tarihi</Label>
                    <Input type="date" className="h-8" defaultValue={rec?.date ?? ""} disabled={!manage} onBlur={(e) => saveAdaptation(project.id, team, { date: e.target.value || null })} /></div>
                  <div className="grid gap-1"><Label className="text-xs">Katılımcılar</Label>
                    <Input className="h-8" defaultValue={rec?.participants ?? ""} disabled={!manage} onBlur={(e) => saveAdaptation(project.id, team, { participants: e.target.value })} /></div>
                </div>
                <div className="grid gap-1"><Label className="text-xs">Notlar</Label>
                  <Textarea rows={2} defaultValue={rec?.notes ?? ""} disabled={!manage} onBlur={(e) => saveAdaptation(project.id, team, { notes: e.target.value })} /></div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ── Access / credentials ───────────────────────────────── */
export function AccessTab({ project }: { project: Project }) {
  const { state, addCredential, logCredentialView } = useRq();
  const { user } = useAuth();
  const [shown, setShown] = useState<Record<string, boolean>>({});
  const [f, setF] = useState({ type: "VPN", provider: "", username: "", password: "", validUntil: "", note: "" });
  const installSteps = state.steps.filter((s) => s.projectId === project.id && state.phases.find((p) => p.id === s.phaseId)?.code === "03").sort((a, b) => a.order - b.order);

  const allowed = canSeeCredentials(user, project);
  const creds = state.credentials.filter((c) => c.projectId === project.id);
  const soon = (d: string | null) => { if (!d) return false; const lim = new Date(); lim.setDate(lim.getDate() + 7); return d <= lim.toISOString().slice(0, 10); };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="text-base">Kurulum özeti</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Kurulum tipi: <span className="font-medium">{project.installType ? INSTALL_LABEL[project.installType] : "Seçilmedi"}</span></p>
          <p>LLM: <span className="font-medium">{project.llmChoice ? LLM_LABEL[project.llmChoice] : "Seçilmedi"}</span></p>
          <div className="pt-2 space-y-1.5">
            {installSteps.map((s) => (
              <div key={s.id} className={`flex items-center justify-between gap-2 ${s.status === "out_of_scope" ? "opacity-60" : ""}`}>
                <span>{s.title}</span><StepStatusBadge status={s.status} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Erişim bilgileri</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {!allowed ? (
            <p className="text-sm text-muted-foreground">Erişim bilgilerini yalnızca projenin CSM'i ve DevOps görebilir.</p>
          ) : (
            <>
              {creds.length === 0 && <p className="text-sm text-muted-foreground">Kayıt yok.</p>}
              {creds.map((c) => (
                <div key={c.id} className="rounded-lg border p-3 space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{c.type} · {c.provider}</span>
                    {soon(c.validUntil) && <Pill tone="warning">Süresi doluyor</Pill>}
                  </div>
                  <p className="text-muted-foreground">Kullanıcı: <span className="text-foreground font-mono">{c.username}</span></p>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    Şifre: <span className="text-foreground font-mono">{shown[c.id] ? c.password : "••••••••"}</span>
                    <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => {
                      if (!shown[c.id]) logCredentialView(c.id);
                      setShown({ ...shown, [c.id]: !shown[c.id] });
                    }}>
                      {shown[c.id] ? <><EyeOff className="h-3.5 w-3.5 mr-1" />Gizle</> : <><Eye className="h-3.5 w-3.5 mr-1" />Göster</>}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Geçerlilik: {fmtDate(c.validUntil)}{c.note ? ` · ${c.note}` : ""}</p>
                </div>
              ))}
              <div className="grid grid-cols-2 gap-2 border-t pt-3">
                <Input placeholder="Tür (VPN, SSH…)" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} />
                <Input placeholder="Sağlayıcı" value={f.provider} onChange={(e) => setF({ ...f, provider: e.target.value })} />
                <Input placeholder="Kullanıcı adı" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} />
                <Input placeholder="Şifre" type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
                <Input type="date" value={f.validUntil} onChange={(e) => setF({ ...f, validUntil: e.target.value })} aria-label="Geçerlilik tarihi" />
                <Input placeholder="Not" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
                <Button className="col-span-2" onClick={() => {
                  if (!f.provider.trim() || !f.username.trim()) return toast.error("Sağlayıcı ve kullanıcı adı zorunlu");
                  addCredential({ ...f, projectId: project.id, validUntil: f.validUntil || null });
                  setF({ type: "VPN", provider: "", username: "", password: "", validUntil: "", note: "" });
                }}>Erişim bilgisi ekle</Button>
              </div>
              <p className="text-xs text-muted-foreground">Her görüntüleme müşteri geçmişine yazılır. Demo olduğu için bilgiler gerçek anlamda şifrelenmez.</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Documents ──────────────────────────────────────────── */
export function DocumentsTab({ project }: { project: Project }) {
  const { state, addDocument } = useRq();
  const { user } = useAuth();
  const manage = canManageProject(user, project);
  const docs = state.documents.filter((d) => d.projectId === project.id).sort((a, b) => b.addedAt.localeCompare(a.addedAt));
  const meetings = state.meetings.filter((m) => m.projectId === project.id);
  const steps = state.steps.filter((s) => s.projectId === project.id && s.status !== "out_of_scope");
  const [type, setType] = useState<DocType>("other");
  const [name, setName] = useState("");
  const [link, setLink] = useState("project");

  const linkText = (d: (typeof docs)[number]) => {
    if (d.linkType === "meeting") { const m = meetings.find((x) => x.id === d.linkId); return m ? `Toplantı: ${MEETING_TYPE_LABEL[m.type]} ${fmtDate(m.date)}` : "Toplantı"; }
    if (d.linkType === "step") return `Adım: ${state.steps.find((s) => s.id === d.linkId)?.title ?? "—"}`;
    return "Proje";
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {docs.length === 0 ? <EmptyState title="Doküman yok" description="Teklif, sözleşme ve diğer dokümanları ekleyin." /> : (
          <Table>
            <TableHeader><TableRow><TableHead>Doküman</TableHead><TableHead>Tür</TableHead><TableHead>Bağlı olduğu</TableHead><TableHead>Eklenme</TableHead></TableRow></TableHeader>
            <TableBody>{docs.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium"><span className="inline-flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" />{d.name}</span></TableCell>
                <TableCell>{DOC_TYPE_LABEL[d.type]}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{linkText(d)}</TableCell>
                <TableCell>{fmtDate(d.addedAt)}</TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        )}
        {manage && (
          <div className="grid gap-2 sm:grid-cols-[1fr_180px_220px_auto] items-end border-t pt-4">
            <div className="grid gap-1">
              <Label className="text-xs">Dosya</Label>
              <Input type="file" onChange={(e) => setName(e.target.files?.[0]?.name ?? "")} />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Tür</Label>
              <Select value={type} onValueChange={(v) => setType(v as DocType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(Object.keys(DOC_TYPE_LABEL) as DocType[]).map((k) => <SelectItem key={k} value={k}>{DOC_TYPE_LABEL[k]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Bağla</Label>
              <Select value={link} onValueChange={setLink}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="project">Proje</SelectItem>
                  {meetings.map((m) => <SelectItem key={m.id} value={`meeting:${m.id}`}>Toplantı: {MEETING_TYPE_LABEL[m.type]} {fmtDate(m.date)}</SelectItem>)}
                  {steps.map((s) => <SelectItem key={s.id} value={`step:${s.id}`}>Adım: {s.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => {
              if (!name) return toast.error("Dosya seçin");
              const [lt, lid] = link.split(":");
              addDocument({ projectId: project.id, type, name, linkType: lt as "project" | "meeting" | "step", linkId: lid ?? null });
              toast.success("Doküman eklendi");
              setName("");
            }}>Ekle</Button>
          </div>
        )}
        <p className="text-xs text-muted-foreground">Demo: dosyanın kendisi saklanmaz, yalnızca adı ve bilgileri kaydedilir.</p>
      </CardContent>
    </Card>
  );
}
