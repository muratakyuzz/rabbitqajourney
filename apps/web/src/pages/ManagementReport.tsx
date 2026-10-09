import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router";
import { Printer } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { HealthBadge, Pill } from "@/components/rq/Badges";
import { useAuth } from "@/lib/auth-context";
import { canSeeManagementReport, isWorkforceUser } from "@/lib/rabbitqa/perm";
import { activePhase, personName, projectProgress, useAlertViews, useRq } from "@/lib/rabbitqa/store";
import { businessDaysBetween } from "@/lib/rabbitqa/business-days";
import { isOpenStep } from "@/lib/rabbitqa/flow";
import { weekStartOf } from "@/lib/rabbitqa/alerts";
import { TICKET_TYPE_LABEL, fmtDate, todayISO } from "@/lib/rabbitqa/labels";
import type { TicketType } from "@/lib/rabbitqa/types";

type Period = "week" | "month" | "3m" | "custom";
const shift = (iso: string, days: number) => new Date(new Date(iso + "T00:00:00Z").getTime() + days * 86400000).toISOString().slice(0, 10);
const tip = { background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 12 };
const axis = { fontSize: 11, fill: "hsl(var(--muted-foreground))" };

export default function ManagementReport() {
  const { user } = useAuth();
  const { state } = useRq();
  const alertViews = useAlertViews();
  const today = todayISO();
  const [period, setPeriod] = useState<Period>("month");
  const [cFrom, setCFrom] = useState(shift(today, -30));
  const [cTo, setCTo] = useState(today);
  const [from, to] = useMemo<[string, string]>(() => {
    if (period === "week") return [weekStartOf(today), today];
    if (period === "month") return [today.slice(0, 8) + "01", today];
    if (period === "3m") return [shift(today, -90), today];
    return [cFrom, cTo];
  }, [period, cFrom, cTo, today]);
  if (!canSeeManagementReport(user)) return <Navigate to="/app/projects" replace />;

  const projects = state.projects;
  const goLiveOf = (pid: string) => state.phases.find((p) => p.projectId === pid && p.code === "07");
  const active = projects.filter((p) => goLiveOf(p.id)?.status !== "done");
  const wentLive = projects.filter((p) => { const g = goLiveOf(p.id); return g?.status === "done" && g.actualEnd && g.actualEnd >= from && g.actualEnd <= to; });
  const healthData = [
    { name: "Yeşil", value: projects.filter((p) => p.health === "green").length, color: "hsl(var(--success))" },
    { name: "Sarı", value: projects.filter((p) => p.health === "yellow").length, color: "hsl(var(--warning))" },
    { name: "Kırmızı", value: projects.filter((p) => p.health === "red").length, color: "hsl(var(--destructive))" },
  ];

  const lateItems = [
    ...state.steps.filter((s) => isOpenStep(s) && s.due && s.due < today).map((s) => ({ ownerId: s.ownerId, kind: "step" as const })),
    ...state.actions.filter((a) => (a.status === "open" || a.status === "in_progress") && a.due && a.due < today).map((a) => ({ ownerId: a.ownerId, kind: "action" as const })),
  ];
  const owners = Array.from(new Set(lateItems.map((x) => x.ownerId ?? "none")));
  const lateByOwner = owners.map((o) => ({
    name: o === "none" ? "Atanmadı" : personName(state, o),
    Adım: lateItems.filter((x) => (x.ownerId ?? "none") === o && x.kind === "step").length,
    Aksiyon: lateItems.filter((x) => (x.ownerId ?? "none") === o && x.kind === "action").length,
  })).sort((a, b) => b.Adım + b.Aksiyon - (a.Adım + a.Aksiyon));

  const csmLoad = state.users.filter((u) => u.role === "csm" && u.active !== false).map((u) => ({
    name: u.name,
    Müşteri: projects.filter((p) => p.csmId === u.id).length,
    "Açık iş": state.steps.filter((s) => s.ownerId === u.id && isOpenStep(s)).length + state.actions.filter((a) => a.ownerId === u.id && (a.status === "open" || a.status === "in_progress")).length,
  }));

  const waiting = state.steps.filter((s) => isOpenStep(s) && s.ball === "customer")
    .map((s) => ({ s, days: Math.max(0, businessDaysBetween(s.ballSince.slice(0, 10), today)), customer: projects.find((p) => p.id === s.projectId)?.customerName ?? "—" }))
    .sort((a, b) => b.days - a.days);
  const highRisks = state.risks.filter((r) => r.kind === "risk" && r.status === "open" && r.impact === "high");
  const ticketsInPeriod = state.tickets.filter((t) => t.openedAt.slice(0, 10) >= from && t.openedAt.slice(0, 10) <= to);
  const openTickets = state.tickets.filter((t) => t.status !== "resolved" && t.status !== "closed");
  const critical = alertViews.filter((a) => a.status === "open" && a.level === "red");
  const team = state.users.filter((u) => isWorkforceUser(u.role) && u.active !== false).map((u) => ({
    u,
    steps: state.steps.filter((s) => s.ownerId === u.id && isOpenStep(s)).length,
    actions: state.actions.filter((a) => a.ownerId === u.id && (a.status === "open" || a.status === "in_progress")).length,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Yönetim raporu</h1>
          <p className="text-sm text-muted-foreground">Tüm onboarding portföyü · {fmtDate(from)} – {fmtDate(to)}</p>
        </div>
        <div className="flex flex-wrap items-end gap-2 print:hidden">
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-40" aria-label="Dönem"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Bu hafta</SelectItem><SelectItem value="month">Bu ay</SelectItem>
              <SelectItem value="3m">Son 3 ay</SelectItem><SelectItem value="custom">Özel aralık</SelectItem>
            </SelectContent>
          </Select>
          {period === "custom" && <>
            <Input type="date" className="w-40" value={cFrom} onChange={(e) => setCFrom(e.target.value)} aria-label="Başlangıç" />
            <Input type="date" className="w-40" value={cTo} onChange={(e) => setCTo(e.target.value)} aria-label="Bitiş" />
          </>}
          <Button onClick={() => window.print()}><Printer className="h-4 w-4 mr-2" />Yazdır / PDF kaydet</Button>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-6">
        <Kpi label="Aktif proje" value={active.length} />
        <Kpi label="Yeşil" value={healthData[0].value} />
        <Kpi label="Sarı" value={healthData[1].value} />
        <Kpi label="Kırmızı" value={healthData[2].value} />
        <Kpi label="Dönemde Go-Live" value={wentLive.length} />
        <Kpi label="Kırmızı uyarı" value={critical.length} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Sağlık dağılımı">
          <PieChart accessibilityLayer={false}>
            <Pie data={healthData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
              {healthData.map((d) => <Cell key={d.name} fill={d.color} />)}
            </Pie>
            <Tooltip contentStyle={tip} itemSorter={() => 0} /><Legend wrapperStyle={{ fontSize: 12 }} itemSorter={null} />
          </PieChart>
        </ChartCard>
        <ChartCard title="Gecikenler — sahibe göre" empty={!lateByOwner.length && "Geciken adım veya aksiyon yok."}>
          <BarChart data={lateByOwner} accessibilityLayer={false} layout="vertical" margin={{ left: 24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" allowDecimals={false} tick={axis} /><YAxis type="category" dataKey="name" width={110} tick={axis} />
            <Tooltip contentStyle={tip} itemSorter={() => 0} /><Legend wrapperStyle={{ fontSize: 12 }} itemSorter={null} />
            <Bar dataKey="Adım" stackId="a" fill="hsl(var(--primary))" /><Bar dataKey="Aksiyon" stackId="a" fill="hsl(var(--warning))" />
          </BarChart>
        </ChartCard>
        <ChartCard title="CSM başına müşteri ve açık iş" empty={!csmLoad.length && "Aktif CSM yok."}>
          <BarChart data={csmLoad} accessibilityLayer={false}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={axis} /><YAxis allowDecimals={false} tick={axis} />
            <Tooltip contentStyle={tip} itemSorter={() => 0} /><Legend wrapperStyle={{ fontSize: 12 }} itemSorter={null} />
            <Bar dataKey="Müşteri" fill="hsl(var(--primary))" /><Bar dataKey="Açık iş" fill="hsl(var(--muted-foreground))" />
          </BarChart>
        </ChartCard>
      </div>

      <Card className="p-4 space-y-2">
        <h2 className="font-semibold">Proje portföyü</h2>
        {projects.length === 0 ? <p className="text-sm text-muted-foreground">Proje yok.</p> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Müşteri</TableHead><TableHead>CSM</TableHead><TableHead>Aktif aşama</TableHead><TableHead>İlerleme</TableHead><TableHead>Sağlık</TableHead>
              <TableHead>Gecikme</TableHead><TableHead>Baseline sapması</TableHead><TableHead>Lisans uyumsuzluğu</TableHead><TableHead>Go-Live</TableHead>
            </TableRow></TableHeader>
            <TableBody>{projects.map((p) => {
              const ph = activePhase(state, p.id);
              const late = ph && ph.status !== "done" && ph.planEnd && ph.planEnd < today ? businessDaysBetween(ph.planEnd, today) : 0;
              const dev = ph?.planEnd && ph.baselineEnd ? businessDaysBetween(ph.baselineEnd, ph.planEnd) : null;
              const mism = p.desiredModules.filter((m) => !p.purchasedModules.includes(m));
              return (
                <TableRow key={p.id}>
                  <TableCell><Link className="font-medium hover:underline" to={`/app/projects/${p.id}`}>{p.customerName}</Link></TableCell>
                  <TableCell>{personName(state, p.csmId)}</TableCell>
                  <TableCell>{ph ? `${ph.code} — ${ph.name}` : "—"}</TableCell>
                  <TableCell>%{projectProgress(state, p.id)}</TableCell>
                  <TableCell><HealthBadge health={p.health} /></TableCell>
                  <TableCell className={late > 0 ? "text-destructive font-medium" : ""}>{late > 0 ? `${late} iş günü` : "—"}</TableCell>
                  <TableCell className={dev && dev > 0 ? "text-destructive" : ""}>{dev === null ? "—" : dev === 0 ? "0" : `${dev > 0 ? "+" : ""}${dev} iş günü`}</TableCell>
                  <TableCell className="text-xs">{mism.length ? mism.join(", ") : "—"}</TableCell>
                  <TableCell>{fmtDate(p.goLiveDate)}</TableCell>
                </TableRow>
              );
            })}</TableBody>
          </Table>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4 space-y-2">
          <h2 className="font-semibold">Müşteride bekleyen adımlar</h2>
          {waiting.length ? <ul className="text-sm space-y-1">{waiting.map(({ s, days, customer }) => (
            <li key={s.id}>{customer} — {s.title} <span className={days >= state.alertThresholds.customerWaitDays ? "text-destructive" : "text-muted-foreground"}>({days} iş günü)</span></li>
          ))}</ul> : <p className="text-sm text-muted-foreground">Müşteride bekleyen adım yok.</p>}
        </Card>
        <Card className="p-4 space-y-2">
          <h2 className="font-semibold">Yüksek etkili açık riskler</h2>
          {highRisks.length ? <ul className="text-sm space-y-1">{highRisks.map((r) => (
            <li key={r.id}>{projects.find((p) => p.id === r.projectId)?.customerName} — {r.title}</li>
          ))}</ul> : <p className="text-sm text-muted-foreground">Yüksek etkili açık risk yok.</p>}
        </Card>
        <Card className="p-4 space-y-2">
          <h2 className="font-semibold">Destek kayıtları (türe göre)</h2>
          <Table>
            <TableHeader><TableRow><TableHead>Tür</TableHead><TableHead>Dönemde açılan</TableHead><TableHead>Şu an açık</TableHead></TableRow></TableHeader>
            <TableBody>{(Object.keys(TICKET_TYPE_LABEL) as TicketType[]).map((k) => (
              <TableRow key={k}><TableCell>{TICKET_TYPE_LABEL[k]}</TableCell><TableCell>{ticketsInPeriod.filter((t) => t.type === k).length}</TableCell><TableCell>{openTickets.filter((t) => t.type === k).length}</TableCell></TableRow>
            ))}</TableBody>
          </Table>
        </Card>
        <Card className="p-4 space-y-2">
          <h2 className="font-semibold">Kırmızı uyarılar</h2>
          {critical.length ? <ul className="text-sm space-y-1">{critical.map((a) => (
            <li key={a.key} className="flex gap-2 items-start"><Pill tone="danger">Kırmızı</Pill>{projects.find((p) => p.id === a.projectId)?.customerName} — {a.title}</li>
          ))}</ul> : <p className="text-sm text-muted-foreground">Açık kırmızı uyarı yok.</p>}
        </Card>
      </div>

      <Card className="p-4 space-y-2">
        <h2 className="font-semibold">Ekip iş yükü</h2>
        {team.length === 0 ? <p className="text-sm text-muted-foreground">Ekip üyesi yok.</p> : (
          <Table>
            <TableHeader><TableRow><TableHead>Kişi</TableHead><TableHead>Açık adım</TableHead><TableHead>Açık aksiyon</TableHead></TableRow></TableHeader>
            <TableBody>{team.map((t) => (
              <TableRow key={t.u.id}><TableCell>{t.u.name}</TableCell><TableCell>{t.steps}</TableCell><TableCell>{t.actions}</TableCell></TableRow>
            ))}</TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

function ChartCard({ title, children, empty }: { title: string; children: React.ReactElement; empty?: string | false }) {
  return (
    <Card className="p-4 space-y-2 break-inside-avoid">
      <h2 className="font-semibold">{title}</h2>
      {empty ? <p className="text-sm text-muted-foreground h-56 flex items-center justify-center">{empty}</p> : (
        <div className="h-56"><ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer></div>
      )}
    </Card>
  );
}
const Kpi = ({ label, value }: { label: string; value: number }) => (
  <Card className="p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="text-2xl font-bold">{value}</p></Card>
);
