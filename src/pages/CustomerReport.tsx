import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/EmptyState";
import { HealthBadge, PhaseStatusBadge, PriorityBadge, isOverdue } from "@/components/rq/Badges";
import { activePhase, personName, projectProgress, useRq } from "@/lib/rabbitqa/store";
import { BALL_LABEL, fmtDate, todayISO } from "@/lib/rabbitqa/labels";

const addDays = (iso: string, n: number) => {
  const d = new Date(iso); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10);
};

export default function CustomerReport() {
  const { id } = useParams();
  const { state } = useRq();
  const project = state.projects.find((p) => p.id === id);
  if (!project) return <Card><EmptyState title="Proje bulunamadı" description="Rapor oluşturulamadı." /></Card>;

  const today = todayISO();
  const weekAgo = addDays(today, -7);
  const nextWeek = addDays(today, 7);
  const phases = state.phases.filter((p) => p.projectId === project.id).sort((a, b) => a.order - b.order);
  const steps = state.steps.filter((s) => s.projectId === project.id);
  const doneThisWeek = state.audit.filter((a) => a.projectId === project.id && a.entity === "step" && a.field === "status" && a.newValue === "done" && a.at.slice(0, 10) >= weekAgo);
  const upcoming = steps.filter((s) => s.status !== "done" && s.status !== "out_of_scope" && s.due && s.due <= nextWeek).sort((a, b) => (a.due ?? "").localeCompare(b.due ?? ""));
  const actions = state.actions.filter((a) => a.projectId === project.id && (a.status === "open" || a.status === "in_progress"));
  const risks = state.risks.filter((r) => r.projectId === project.id && r.kind === "risk" && r.status === "open");
  const commits = state.commitments.filter((c) => c.projectId === project.id && c.status === "open");
  const progress = projectProgress(state, project.id);
  const ph = activePhase(state, project.id);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between print:hidden">
        <Link to={`/app/projects/${project.id}`} className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Projeye dön
        </Link>
        <Button onClick={() => window.print()}><Printer className="h-4 w-4 mr-2" />Yazdır / PDF kaydet</Button>
      </div>

      <div className="bg-card text-card-foreground rounded-xl border p-8 space-y-6 print:border-0 print:p-0">
        <header className="flex items-start justify-between border-b pb-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Haftalık müşteri durum raporu</p>
            <h1 className="text-2xl font-bold">{project.customerName}</h1>
            <p className="text-sm text-muted-foreground">{project.name} · {fmtDate(weekAgo)} – {fmtDate(today)}</p>
          </div>
          <img src="/brand/logo-48.png" alt="RabbitQA" className="h-10 w-10" />
        </header>

        <section className="grid grid-cols-4 gap-4 text-sm">
          <div><p className="text-muted-foreground text-xs">Sağlık</p><HealthBadge health={project.health} /></div>
          <div><p className="text-muted-foreground text-xs">Aktif aşama</p><p className="font-medium">{ph ? `${ph.code} — ${ph.name}` : "—"}</p></div>
          <div><p className="text-muted-foreground text-xs">Hedef Go-Live</p><p className="font-medium">{fmtDate(project.goLiveDate)}</p></div>
          <div><p className="text-muted-foreground text-xs">İlerleme</p><div className="flex items-center gap-2"><Progress value={progress} className="h-2" /><span>%{progress}</span></div></div>
        </section>

        <Section title="Aşama durumu">
          <Table>
            <TableHeader><TableRow><TableHead>Aşama</TableHead><TableHead>Plan bitiş</TableHead><TableHead>Gerçekleşen</TableHead><TableHead>Durum</TableHead></TableRow></TableHeader>
            <TableBody>
              {phases.map((p) => (
                <TableRow key={p.id}><TableCell>{p.code} — {p.name}</TableCell><TableCell>{fmtDate(p.planEnd)}</TableCell><TableCell>{fmtDate(p.actualEnd)}</TableCell><TableCell><PhaseStatusBadge status={p.status} /></TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </Section>

        <Section title="Bu hafta tamamlananlar">
          {doneThisWeek.length ? <ul className="list-disc pl-5 text-sm space-y-1">{doneThisWeek.map((a) => <li key={a.id}>{a.label} <span className="text-muted-foreground">({fmtDate(a.at)})</span></li>)}</ul> : <Muted>Bu hafta tamamlanan adım yok.</Muted>}
        </Section>

        <Section title="Önümüzdeki hafta ve gecikenler">
          {upcoming.length ? (
            <Table>
              <TableHeader><TableRow><TableHead>Adım</TableHead><TableHead>Top kimde</TableHead><TableHead>Termin</TableHead></TableRow></TableHeader>
              <TableBody>{upcoming.map((s) => (
                <TableRow key={s.id}><TableCell>{s.title}</TableCell><TableCell>{BALL_LABEL[s.ball]}</TableCell><TableCell className={isOverdue(s.due, false) ? "text-destructive font-medium" : ""}>{fmtDate(s.due)}</TableCell></TableRow>
              ))}</TableBody>
            </Table>
          ) : <Muted>Yaklaşan adım yok.</Muted>}
        </Section>

        <Section title="Açık aksiyonlar">
          {actions.length ? (
            <Table>
              <TableHeader><TableRow><TableHead>Aksiyon</TableHead><TableHead>Sorumlu</TableHead><TableHead>Top kimde</TableHead><TableHead>Termin</TableHead><TableHead>Öncelik</TableHead></TableRow></TableHeader>
              <TableBody>{actions.map((a) => (
                <TableRow key={a.id}><TableCell>{a.title}</TableCell><TableCell>{personName(state, a.ownerId)}</TableCell><TableCell>{BALL_LABEL[a.ball]}</TableCell><TableCell>{fmtDate(a.due)}</TableCell><TableCell><PriorityBadge p={a.priority} /></TableCell></TableRow>
              ))}</TableBody>
            </Table>
          ) : <Muted>Açık aksiyon yok.</Muted>}
        </Section>

        <div className="grid grid-cols-2 gap-6">
          <Section title="Açık riskler">
            {risks.length ? <ul className="list-disc pl-5 text-sm space-y-1">{risks.map((r) => <li key={r.id}>{r.title}</li>)}</ul> : <Muted>Açık risk yok.</Muted>}
          </Section>
          <Section title="Açık taahhütler">
            {commits.length ? <ul className="list-disc pl-5 text-sm space-y-1">{commits.map((c) => <li key={c.id}>{c.text}</li>)}</ul> : <Muted>Açık taahhüt yok.</Muted>}
          </Section>
        </div>

        <footer className="border-t pt-3 text-xs text-muted-foreground">CSM: {personName(state, project.csmId)} · Rapor tarihi {fmtDate(today)} · Virgosol RabbitQA</footer>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="space-y-2 break-inside-avoid"><h2 className="font-semibold">{title}</h2>{children}</section>;
}
const Muted = ({ children }: { children: React.ReactNode }) => <p className="text-sm text-muted-foreground">{children}</p>;
