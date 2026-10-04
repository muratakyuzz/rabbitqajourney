import { Link } from "react-router-dom";
import { AlertTriangle, BarChart3, Building2, CalendarDays, LifeBuoy, ListChecks, Rocket, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { DEFAULT_FILTER, InsightCard, InsightFilters, applyFilter } from "@/components/rq/InsightCard";
import { visibleInsights } from "@/lib/rabbitqa/perm";
import { effectiveStatus } from "@/lib/rabbitqa/ai-mock";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { HealthBadge, Pill } from "@/components/rq/Badges";
import { useAuth } from "@/lib/auth-context";
import { isAllSeeing, visibleProjects } from "@/lib/rabbitqa/perm";
import { businessDaysBetween } from "@/lib/rabbitqa/business-days";
import { activePhase, personName, projectProgress, useRq , useAlertViews } from "@/lib/rabbitqa/store";
import { BALL_LABEL, MEETING_TYPE_LABEL, ROLE_LABEL, fmtDate, todayISO } from "@/lib/rabbitqa/labels";

type Item = { id: string; title: string; projectId: string; due?: string | null; late?: boolean };

const addDays = (iso: string, n: number) => {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

export default function Overview() {
  const { user } = useAuth();
  const { state } = useRq();
  const today = todayISO();
  const weekEnd = addDays(today, 7);
  const alertViews = useAlertViews();
  const projects = visibleProjects(state, user);
  const pids = new Set(projects.map((p) => p.id));
  const pname = (id: string) => state.projects.find((p) => p.id === id)?.customerName ?? "—";
  const openStep = (s: { status: string }) => s.status === "pending" || s.status === "in_progress";

  const alerts = alertViews.filter((a) => pids.has(a.projectId) && a.status === "open");
  const tickets = state.tickets.filter((t) => pids.has(t.projectId) && t.status !== "resolved" && t.status !== "closed");
  const month = today.slice(0, 7);
  const goLiveMonth = projects.filter((p) => p.goLiveDate?.startsWith(month));
  const health = (h: string) => projects.filter((p) => p.health === h).length;
  const lateSteps = state.steps.filter((s) => pids.has(s.projectId) && openStep(s) && s.due && s.due < today);
  const lateActions = state.actions.filter((a) => pids.has(a.projectId) && (a.status === "open" || a.status === "in_progress") && a.due && a.due < today);
  const openRisks = state.risks.filter((r) => pids.has(r.projectId) && r.kind === "risk" && r.status === "open");

  // Rol radarı
  let radarTitle = "";
  let radar: Item[] = [];
  const role = user?.role;
  if (role === "csm") {
    radarTitle = "Müşteri onayı bekleyenler ve açık taahhütler";
    radar = [
      ...state.steps.filter((s) => pids.has(s.projectId) && openStep(s) && s.ball === "customer").map((s) => ({ id: s.id, title: `Müşteride: ${s.title}`, projectId: s.projectId, due: s.due, late: !!s.due && s.due < today })),
      ...state.commitments.filter((c) => pids.has(c.projectId) && c.status === "open").map((c) => ({ id: c.id, title: `Taahhüt: ${c.text}`, projectId: c.projectId })),
    ];
  } else if (role === "devops") {
    radarTitle = "Kurulum, erişim ve LLM adımları";
    radar = [
      ...state.steps.filter((s) => s.ownerId === user!.id && openStep(s)).map((s) => ({ id: s.id, title: s.title, projectId: s.projectId, due: s.due, late: !!s.due && s.due < today })),
      ...projects.filter((p) => !p.llmChoice).map((p) => ({ id: `llm_${p.id}`, title: "LLM seçimi bekleniyor", projectId: p.id })),
    ];
  } else if (role === "care") {
    radarTitle = "Eğitim/adaptasyon oturumları ve destek kayıtları";
    radar = [
      ...state.trainings.filter((t) => pids.has(t.projectId) && t.status === "planned").map((t) => ({ id: t.id, title: "Eğitim oturumu", projectId: t.projectId, due: t.date })),
      ...tickets.map((t) => ({ id: t.id, title: `Destek: ${t.title}`, projectId: t.projectId })),
      ...state.steps.filter((s) => s.ownerId === user!.id && openStep(s)).map((s) => ({ id: s.id, title: s.title, projectId: s.projectId, due: s.due, late: !!s.due && s.due < today })),
    ];
  } else {
    radarTitle = "Darboğazlar ve gecikmeler";
    radar = [
      ...state.phases.filter((ph) => pids.has(ph.projectId) && ph.status !== "done" && ph.status !== "out_of_scope" && ph.planEnd && ph.planEnd < today).map((ph) => ({ id: ph.id, title: `Geciken aşama: ${ph.code} ${ph.name}`, projectId: ph.projectId, due: ph.planEnd, late: true })),
      ...lateSteps.map((s) => ({ id: s.id, title: `Geciken adım: ${s.title} · ${businessDaysBetween(s.due!, today)} iş günü`, projectId: s.projectId, due: s.due, late: true })),
    ];
  }

  const feed = [
    ...alerts.map((a) => ({ id: a.key, tone: a.level === "red" ? "danger" : "warning", tag: a.level === "red" ? "Kırmızı" : "Sarı", text: a.title, projectId: a.projectId })),
    ...tickets.filter((t) => t.priority === "high").map((t) => ({ id: t.id, tone: "danger", tag: "Yüksek ticket", text: t.title, projectId: t.projectId })),
    ...lateActions.map((a) => ({ id: a.id, tone: "warning", tag: "Geciken aksiyon", text: a.title, projectId: a.projectId })),
    ...openRisks.map((r) => ({ id: r.id, tone: "info", tag: "Açık risk", text: r.title, projectId: r.projectId })),
  ] as { id: string; tone: "danger" | "warning" | "info"; tag: string; text: string; projectId: string }[];

  const events = [
    ...state.meetings.filter((m) => pids.has(m.projectId) && m.status !== "cancelled" && m.date.slice(0, 10) >= today && m.date.slice(0, 10) <= weekEnd).map((m) => ({ id: m.id, date: m.date, label: MEETING_TYPE_LABEL[m.type], projectId: m.projectId })),
    ...state.trainings.filter((t) => pids.has(t.projectId) && t.date.slice(0, 10) >= today && t.date.slice(0, 10) <= weekEnd).map((t) => ({ id: t.id, date: t.date, label: "Eğitim", projectId: t.projectId })),
    ...state.adaptations.filter((a: any) => pids.has(a.projectId) && a.date && a.date.slice(0, 10) >= today && a.date.slice(0, 10) <= weekEnd).map((a: any) => ({ id: a.id, date: a.date, label: "Adaptasyon", projectId: a.projectId })),
    ...state.steps.filter((s) => pids.has(s.projectId) && openStep(s) && s.due && s.due >= today && s.due <= weekEnd && (s.key === "gonogo" || s.key === "customer_approval")).map((s) => ({ id: s.id, date: s.due!, label: s.title, projectId: s.projectId })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Genel bakış</h1>
          <p className="text-sm text-muted-foreground">Merhaba {user?.name} · {role ? ROLE_LABEL[role] : ""} · {fmtDate(today)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm"><Link to="/app/projects"><Building2 className="h-4 w-4 mr-2" />Projeler</Link></Button>
          <Button asChild variant="outline" size="sm"><Link to="/app/my-work"><ListChecks className="h-4 w-4 mr-2" />Bana atananlar</Link></Button>
          {isAllSeeing(user) && <Button asChild size="sm"><Link to="/app/reports"><BarChart3 className="h-4 w-4 mr-2" />Yönetim raporu</Link></Button>}
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
        <Kpi icon={Building2} label="Aktif proje" value={projects.length} />
        <Card className="p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Activity className="h-3.5 w-3.5" />Sağlık dağılımı</p>
          <div className="mt-2 flex gap-1.5 flex-wrap">
            <Pill tone="success">{health("green")} Yeşil</Pill>
            <Pill tone="warning">{health("yellow")} Sarı</Pill>
            <Pill tone="danger">{health("red")} Kırmızı</Pill>
          </div>
        </Card>
        <Kpi icon={AlertTriangle} label="Açık uyarı" value={alerts.length} sub={`${alerts.filter((a) => a.level === "red").length} kırmızı`} />
        <Kpi icon={LifeBuoy} label="Açık destek kaydı" value={tickets.length} />
        <Kpi icon={Rocket} label="Bu ay Go-Live" value={goLiveMonth.length} />
      </div>

      <AiInsightCard />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-4 space-y-3 lg:col-span-2">
          <div>
            <h2 className="font-semibold">Rolüme göre radar</h2>
            <p className="text-xs text-muted-foreground">{radarTitle}</p>
          </div>
          {radar.length ? (
            <ul className="divide-y">
              {radar.slice(0, 8).map((i) => (
                <li key={i.id} className="py-2 flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate">{i.title}</p>
                    <Link to={`/app/projects/${i.projectId}`} className="text-xs text-muted-foreground hover:underline">{pname(i.projectId)}</Link>
                  </div>
                  {i.due && <Pill tone={i.late ? "danger" : "muted"}>{fmtDate(i.due)}</Pill>}
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted-foreground">Şu an dikkat gerektiren bir şey yok.</p>}
        </Card>

        <Card className="p-4 space-y-3">
          <h2 className="font-semibold flex items-center gap-2"><CalendarDays className="h-4 w-4" />Bu hafta</h2>
          {events.length ? (
            <ul className="space-y-2 text-sm">
              {events.slice(0, 8).map((e) => (
                <li key={e.id} className="flex gap-3">
                  <span className="text-xs text-muted-foreground w-16 shrink-0 pt-0.5">{fmtDate(e.date)}</span>
                  <div className="min-w-0"><p className="truncate">{e.label}</p><p className="text-xs text-muted-foreground">{pname(e.projectId)}</p></div>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted-foreground">Önümüzdeki 7 günde planlı oturum yok.</p>}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-4 space-y-3 lg:col-span-2">
          <h2 className="font-semibold">Aktif onboarding pipeline</h2>
          {projects.length ? (
            <div className="space-y-3">
              {projects.map((p) => {
                const ph = activePhase(state, p.id);
                const prog = projectProgress(state, p.id);
                const cur = state.steps.filter((s) => s.projectId === p.id && openStep(s)).sort((a, b) => a.order - b.order)[0];
                return (
                  <Link key={p.id} to={`/app/projects/${p.id}`} className="block rounded-lg border p-3 hover:bg-accent/40 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{p.customerName}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.installType ? (p.installType === "saas" ? "SaaS" : "On-prem") : "Kurulum seçilmedi"} · {p.purchasedModules.length} modül · CSM: {personName(state, p.csmId)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {cur && <Pill tone={cur.ball === "customer" ? "warning" : "info"}>Top: {BALL_LABEL[cur.ball]}</Pill>}
                        <HealthBadge health={p.health} />
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <Progress value={prog} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground w-44 truncate text-right">%{prog} · {ph ? `${ph.code} ${ph.name}` : "Tamamlandı"}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : <p className="text-sm text-muted-foreground">Size atanmış proje yok.</p>}
        </Card>

        <Card className="p-4 space-y-3">
          <h2 className="font-semibold flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Uyarı ve darboğaz akışı</h2>
          {feed.length ? (
            <ul className="space-y-2.5 text-sm">
              {feed.slice(0, 10).map((f) => (
                <li key={f.id} className="space-y-1">
                  <div className="flex items-center gap-2"><Pill tone={f.tone}>{f.tag}</Pill><Link to={`/app/projects/${f.projectId}`} className="text-xs text-muted-foreground hover:underline truncate">{pname(f.projectId)}</Link></div>
                  <p className="leading-snug">{f.text}</p>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted-foreground">Açık uyarı yok.</p>}
        </Card>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: number; sub?: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Icon className="h-3.5 w-3.5" />{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </Card>
  );
}

function AiInsightCard() {
  const { state } = useRq();
  const { user } = useAuth();
  const [f, setF] = useState(DEFAULT_FILTER);
  const pending = visibleInsights(state, user).filter((i) => effectiveStatus(state, i) === "pending");
  const list = applyFilter(pending, f).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <Card className="p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />AI Insight <Pill tone={pending.length ? "info" : "muted"}>{pending.length} bekleyen</Pill></h2>
        <div className="flex flex-wrap items-center gap-2">
          <InsightFilters f={f} setF={setF} projects={visibleProjects(state, user)} />
          <Button asChild variant="outline" size="sm"><Link to="/app/insights">Tümünü gör</Link></Button>
        </div>
      </div>
      {list.length ? <div className="space-y-3">{list.slice(0, 5).map((i) => <InsightCard key={i.id} insight={i} />)}</div>
        : <p className="text-sm text-muted-foreground py-4 text-center">İncelenecek AI önerisi yok.</p>}
    </Card>
  );
}
