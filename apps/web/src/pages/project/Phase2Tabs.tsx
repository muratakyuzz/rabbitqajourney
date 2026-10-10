import { useState } from "react";
import { Eye, EyeOff, FileText, Plus } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/EmptyState";
import { Pill } from "@/components/rq/Badges";
import { useAuth } from "@/lib/auth-context";
import { useRq } from "@/lib/rabbitqa/store";
import { canManageProject, canSeeCredentials } from "@/lib/rabbitqa/perm";
import { KpiChart } from "@/components/rq/KpiChart";
import { VisibleIcon } from "@/components/rq/VisibleIcon";
import { DOC_TYPE_LABEL, INSTALL_LABEL, LLM_LABEL, MEETING_TYPE_LABEL, fmtDate, todayISO } from "@rabbitqa/shared/domain/labels";
import type { DocType, Project } from "@rabbitqa/shared/domain/types";

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

/* ── Access / credentials ───────────────────────────────── */
/** "Kurulum özeti" (salt gösterim, S6) + "Erişim bilgileri" kartları. Sekmede ve 03 çalışma alanı panelinde kullanılır. */
export function CredentialsSection({ project, layout }: { project: Project; layout: "tab" | "panel" }) {
  const { state, addCredential, logCredentialView } = useRq();
  const { user } = useAuth();
  const [shown, setShown] = useState<Record<string, boolean>>({});
  const [f, setF] = useState({ type: "VPN", provider: "", username: "", password: "", validUntil: "", note: "" });

  const allowed = canSeeCredentials(user, project);
  const creds = state.credentials.filter((c) => c.projectId === project.id);
  const soon = (d: string | null) => { if (!d) return false; const lim = new Date(); lim.setDate(lim.getDate() + 7); return d <= lim.toISOString().slice(0, 10); };

  return (
    <div className={layout === "panel" ? "space-y-4" : "grid gap-4 lg:grid-cols-2"}>
      <Card>
        <CardHeader><CardTitle className="text-base">Kurulum özeti</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Kurulum tipi: <span className="font-medium">{project.installType ? INSTALL_LABEL[project.installType] : "Seçilmedi"}</span></p>
          <p>LLM: <span className="font-medium">{project.llmChoice ? LLM_LABEL[project.llmChoice] : "Seçilmedi"}</span></p>
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
              <div data-field="credential:vpn" className="grid grid-cols-2 gap-2 border-t pt-3">
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
export function DocumentUploadDialog({ project, lockedType, defaultLink, onClose, onSaved }: {
  project: Project; lockedType?: DocType; defaultLink?: { linkType: "project" | "meeting" | "step"; linkId: string | null }; onClose: () => void; onSaved?: () => void;
}) {
  const { state, addDocument } = useRq();
  const meetings = state.meetings.filter((m) => m.projectId === project.id);
  const steps = state.steps.filter((s) => s.projectId === project.id && s.status !== "out_of_scope");
  const [type, setType] = useState<DocType>(lockedType ?? "other");
  const [name, setName] = useState("");
  const [link, setLink] = useState(defaultLink ? `${defaultLink.linkType}${defaultLink.linkId ? `:${defaultLink.linkId}` : ""}` : "project");

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Doküman ekle</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1">
            <Label className="text-xs" htmlFor="doc-upload-file">Dosya</Label>
            <Input id="doc-upload-file" type="file" onChange={(e) => setName(e.target.files?.[0]?.name ?? "")} />
          </div>
          <div className="grid gap-1">
            <Label className="text-xs" htmlFor="doc-upload-type">Tür</Label>
            <Select value={type} onValueChange={(v) => setType(v as DocType)} disabled={!!lockedType}>
              <SelectTrigger id="doc-upload-type"><SelectValue /></SelectTrigger>
              <SelectContent>{(Object.keys(DOC_TYPE_LABEL) as DocType[]).map((k) => <SelectItem key={k} value={k}>{DOC_TYPE_LABEL[k]}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
            <Label className="text-xs" htmlFor="doc-upload-link">Bağla</Label>
            <Select value={link} onValueChange={setLink}>
              <SelectTrigger id="doc-upload-link"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="project">Proje</SelectItem>
                {meetings.map((m) => <SelectItem key={m.id} value={`meeting:${m.id}`}>Toplantı: {MEETING_TYPE_LABEL[m.type]} {fmtDate(m.date)}</SelectItem>)}
                {steps.map((s) => <SelectItem key={s.id} value={`step:${s.id}`}>Adım: {s.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">Demo: dosyanın kendisi saklanmaz, yalnızca adı ve bilgileri kaydedilir.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Vazgeç</Button>
          <Button onClick={() => {
            if (!name) return toast.error("Dosya seçin");
            const [lt, lid] = link.split(":");
            addDocument({ projectId: project.id, type, name, linkType: lt as "project" | "meeting" | "step", linkId: lid ?? null });
            toast.success("Doküman eklendi");
            onSaved?.();
            onClose();
          }}>Kaydet</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DocumentsTab({ project }: { project: Project }) {
  const { state } = useRq();
  const { user } = useAuth();
  const manage = canManageProject(user, project);
  const [open, setOpen] = useState(false);
  const docs = state.documents.filter((d) => d.projectId === project.id).sort((a, b) => b.addedAt.localeCompare(a.addedAt));
  const meetings = state.meetings.filter((m) => m.projectId === project.id);

  const linkText = (d: (typeof docs)[number]) => {
    if (d.linkType === "meeting") { const m = meetings.find((x) => x.id === d.linkId); return m ? `Toplantı: ${MEETING_TYPE_LABEL[m.type]} ${fmtDate(m.date)}` : "Toplantı"; }
    if (d.linkType === "step") return `Adım: ${state.steps.find((s) => s.id === d.linkId)?.title ?? "—"}`;
    return "Proje";
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Dokümanlar</CardTitle>
        {manage && <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" />Doküman ekle</Button>}
      </CardHeader>
      <CardContent className="space-y-4">
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
      </CardContent>
      {open && <DocumentUploadDialog project={project} onClose={() => setOpen(false)} />}
    </Card>
  );
}
