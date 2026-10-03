import { useState } from "react";
import { BellPlus, CheckCircle2, Plus, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/EmptyState";
import { Pill, PriorityBadge } from "@/components/rq/Badges";
import { useAuth } from "@/lib/auth-context";
import { personName, useAlertViews, useRq } from "@/lib/rabbitqa/store";
import { AlertActionDialog } from "@/components/rq/AlertActionDialog";
import type { AlertView } from "@/lib/rabbitqa/alerts";
import { canHandleAlert, canManageProject, canManageTickets } from "@/lib/rabbitqa/perm";
import {
  ALERT_LEVEL_LABEL, ALERT_STATE_LABEL, ALERT_TYPE_LABEL, COMMIT_STATUS_LABEL, PRIORITY_LABEL, RISK_KIND_LABEL, RISK_STATUS_LABEL,
  TICKET_STATUS_LABEL, fmtDate, fmtDateTime,
} from "@/lib/rabbitqa/labels";
import type {
  Alert, AlertSeverity, Priority, Project, RiskDecision, RiskKind, RiskStatus, SupportTicket, TicketStatus,
} from "@/lib/rabbitqa/types";

/* ── Uyarılar ───────────────────────────────────────────── */
export function AlertsTab({ project }: { project: Project }) {
  const { state, addAlert } = useRq();
  const { user } = useAuth();
  const all = useAlertViews();
  const manage = canManageProject(user, project);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [severity, setSeverity] = useState<AlertSeverity>("warning");
  const [fLevel, setFLevel] = useState("all");
  const [fType, setFType] = useState("all");
  const [fStatus, setFStatus] = useState("open");
  const [act, setAct] = useState<{ a: AlertView; mode: "snooze" | "close" } | null>(null);
  const alerts = all
    .filter((a) => a.projectId === project.id)
    .filter((a) => (fLevel === "all" || a.level === fLevel) && (fType === "all" || a.type === fType) && (fStatus === "all" || a.status === fStatus))
    .sort((a, b) => (a.level === b.level ? a.title.localeCompare(b.title, "tr") : a.level === "red" ? -1 : 1));

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base">Uyarılar</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={fLevel} onValueChange={setFLevel}>
            <SelectTrigger className="w-32" aria-label="Seviye"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">Tüm seviyeler</SelectItem>{Object.entries(ALERT_LEVEL_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={fType} onValueChange={setFType}>
            <SelectTrigger className="w-52" aria-label="Tip"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">Tüm tipler</SelectItem>{Object.entries(ALERT_TYPE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={fStatus} onValueChange={setFStatus}>
            <SelectTrigger className="w-36" aria-label="Durum"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">Tüm durumlar</SelectItem>{Object.entries(ALERT_STATE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
          </Select>
          {manage && <Button size="sm" onClick={() => setOpen(true)}><BellPlus className="h-4 w-4 mr-1" />Uyarı ekle</Button>}
        </div>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? <EmptyState title="Uyarı yok" description="Bu filtreye uyan uyarı bulunmuyor." /> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Başlık</TableHead><TableHead>Seviye</TableHead><TableHead>Tip</TableHead><TableHead>Sorumlu</TableHead><TableHead>Durum</TableHead><TableHead className="w-44" />
            </TableRow></TableHeader>
            <TableBody>
              {alerts.map((a) => {
                const can = canHandleAlert(user, project, a);
                return (
                  <TableRow key={a.key} className={a.status !== "open" ? "opacity-60" : ""}>
                    <TableCell>
                      <p className="font-medium">{a.title}</p>
                      {a.detail && <p className="text-xs text-muted-foreground">{a.detail}</p>}
                      {a.createdAt && <p className="text-xs text-muted-foreground">{fmtDateTime(a.createdAt)}</p>}
                    </TableCell>
                    <TableCell><Pill tone={a.level === "red" ? "danger" : "warning"}>{ALERT_LEVEL_LABEL[a.level]}</Pill></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{ALERT_TYPE_LABEL[a.type]}</TableCell>
                    <TableCell className="text-sm">{personName(state, a.ownerId)}</TableCell>
                    <TableCell>
                      {a.status === "open" ? <Pill tone="warning">Açık</Pill> : (
                        <span className="text-xs text-muted-foreground">
                          {ALERT_STATE_LABEL[a.status]}{a.status === "snoozed" && a.state?.snoozedUntil ? ` · ${fmtDate(a.state.snoozedUntil)}'e kadar` : ""}
                          {a.state && <> · {personName(state, a.state.by)}<br />“{a.state.reason}”</>}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {a.status !== "closed" && can && (
                        <div className="flex gap-1 justify-end">
                          {a.status === "open" && <Button size="sm" variant="outline" onClick={() => setAct({ a, mode: "snooze" })}>Ertele</Button>}
                          <Button size="sm" variant="outline" onClick={() => setAct({ a, mode: "close" })}>Kapat</Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
      {act && <AlertActionDialog alert={act.a} mode={act.mode} onClose={() => setAct(null)} />}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Yeni uyarı</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-2"><Label>Başlık</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div className="grid gap-2"><Label>Detay</Label><Textarea value={detail} onChange={(e) => setDetail(e.target.value)} /></div>
            <div className="grid gap-2"><Label>Seviye</Label>
              <Select value={severity} onValueChange={(v) => setSeverity(v as AlertSeverity)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="warning">Sarı</SelectItem><SelectItem value="critical">Kırmızı</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Vazgeç</Button>
            <Button onClick={() => {
              if (!title.trim()) return toast.error("Başlık zorunlu");
              addAlert({ projectId: project.id, title: title.trim(), detail: detail.trim(), severity });
              setOpen(false); setTitle(""); setDetail("");
              toast.success("Uyarı eklendi");
            }}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/* ── Destek kayıtları ───────────────────────────────────── */
export function TicketsTab({ project }: { project: Project }) {
  const { state, addTicket } = useRq();
  const { user } = useAuth();
  const manage = canManageTickets(user, project);
  const [edit, setEdit] = useState<SupportTicket | null>(null);
  const [creating, setCreating] = useState(false);
  const tickets = state.tickets.filter((t) => t.projectId === project.id).sort((a, b) => b.openedAt.localeCompare(a.openedAt));

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Destek kayıtları</CardTitle>
        {manage && <Button size="sm" onClick={() => setCreating(true)}><Plus className="h-4 w-4 mr-1" />Kayıt aç</Button>}
      </CardHeader>
      <CardContent>
        {tickets.length === 0 ? <EmptyState title="Destek kaydı yok" description="Müşteriden gelen sorunları buradan takip edin." /> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Konu</TableHead><TableHead>Modül</TableHead><TableHead>Öncelik</TableHead><TableHead>Sahip</TableHead>
              <TableHead>Açılış</TableHead><TableHead>Durum</TableHead><TableHead className="w-10" />
            </TableRow></TableHeader>
            <TableBody>
              {tickets.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <p className="font-medium">{t.title}</p>
                    {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
                  </TableCell>
                  <TableCell>{t.module || "—"}</TableCell>
                  <TableCell><PriorityBadge p={t.priority} /></TableCell>
                  <TableCell>{personName(state, t.ownerId)}</TableCell>
                  <TableCell>{fmtDate(t.openedAt)}</TableCell>
                  <TableCell>
                    <Pill tone={t.status === "resolved" || t.status === "closed" ? "success" : t.status === "waiting_customer" ? "warning" : "info"}>
                      {TICKET_STATUS_LABEL[t.status]}
                    </Pill>
                  </TableCell>
                  <TableCell>{manage && <Button size="sm" variant="ghost" onClick={() => setEdit(t)}>Düzenle</Button>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      {(edit || creating) && <TicketDialog project={project} ticket={edit} onClose={() => { setEdit(null); setCreating(false); }} onCreate={(d) => addTicket({ ...d, projectId: project.id })} />}
    </Card>
  );
}

type TicketDraft = { title: string; description: string; module: string; priority: Priority; status: TicketStatus; ownerId: string | null };

function TicketDialog({ project, ticket, onClose, onCreate }: { project: Project; ticket: SupportTicket | null; onClose: () => void; onCreate: (d: TicketDraft) => void }) {
  const { state, updateTicket } = useRq();
  const [d, setD] = useState<TicketDraft>(ticket ?? { title: "", description: "", module: "", priority: "medium", status: "open", ownerId: state.users.find((u) => u.role === "care")?.id ?? null /* varsayılan sorumlu, yetki değil */ });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{ticket ? "Kaydı düzenle" : "Yeni destek kaydı"}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-2"><Label>Konu</Label><Input value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} /></div>
          <div className="grid gap-2"><Label>Açıklama</Label><Textarea value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2"><Label>Modül</Label>
              <Select value={d.module || "__none"} onValueChange={(v) => setD({ ...d, module: v === "__none" ? "" : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Belirtilmedi</SelectItem>
                  {state.modules.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2"><Label>Öncelik</Label>
              <Select value={d.priority} onValueChange={(v) => setD({ ...d, priority: v as Priority })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(Object.keys(PRIORITY_LABEL) as Priority[]).map((k) => <SelectItem key={k} value={k}>{PRIORITY_LABEL[k]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2"><Label>Sahip</Label>
              <Select value={d.ownerId ?? "__none"} onValueChange={(v) => setD({ ...d, ownerId: v === "__none" ? null : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Atanmadı</SelectItem>
                  {state.users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {ticket && (
              <div className="grid gap-2"><Label>Durum</Label>
                <Select value={d.status} onValueChange={(v) => setD({ ...d, status: v as TicketStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{(Object.keys(TICKET_STATUS_LABEL) as TicketStatus[]).map((k) => <SelectItem key={k} value={k}>{TICKET_STATUS_LABEL[k]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
          </div>
          {ticket?.resolvedAt && <p className="text-xs text-muted-foreground">Çözüm: {fmtDateTime(ticket.resolvedAt)}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Vazgeç</Button>
          <Button onClick={() => {
            if (!d.title.trim()) return toast.error("Konu zorunlu");
            if (ticket) updateTicket(ticket.id, d); else onCreate(d);
            toast.success("Kaydedildi");
            onClose();
          }}>Kaydet</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Riskler ve kararlar ────────────────────────────────── */
export function RisksTab({ project }: { project: Project }) {
  const { state, addRisk } = useRq();
  const { user } = useAuth();
  const manage = canManageProject(user, project);
  const [edit, setEdit] = useState<RiskDecision | null>(null);
  const [creating, setCreating] = useState(false);
  const risks = state.risks.filter((r) => r.projectId === project.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Riskler ve kararlar</CardTitle>
        {manage && <Button size="sm" onClick={() => setCreating(true)}><ShieldAlert className="h-4 w-4 mr-1" />Kayıt ekle</Button>}
      </CardHeader>
      <CardContent>
        {risks.length === 0 ? <EmptyState title="Kayıt yok" description="Proje risklerini ve alınan kararları burada izleyin." /> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Tür</TableHead><TableHead>Başlık</TableHead><TableHead>Etki</TableHead><TableHead>Sahip</TableHead>
              <TableHead>Termin</TableHead><TableHead>Durum</TableHead><TableHead className="w-10" />
            </TableRow></TableHeader>
            <TableBody>
              {risks.map((r) => (
                <TableRow key={r.id}>
                  <TableCell><Pill tone={r.kind === "risk" ? "warning" : "info"}>{RISK_KIND_LABEL[r.kind]}</Pill></TableCell>
                  <TableCell>
                    <p className="font-medium">{r.title}</p>
                    {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
                  </TableCell>
                  <TableCell><PriorityBadge p={r.impact} /></TableCell>
                  <TableCell>{personName(state, r.ownerId)}</TableCell>
                  <TableCell>{fmtDate(r.due)}</TableCell>
                  <TableCell><Pill tone={r.status === "open" ? "warning" : r.status === "realized" ? "danger" : "success"}>{RISK_STATUS_LABEL[r.status]}</Pill></TableCell>
                  <TableCell>{manage && <Button size="sm" variant="ghost" onClick={() => setEdit(r)}>Düzenle</Button>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      {(edit || creating) && <RiskDialog project={project} risk={edit} onClose={() => { setEdit(null); setCreating(false); }} onCreate={(d) => addRisk({ ...d, projectId: project.id })} />}
    </Card>
  );
}

type RiskDraft = { kind: RiskKind; title: string; description: string; impact: Priority; status: RiskStatus; ownerId: string | null; due: string | null };

function RiskDialog({ project, risk, onClose, onCreate }: { project: Project; risk: RiskDecision | null; onClose: () => void; onCreate: (d: RiskDraft) => void }) {
  const { state, updateRisk } = useRq();
  const [d, setD] = useState<RiskDraft>(risk ?? { kind: "risk", title: "", description: "", impact: "medium", status: "open", ownerId: project.csmId, due: null });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{risk ? "Kaydı düzenle" : "Yeni risk / karar"}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2"><Label>Tür</Label>
              <Select value={d.kind} onValueChange={(v) => setD({ ...d, kind: v as RiskKind })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(Object.keys(RISK_KIND_LABEL) as RiskKind[]).map((k) => <SelectItem key={k} value={k}>{RISK_KIND_LABEL[k]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2"><Label>Etki</Label>
              <Select value={d.impact} onValueChange={(v) => setD({ ...d, impact: v as Priority })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(Object.keys(PRIORITY_LABEL) as Priority[]).map((k) => <SelectItem key={k} value={k}>{PRIORITY_LABEL[k]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2"><Label>Başlık</Label><Input value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} /></div>
          <div className="grid gap-2"><Label>Açıklama</Label><Textarea value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-2"><Label>Sahip</Label>
              <Select value={d.ownerId ?? "__none"} onValueChange={(v) => setD({ ...d, ownerId: v === "__none" ? null : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Atanmadı</SelectItem>
                  {state.users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2"><Label>Termin</Label><Input type="date" value={d.due ?? ""} onChange={(e) => setD({ ...d, due: e.target.value || null })} /></div>
            <div className="grid gap-2"><Label>Durum</Label>
              <Select value={d.status} onValueChange={(v) => setD({ ...d, status: v as RiskStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(Object.keys(RISK_STATUS_LABEL) as RiskStatus[]).map((k) => <SelectItem key={k} value={k}>{RISK_STATUS_LABEL[k]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Vazgeç</Button>
          <Button onClick={() => {
            if (!d.title.trim()) return toast.error("Başlık zorunlu");
            if (risk) updateRisk(risk.id, d); else onCreate(d);
            toast.success("Kaydedildi");
            onClose();
          }}>Kaydet</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Go-Live ────────────────────────────────────────────── */
export function GoLiveTab({ project }: { project: Project }) {
  const { state, approveGoLive, addMeeting } = useRq();
  const { user } = useAuth();
  const manage = canManageProject(user, project);
  const [reason, setReason] = useState("");
  const steps = state.steps.filter((s) => s.projectId === project.id && ["gonogo", "commit_check", "customer_approval"].includes(s.key ?? ""));
  const commits = state.commitments.filter((c) => c.projectId === project.id);
  const phase = state.phases.find((p) => p.projectId === project.id && p.code === "07");
  const stepOf = (key: string) => steps.find((s) => s.key === key);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Go-Live kontrol listesi</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {(["gonogo", "commit_check", "customer_approval"] as const).map((key) => {
            const s = stepOf(key);
            if (!s) return null;
            const done = s.status === "done";
            return (
              <div key={key} className="flex items-center gap-3 rounded-md border p-3">
                <CheckCircle2 className={`h-5 w-5 ${done ? "text-primary" : "text-muted-foreground/40"}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{s.title}</p>
                  <p className="text-xs text-muted-foreground">Sorumlu: {personName(state, s.ownerId)}</p>
                </div>
                <Pill tone={done ? "success" : "muted"}>{done ? "Tamamlandı" : "Bekliyor"}</Pill>
                {key === "gonogo" && !done && manage && (
                  <Button size="sm" variant="outline" onClick={() => {
                    addMeeting({ projectId: project.id, type: "go_no_go", date: new Date().toISOString().slice(0, 10), internalIds: project.csmId ? [project.csmId] : [], contactIds: [], notes: "Go/No-Go toplantısı (hızlı kayıt)", decisions: "" }, []);
                    toast.success("Go/No-Go toplantısı kaydedildi — detayları Toplantılar sekmesinden düzenleyebilirsiniz");
                  }}>Toplantıyı kaydet</Button>
                )}
              </div>
            );
          })}
          {phase?.status === "done" && (
            <p className="text-sm text-muted-foreground">Go-Live tamamlandı · Onaylayan: {personName(state, phase.approvedBy)} · {fmtDate(phase.actualEnd)}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Taahhüt durumu</CardTitle></CardHeader>
        <CardContent>
          {commits.length === 0 ? <p className="text-sm text-muted-foreground">Taahhüt yok.</p> : (
            <ul className="space-y-2">
              {commits.map((c) => (
                <li key={c.id} className="flex items-center gap-3 text-sm">
                  <Pill tone={c.status === "met" ? "success" : c.status === "unmet" ? "danger" : "warning"}>{COMMIT_STATUS_LABEL[c.status]}</Pill>
                  <span>{c.text}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-muted-foreground mt-3">Taahhütleri "Satış devri" sekmesinden güncelleyebilirsiniz. Açık taahhüt kalmadığında kontrol adımı otomatik tamamlanır.</p>
        </CardContent>
      </Card>

      {manage && phase?.status !== "done" && (
        <Card>
          <CardHeader><CardTitle className="text-base">Müşteri onayı</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2">
              <Label>Onay notu / gerekçe (zorunlu)</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Örn. Müşteri 02.10.2026 tarihli toplantıda canlıya geçişi onayladı." />
            </div>
            <Button onClick={() => {
              if (!reason.trim()) return toast.error("Onay notu zorunlu");
              const err = approveGoLive(project.id, reason.trim());
              err ? toast.error(`Go-Live tamamlanamaz: ${err}`) : toast.success("Müşteri onayı alındı — Go-Live tamamlandı");
            }}>Müşteri onayını kaydet ve Go-Live'ı tamamla</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
