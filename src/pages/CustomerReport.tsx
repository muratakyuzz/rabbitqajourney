import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, FilePlus2, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/EmptyState";
import { HealthBadge, PhaseStatusBadge, Pill } from "@/components/rq/Badges";
import { useAuth } from "@/lib/auth-context";
import { canEditReport, canMarkReportSent } from "@/lib/rabbitqa/perm";
import { personName, useRq } from "@/lib/rabbitqa/store";
import { weekStartOf } from "@/lib/rabbitqa/alerts";
import { PRIORITY_LABEL, REPORT_STATUS_LABEL, fmtDate, fmtDateTime, todayISO } from "@/lib/rabbitqa/labels";
import type { ReportSnapshot } from "@/lib/rabbitqa/reports";
import type { CustomerReport as Rep, PhaseStatus, Priority } from "@/lib/rabbitqa/types";

export default function CustomerReport() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();
  const { state, createCustomerReport, updateCustomerReport, markReportSent } = useRq();
  const [week, setWeek] = useState(todayISO());
  const project = state.projects.find((p) => p.id === id);
  if (!project) return <Card><EmptyState title="Proje bulunamadı" description="Rapor oluşturulamadı." /></Card>;

  const reports = state.customerReports.filter((r) => r.projectId === project.id).sort((a, b) => b.weekStart.localeCompare(a.weekStart));
  const current = reports.find((r) => r.id === params.get("r")) ?? reports.find((r) => r.weekStart === weekStartOf(todayISO())) ?? null;
  const canEdit = canEditReport(user, project);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Link to={`/app/projects/${project.id}`} className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Projeye dön
        </Link>
        <div className="flex flex-wrap items-end gap-2">
          {canEdit && (
            <>
              <div className="grid gap-1"><Label className="text-xs">Hafta</Label><Input type="date" className="h-9 w-40" value={week} onChange={(e) => setWeek(e.target.value)} /></div>
              <Button variant="outline" onClick={() => {
                const rid = createCustomerReport(project.id, week || todayISO());
                if (rid) { setParams({ r: rid }); toast.success("Rapor taslağı hazır"); }
              }}><FilePlus2 className="h-4 w-4 mr-2" />Rapor oluştur</Button>
            </>
          )}
          {current && <Button onClick={() => window.print()}><Printer className="h-4 w-4 mr-2" />Yazdır / PDF</Button>}
        </div>
      </div>

      <Card className="print:hidden">
        <CardHeader><CardTitle className="text-base">Rapor arşivi</CardTitle></CardHeader>
        <CardContent>
          {reports.length === 0 ? <EmptyState title="Rapor yok" description="Bu proje için henüz haftalık rapor oluşturulmadı." /> : (
            <Table>
              <TableHeader><TableRow><TableHead>Hafta</TableHead><TableHead>Oluşturan</TableHead><TableHead>Durum</TableHead><TableHead>Gönderilme</TableHead><TableHead className="w-20" /></TableRow></TableHeader>
              <TableBody>{reports.map((r) => (
                <TableRow key={r.id} className={current?.id === r.id ? "bg-muted/50" : ""}>
                  <TableCell>{fmtDate(r.weekStart)} haftası</TableCell>
                  <TableCell>{personName(state, r.createdBy)}</TableCell>
                  <TableCell><Pill tone={r.status === "sent" ? "success" : "warning"}>{REPORT_STATUS_LABEL[r.status]}</Pill></TableCell>
                  <TableCell>{r.sentAt ? `${fmtDateTime(r.sentAt)} · ${personName(state, r.sentBy)}` : "—"}</TableCell>
                  <TableCell><Button size="sm" variant="ghost" onClick={() => setParams({ r: r.id })}>Aç</Button></TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {current ? (
        <ReportView key={current.id} rep={current} canEdit={canEdit && current.status === "draft"} canSend={canMarkReportSent(user, project) && current.status === "draft"}
          onSave={(p) => { const e = updateCustomerReport(current.id, p); e ? toast.error(e) : toast.success("Rapor kaydedildi"); }}
          onSend={() => { const e = markReportSent(current.id); e ? toast.error(e) : toast.success("Rapor gönderildi olarak işaretlendi"); }} />
      ) : (
        <Card><EmptyState title="Bu haftanın raporu oluşturulmadı" description={canEdit ? "Hafta seçip \"Rapor oluştur\" ile taslak hazırlayın." : "Arşivden bir rapor açın."} /></Card>
      )}
    </div>
  );
}

function ReportView({ rep, canEdit, canSend, onSave, onSend }: { rep: Rep; canEdit: boolean; canSend: boolean; onSave: (p: { summary: string; nextWeek: string }) => void; onSend: () => void }) {
  const s = rep.snapshot as unknown as ReportSnapshot;
  const [summary, setSummary] = useState(rep.summary);
  const [nextWeek, setNextWeek] = useState(rep.nextWeek);
  useEffect(() => { setSummary(rep.summary); setNextWeek(rep.nextWeek); }, [rep.summary, rep.nextWeek]);
  const dirty = summary !== rep.summary || nextWeek !== rep.nextWeek;
  if (!s?.phases) return <Card><EmptyState title="Rapor içeriği yok" description="Bu rapor için dondurulmuş veri bulunamadı." /></Card>;

  return (
    <div className="space-y-3">
      {(canEdit || canSend) && (
        <div className="flex flex-wrap justify-end gap-2 print:hidden">
          {canEdit && <Button variant="outline" disabled={!dirty} onClick={() => onSave({ summary, nextWeek })}>Değişiklikleri kaydet</Button>}
          {canSend && <Button onClick={() => { if (dirty) onSave({ summary, nextWeek }); onSend(); }}><CheckCircle2 className="h-4 w-4 mr-2" />Gönderildi olarak işaretle</Button>}
        </div>
      )}
      {rep.status === "sent" && <p className="text-xs text-muted-foreground print:hidden">Bu rapor gönderildi; düzenlenemez.</p>}

      <div className="bg-card text-card-foreground rounded-xl border p-8 space-y-6 print:border-0 print:p-0">
        <header className="flex items-start justify-between border-b pb-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Haftalık müşteri durum raporu</p>
            <h1 className="text-2xl font-bold">{s.customerName}</h1>
            <p className="text-sm text-muted-foreground">{s.projectName} · {fmtDate(s.weekStart)} – {fmtDate(s.weekEnd)}</p>
          </div>
          <img src="/brand/vector.png" alt="RabbitQA" className="h-12 w-12 object-contain" />
        </header>

        <section className="grid grid-cols-3 gap-4 text-sm">
          <div><p className="text-muted-foreground text-xs">Proje sağlığı</p><HealthBadge health={s.health} /></div>
          <div><p className="text-muted-foreground text-xs">Hedef Go-Live</p><p className="font-medium">{fmtDate(s.goLiveDate)}</p></div>
          <div><p className="text-muted-foreground text-xs">CSM</p><p className="font-medium">{s.csmName}</p></div>
        </section>

        <Section title="Özet">
          {canEdit ? <Textarea className="print:hidden" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Bu haftanın kısa özeti" /> : null}
          <p className={`text-sm whitespace-pre-line ${canEdit ? "hidden print:block" : ""}`}>{summary || "—"}</p>
        </Section>

        <Section title="Aşama ilerlemesi">
          <Table>
            <TableHeader><TableRow><TableHead>Aşama</TableHead><TableHead>Plan</TableHead><TableHead>Gerçekleşen</TableHead><TableHead>Durum</TableHead></TableRow></TableHeader>
            <TableBody>{s.phases.map((p) => (
              <TableRow key={p.code}>
                <TableCell>{p.code} — {p.name}</TableCell>
                <TableCell>{fmtDate(p.planStart)} – {fmtDate(p.planEnd)}</TableCell>
                <TableCell>{fmtDate(p.actualStart)} – {fmtDate(p.actualEnd)}</TableCell>
                <TableCell><PhaseStatusBadge status={p.status as PhaseStatus} /></TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </Section>

        <Section title="Bu hafta tamamlananlar">
          {s.completed.length ? <ul className="list-disc pl-5 text-sm space-y-1">{s.completed.map((c, i) => <li key={i}>{c.title} <span className="text-muted-foreground">({fmtDate(c.date)})</span></li>)}</ul> : <Muted>Bu hafta tamamlanan iş yok.</Muted>}
        </Section>

        <div className="grid gap-6 md:grid-cols-2">
          <Section title="Açık aksiyonlar — Virgosol">
            <ItemList items={s.actionsVirgosol.map((a) => ({ t: a.title, sub: `${a.owner} · ${fmtDate(a.due)}` }))} empty="Açık aksiyon yok." />
          </Section>
          <Section title="Açık aksiyonlar — Müşteri">
            <ItemList items={s.actionsCustomer.map((a) => ({ t: a.title, sub: `${a.owner} · ${fmtDate(a.due)}` }))} empty="Açık aksiyon yok." />
          </Section>
        </div>

        <Section title="Sizden beklenenler">
          <ItemList items={s.expected.map((e) => ({ t: e.title, sub: `${e.waitingDays} iş günüdür bekliyor${e.due ? ` · termin ${fmtDate(e.due)}` : ""}` }))} empty="Sizden beklenen bir adım yok." />
        </Section>

        <div className="grid gap-6 md:grid-cols-2">
          <Section title="Açık riskler">
            <ItemList items={s.risks.map((r) => ({ t: r.title, sub: `Etki: ${PRIORITY_LABEL[r.impact as Priority] ?? r.impact}${r.mitigation ? ` · ${r.mitigation}` : ""}` }))} empty="Açık risk yok." />
          </Section>
          <Section title="Bu haftanın kararları">
            <ItemList items={s.decisions.map((d) => ({ t: d.title, sub: fmtDate(d.date) }))} empty="Bu hafta karar alınmadı." />
          </Section>
        </div>

        <Section title="KPI'lar">
          {s.kpis.length ? (
            <Table>
              <TableHeader><TableRow><TableHead>KPI</TableHead><TableHead>Hedef</TableHead><TableHead>Mevcut</TableHead></TableRow></TableHeader>
              <TableBody>{s.kpis.map((k, i) => <TableRow key={i}><TableCell>{k.name}</TableCell><TableCell>{k.target ?? "—"} {k.unit}</TableCell><TableCell>{k.current ?? "—"} {k.unit}</TableCell></TableRow>)}</TableBody>
            </Table>
          ) : <Muted>KPI tanımlanmadı.</Muted>}
        </Section>

        <Section title="Gelecek hafta yapılacaklar">
          {canEdit ? <Textarea className="print:hidden" rows={4} value={nextWeek} onChange={(e) => setNextWeek(e.target.value)} /> : null}
          <p className={`text-sm whitespace-pre-line ${canEdit ? "hidden print:block" : ""}`}>{nextWeek || "—"}</p>
        </Section>

        <footer className="border-t pt-3 text-xs text-muted-foreground">CSM: {s.csmName} · Rapor haftası {fmtDate(s.weekStart)} · Virgosol RabbitQA</footer>
      </div>
    </div>
  );
}

function ItemList({ items, empty }: { items: { t: string; sub: string }[]; empty: string }) {
  if (!items.length) return <Muted>{empty}</Muted>;
  return <ul className="text-sm space-y-1.5">{items.map((x, i) => <li key={i}><span className="font-medium">{x.t}</span><span className="block text-xs text-muted-foreground">{x.sub}</span></li>)}</ul>;
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="space-y-2 break-inside-avoid"><h2 className="font-semibold">{title}</h2>{children}</section>;
}
const Muted = ({ children }: { children: React.ReactNode }) => <p className="text-sm text-muted-foreground">{children}</p>;
