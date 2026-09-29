import { Link } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";
import { Pill, StepStatusBadge, ActionStatusBadge } from "@/components/rq/Badges";
import { useAuth } from "@/lib/auth-context";
import { useRq } from "@/lib/rabbitqa/store";
import { BALL_LABEL, fmtDate, todayISO } from "@/lib/rabbitqa/labels";

interface Item { id: string; kind: "Adım" | "Aksiyon"; title: string; due: string | null; projectId: string; badge: React.ReactNode; ball: string }

export default function MyWork() {
  const { state } = useRq();
  const { user } = useAuth();
  const today = todayISO();
  const weekEnd = (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().slice(0, 10); })();

  const items: Item[] = [
    ...state.steps.filter((s) => s.ownerId === user?.id && s.status !== "done" && s.status !== "out_of_scope")
      .map((s) => ({ id: s.id, kind: "Adım" as const, title: s.title, due: s.due, projectId: s.projectId, badge: <StepStatusBadge status={s.status} />, ball: BALL_LABEL[s.ball] })),
    ...state.actions.filter((a) => a.ownerId === user?.id && a.status !== "done" && a.status !== "cancelled")
      .map((a) => ({ id: a.id, kind: "Aksiyon" as const, title: a.title, due: a.due, projectId: a.projectId, badge: <ActionStatusBadge status={a.status} />, ball: BALL_LABEL[a.ball] })),
  ].sort((a, b) => (a.due ?? "9999").localeCompare(b.due ?? "9999"));

  const groups = [
    { title: "Geciken", tone: "danger" as const, list: items.filter((i) => i.due && i.due < today) },
    { title: "Bugün", tone: "warning" as const, list: items.filter((i) => i.due === today) },
    { title: "Bu hafta", tone: "info" as const, list: items.filter((i) => i.due && i.due > today && i.due <= weekEnd) },
    { title: "Daha sonra / termin yok", tone: "muted" as const, list: items.filter((i) => !i.due || i.due > weekEnd) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Bana atananlar" subtitle="Size atanmış açık adım ve aksiyonlar" />
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
                          <p className="text-sm font-medium truncate">{i.title}</p>
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
