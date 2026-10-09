import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/lib/auth-context";
import { useRq } from "@/lib/rabbitqa/store";
import { canManageProject } from "@/lib/rabbitqa/perm";
import { KpiSection, TeamRow } from "./Phase2Tabs";
import type { Project } from "@/lib/rabbitqa/types";

/** Keşif formu + Takımlar + KPI; sekmede ve 02 çalışma alanı panelinde aynı bileşen (AC1). */
export function DiscoveryContent({ project, readOnly, layout }: { project: Project; readOnly: boolean; layout: "tab" | "panel" }) {
  const { state, updateProject, addTeam } = useRq();
  const [team, setTeam] = useState("");
  const manage = !readOnly;
  const groups = useMemo(() => {
    const g: Record<string, typeof state.questions> = {};
    [...state.questions].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).forEach((q) => { (g[q.group] ??= []).push(q); });
    return g;
  }, [state.questions]);
  const mismatch = project.desiredModules.filter((m) => !project.purchasedModules.includes(m));
  const phase05 = state.phases.find((p) => p.projectId === project.id && p.code === "05");

  const onAddTeam = () => {
    const trimmed = team.trim();
    if (!trimmed) return;
    if (project.teams.includes(trimmed) || trimmed.toLowerCase() === "general") {
      toast.error(trimmed.toLowerCase() === "general" ? "'general' takım adı olarak kullanılamaz" : "Bu takım zaten ekli");
      return;
    }
    addTeam(project.id, trimmed);
    toast.success(
      phase05?.status === "done"
        ? "Takım eklendi; Uyarlama tamamlandığı için gözden geçirme aksiyonu açıldı"
        : "Takım eklendi, Uyarlama aşamasına adım açıldı",
    );
    setTeam("");
  };

  return (
    <div className={layout === "panel" ? "space-y-4" : "grid gap-4 lg:grid-cols-3"}>
      <Card className={layout === "panel" ? undefined : "lg:col-span-2"}>
        <CardHeader><CardTitle className="text-base">Keşif formu</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          {Object.entries(groups).map(([g, qs]) => (
            <div key={g} className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{g}</p>
              {qs.map((q) => (
                <div key={q.id} data-field={`discovery:${q.id}`} className="grid gap-1.5">
                  <Label className="leading-snug">{q.text}{q.required && <span className="text-destructive ml-1">*</span>}</Label>
                  {q.type === "modules" ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {state.modules.map((m) => (
                        <label key={m} className="flex items-center gap-2 text-sm">
                          <Checkbox disabled={!manage} checked={project.desiredModules.includes(m)} onCheckedChange={(c) => {
                            const next = c ? [...project.desiredModules, m] : project.desiredModules.filter((x) => x !== m);
                            updateProject(project.id, { desiredModules: next, discoveryAnswers: { ...project.discoveryAnswers, [q.id]: next.join(", ") } });
                          }} />{m}
                        </label>
                      ))}
                    </div>
                  ) : <Textarea
                    defaultValue={project.discoveryAnswers[q.id] ?? ""} disabled={!manage} rows={2}
                    className={q.required && !project.discoveryAnswers[q.id] ? "border-warning" : ""}
                    onBlur={(e) => updateProject(project.id, { discoveryAnswers: { ...project.discoveryAnswers, [q.id]: e.target.value } })}
                  />}
                </div>
              ))}
            </div>
          ))}
          <div data-field="discovery" className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Kullanılmak istenen modüller</p>
            <div className="grid grid-cols-3 gap-2">
              {state.modules.map((m) => (
                <label key={m} className="flex items-center gap-2 text-sm">
                  <Checkbox disabled={!manage} checked={project.desiredModules.includes(m)}
                    onCheckedChange={(c) => {
                      const next = c ? [...project.desiredModules, m] : project.desiredModules.filter((x) => x !== m);
                      const mq = state.questions.filter((q) => q.type === "modules");
                      updateProject(project.id, { desiredModules: next, ...(mq.length ? { discoveryAnswers: { ...project.discoveryAnswers, ...Object.fromEntries(mq.map((q) => [q.id, next.join(", ")])) } } : {}) });
                    }} />
                  {m}
                </label>
              ))}
            </div>
            {mismatch.length > 0 && (
              <p className="text-sm text-warning-foreground bg-warning/15 border border-warning/40 rounded-md px-3 py-2">
                Lisans uyumsuzluğu: {mismatch.join(", ")} satın alınan modüller arasında yok.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Takımlar</CardTitle></CardHeader>
        <CardContent data-field="teams" className="space-y-3">
          {project.teams.length === 0 && <p className="text-sm text-muted-foreground">Takım tanımlanmadı.</p>}
          {project.teams.map((t) => <TeamRow key={t} project={project} team={t} />)}
          {manage && (
            <div className="flex gap-2 pt-2">
              <Input placeholder="Takım adı" value={team} onChange={(e) => setTeam(e.target.value)} />
              <Button onClick={onAddTeam}>Ekle</Button>
            </div>
          )}
        </CardContent>
      </Card>
      <div data-field="kpis">
        <KpiSection project={project} />
      </div>
    </div>
  );
}

/** Sekme sarmalayıcısı: yetki ve `readOnly` hesaplaması burada, içerik `DiscoveryContent`'tedir. */
export function DiscoveryTab({ project }: { project: Project }) {
  const { user } = useAuth();
  const manage = canManageProject(user, project);
  return <DiscoveryContent project={project} readOnly={!manage} layout="tab" />;
}
