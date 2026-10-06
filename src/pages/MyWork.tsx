import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronRight } from "lucide-react";
import { previousStep } from "@/lib/rabbitqa/flow";
import { businessDaysBetween } from "@/lib/rabbitqa/business-days";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";
import { Pill, StepStatusBadge, ActionStatusBadge } from "@/components/rq/Badges";
import { useAuth } from "@/lib/auth-context";
import { useAlertViews, useRq } from "@/lib/rabbitqa/store";
import { ALERT_LEVEL_LABEL } from "@/lib/rabbitqa/labels";
import { visibleProjects } from "@/lib/rabbitqa/perm";
import { InsightCard } from "@/components/rq/InsightCard";
import { visibleInsights } from "@/lib/rabbitqa/perm";
import { effectiveStatus } from "@/lib/rabbitqa/ai-mock";
import { BALL_LABEL, fmtDate, todayISO } from "@/lib/rabbitqa/labels";

interface Item { id: string; kind: "Adım" | "Aksiyon"; title: string; due: string | null; projectId: string; badge: React.ReactNode; ball: string; isNew?: boolean }

export default function MyWork() {
  const { state } = useRq();
  const { user } = useAuth();
  const today = todayISO();
  const weekEnd = (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().slice(0, 10); })();

  const items: Item[] = [
    ...state.steps.filter((s) => s.ownerId === user?.id && (s.status === "pending" || s.status === "in_progress"))
      .map((s) => ({ id: s.id, kind: "Adım" as const, title: s.title, due: s.due, projectId: s.projectId, badge: <StepStatusBadge status={s.status} />, ball: BALL_LABEL[s.ball], isNew: !!s.activatedAt && businessDaysBetween(s.activatedAt.slice(0, 10), today) <= 1 })),
    ...state.actions.filter((a) => a.ownerId === user?.id && a.status !== "done" && a.status !== "cancelled")
      .map((a) => ({ id: a.id, kind: "Aksiyon" as const, title: a.title, due: a.due, projectId: a.projectId, badge: <ActionStatusBadge status={a.status} />, ball: BALL_LABEL[a.ball] })),
  ].sort((a, b) => (a.due ?? "9999").localeCompare(b.due ?? "9999"));

  const [showNext, setShowNext] = useState(false);
  const upcoming = state.steps
    .filter((s) => s.ownerId === user?.id && s.status === "locked" && state.phases.find((p) => p.id === s.phaseId)?.status !== "locked")
    .map((s) => ({ s, prev: previousStep(state.steps, s) }))
    .filter(({ s, prev }) => s.dependency === "previous" && prev && (prev.status === "pending" || prev.status === "in_progress"));

  const myAi = visibleInsights(state, user).filter((i) => effectiveStatus(state, i) === "pending" && (i.proposed as { ownerId?: string }).ownerId === user?.id);

  const allAlerts = useAlertViews();
  const vis = new Set(visibleProjects(state, user).map((p) => p.id));
  const myAlerts = allAlerts.filter((a) => a.status === "open" && a.ownerId === user?.id && (vis.has(a.projectId) || a.ownerId === user?.id))
    .sort((a, b) => (a.level === b.level ? 0 : a.level === "red" ? -1 : 1));

  const groups = [
    { title: "Geciken", tone: "danger" as const, list: items.filter((i) => i.due && i.due < today) },
    { title: "Bugün", tone: "warning" as const, list: items.filter((i) => i.due === today) },
    { title: "Bu hafta", tone: "info" as const, list: items.filter((i) => i.due && i.due > today && i.due <= weekEnd) },
    { title: "Daha sonra / termin yok", tone: "muted" as const, list: items.filter((i) => !i.due || i.due > weekEnd) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Bana atananlar" subtitle="Size atanmış açık adım ve aksiyonlar" />
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2">Uyarılarım <Pill tone={myAlerts.some((a) => a.level === "red") ? "danger" : "muted"}>{myAlerts.length}</Pill></CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {myAlerts.length === 0 && <p className="text-sm text-muted-foreground">Size ait açık uyarı yok</p>}
          {myAlerts.slice(0, 20).map((a) => (
            <Link key={a.key} to={`/app/projects/${a.projectId}?panel=alerts`} className="flex items-start justify-between gap-2 rounded-lg border p-3 hover:bg-accent/40">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{a.title}</p>
                <p className="text-xs text-muted-foreground">{state.projects.find((p) => p.id === a.projectId)?.customerName} · {a.detail}</p>
              </div>
              <Pill tone={a.level === "red" ? "danger" : "warning"}>{ALERT_LEVEL_LABEL[a.level]}</Pill>
            </Link>
          ))}
          {myAlerts.length > 20 && <p className="text-xs text-muted-foreground">+{myAlerts.length - 20} uyarı daha — proje sayfasındaki uyarı rozetine bakın.</p>}
        </CardContent>
      </Card>
      {myAi.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Sahibi siz olarak önerilen AI önerileri ({myAi.length})</CardTitle></CardHeader>
          <CardContent className="space-y-3">{myAi.map((i) => <InsightCard key={i.id} insight={i} />)}</CardContent>
        </Card>
      )}
      <Card>
        <CardHeader className="pb-3">
          <button type="button" className="flex items-center gap-2 text-left" onClick={() => setShowNext((v) => !v)}>
            {showNext ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <CardTitle className="text-base flex items-center gap-2">Sıradaki işlerim <Pill tone="muted">{upcoming.length}</Pill></CardTitle>
          </button>
        </CardHeader>
        {showNext && (
          <CardContent className="space-y-2">
            {upcoming.length === 0 && <p className="text-sm text-muted-foreground">Sırası yaklaşan işiniz yok</p>}
            {upcoming.map(({ s, prev }) => (
              <Link key={s.id} to={`/app/projects/${s.projectId}`} className="block rounded-lg border p-3 opacity-80 hover:bg-accent/40">
                <p className="text-sm font-medium">{s.title}</p>
                <p className="text-xs text-muted-foreground">{state.projects.find((p) => p.id === s.projectId)?.customerName} · {prev!.title} tamamlanınca açılacak · süre {s.durationDays} iş günü</p>
              </Link>
            ))}
          </CardContent>
        )}
      </Card>
      {items.length === 0 ? (
        <Card><EmptyState title="Açık işiniz yok" description="Size atanmış açık adım veya aksiyon bulunmuyor." /></Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {groups.map((g) => (
            <Card key={g.title}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">{g.title} <Pill tone={g.tone}>{g.list.length}</Pill></CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {g.list.length === 0 && <p className="text-sm text-muted-foreground">Kayıt yok</p>}
                {g.list.map((i) => {
                  const p = state.projects.find((x) => x.id === i.projectId);
                  return (
                    <Link key={i.id} to={`/app/projects/${i.projectId}`} className="block rounded-lg border p-3 hover:bg-accent/40 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{i.title}{i.isNew && <Pill tone="info" className="ml-2">Yeni</Pill>}</p>
                          <p className="text-xs text-muted-foreground">{p?.customerName} · {i.kind} · Top: {i.ball}</p>
                        </div>
                        <div className="text-right shrink-0 space-y-1">
                          {i.badge}
                          <p className="text-xs text-muted-foreground">{fmtDate(i.due)}</p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
