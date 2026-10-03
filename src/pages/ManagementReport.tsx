import { Link, Navigate } from "react-router-dom";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { HealthBadge, Pill } from "@/components/rq/Badges";
import { useAuth } from "@/lib/auth-context";
import { isAllSeeing } from "@/lib/rabbitqa/perm";
import { activePhase, personName, projectProgress, useRq } from "@/lib/rabbitqa/store";
import { fmtDate, todayISO } from "@/lib/rabbitqa/labels";

export default function ManagementReport() {
  const { user } = useAuth();
  const { state } = useRq();
  if (!isAllSeeing(user)) return <Navigate to="/app/projects" replace />;
  const today = todayISO();
  const projects = state.projects;
  const count = (h: string) => projects.filter((p) => p.health === h).length;
  const latePhases = state.phases.filter((p) => p.status !== "done" && p.status !== "out_of_scope" && p.planEnd && p.planEnd < today);
  const critical = state.alerts.filter((a) => a.status === "open" && a.severity === "critical");
  const openRisks = state.risks.filter((r) => r.kind === "risk" && r.status === "open");
  const openTickets = state.tickets.filter((t) => t.status !== "resolved" && t.status !== "closed");
  const team = state.users.filter((u) => ["csm", "devops", "care"].includes(u.role)).map((u) => ({
    u,
    projects: projects.filter((p) => p.csmId === u.id).length,
    steps: state.steps.filter((s) => s.ownerId === u.id && (s.status === "pending" || s.status === "in_progress")).length,
    actions: state.actions.filter((a) => a.ownerId === u.id && (a.status === "open" || a.status === "in_progress")).length,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Yönetim raporu</h1>
          <p className="text-sm text-muted-foreground">Tüm onboarding portföyü · {fmtDate(today)}</p>
        </div>
        <Button className="print:hidden" onClick={() => window.print()}><Printer className="h-4 w-4 mr-2" />Yazdır / PDF kaydet</Button>
      </div>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-6">
        <Kpi label="Aktif proje" value={projects.length} />
        <Kpi label="Yeşil" value={count("green")} />
        <Kpi label="Sarı" value={count("yellow")} />
        <Kpi label="Kırmızı" value={count("red")} />
        <Kpi label="Kritik uyarı" value={critical.length} />
        <Kpi label="Geciken aşama" value={latePhases.length} />
      </div>

      <Card className="p-4 space-y-2">
        <h2 className="font-semibold">Proje portföyü</h2>
        <Table>
          <TableHeader><TableRow><TableHead>Müşteri</TableHead><TableHead>CSM</TableHead><TableHead>Aktif aşama</TableHead><TableHead>İlerleme</TableHead><TableHead>Sağlık</TableHead><TableHead>Go-Live</TableHead><TableHead>Açık risk / destek</TableHead></TableRow></TableHeader>
          <TableBody>{projects.map((p) => {
            const ph = activePhase(state, p.id);
            return (
              <TableRow key={p.id}>
                <TableCell><Link className="font-medium hover:underline" to={`/app/projects/${p.id}`}>{p.customerName}</Link></TableCell>
                <TableCell>{personName(state, p.csmId)}</TableCell>
                <TableCell>{ph ? `${ph.code} — ${ph.name}` : "—"}</TableCell>
                <TableCell>%{projectProgress(state, p.id)}</TableCell>
                <TableCell><HealthBadge health={p.health} /></TableCell>
                <TableCell>{fmtDate(p.goLiveDate)}</TableCell>
                <TableCell>{openRisks.filter((r) => r.projectId === p.id).length} / {openTickets.filter((t) => t.projectId === p.id).length}</TableCell>
              </TableRow>
            );
          })}</TableBody>
        </Table>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4 space-y-2">
          <h2 className="font-semibold">Geciken aşamalar</h2>
          {latePhases.length ? <ul className="text-sm space-y-1">{latePhases.map((ph) => (
            <li key={ph.id}>{state.projects.find((p) => p.id === ph.projectId)?.customerName} — {ph.code} {ph.name} <span className="text-destructive">(plan {fmtDate(ph.planEnd)})</span></li>
          ))}</ul> : <p className="text-sm text-muted-foreground">Geciken aşama yok.</p>}
        </Card>
        <Card className="p-4 space-y-2">
          <h2 className="font-semibold">Kritik uyarılar</h2>
          {critical.length ? <ul className="text-sm space-y-1">{critical.map((a) => (
            <li key={a.id} className="flex gap-2 items-start"><Pill tone="danger">Kritik</Pill>{state.projects.find((p) => p.id === a.projectId)?.customerName} — {a.title}</li>
          ))}</ul> : <p className="text-sm text-muted-foreground">Açık kritik uyarı yok.</p>}
        </Card>
      </div>

      <Card className="p-4 space-y-2">
        <h2 className="font-semibold">Ekip iş yükü</h2>
        <Table>
          <TableHeader><TableRow><TableHead>Kişi</TableHead><TableHead>CSM olduğu proje</TableHead><TableHead>Açık adım</TableHead><TableHead>Açık aksiyon</TableHead></TableRow></TableHeader>
          <TableBody>{team.map((t) => (
            <TableRow key={t.u.id}><TableCell>{t.u.name}</TableCell><TableCell>{t.projects}</TableCell><TableCell>{t.steps}</TableCell><TableCell>{t.actions}</TableCell></TableRow>
          ))}</TableBody>
        </Table>
      </Card>
    </div>
  );
}

const Kpi = ({ label, value }: { label: string; value: number }) => (
  <Card className="p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="text-2xl font-bold">{value}</p></Card>
);
