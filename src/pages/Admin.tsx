import { useState } from "react";
import { Navigate } from "react-router-dom";
import { AlertTriangle, ArrowDown, ArrowUp, Info, Plus, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { projectPlan } from "@/lib/rabbitqa/flow";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/lib/auth-context";
import { useRq } from "@/lib/rabbitqa/store";
import { uid } from "@/lib/rabbitqa/seed";
import { STEP_CONDITIONS } from "@/lib/rabbitqa/completion";
import { Pill } from "@/components/rq/Badges";
import { BALL_LABEL, COMPLETION_LABEL, MEETING_TYPE_LABEL, QUESTION_TYPE_LABEL, fmtDateTime } from "@/lib/rabbitqa/labels";
import { IntegrationsAdmin } from "./admin/IntegrationsAdmin";
import { AlertsAdmin, SalespeopleAdmin } from "./admin/AlertsAdmin";
import { UsersAdmin } from "./admin/UsersAdmin";
import { canAccessAdmin } from "@/lib/rabbitqa/perm";
import type { Ball, Dependency, PhaseTpl, StepTpl } from "@/lib/rabbitqa/types";

function completionText(s: StepTpl) {
  const c = s.completion ?? "manual";
  if (c === "manual") return COMPLETION_LABEL.manual;
  if (c === "data") return `${COMPLETION_LABEL.data}: ${s.key ? STEP_CONDITIONS[s.key]?.label ?? s.key : ""}`;
  return `${COMPLETION_LABEL.meeting}: ${s.meetingType ? MEETING_TYPE_LABEL[s.meetingType] : ""}`;
}

export default function Admin() {
  const { user } = useAuth();
  const { state } = useRq();
  if (!canAccessAdmin(user)) return <Navigate to="/app/projects" replace />;
  const configAudit = state.audit.filter((a) => a.entity === "config").slice(-30).reverse();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sistem ayarları</h1>
        <p className="text-sm text-muted-foreground">Şablon değişiklikleri yalnızca yeni açılan projeleri etkiler.</p>
      </div>
      <Tabs defaultValue="template">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="template">Aşama şablonu</TabsTrigger>
          <TabsTrigger value="modules">Modüller</TabsTrigger>
          <TabsTrigger value="integrations">Entegrasyonlar</TabsTrigger>
          <TabsTrigger value="questions">Keşif soruları</TabsTrigger>
          <TabsTrigger value="users">Kullanıcılar</TabsTrigger>
          <TabsTrigger value="salespeople">Satışçılar</TabsTrigger>
          <TabsTrigger value="alerts">Uyarılar</TabsTrigger>
          <TabsTrigger value="log">Değişiklikler</TabsTrigger>
        </TabsList>
        <TabsContent value="template"><TemplateEditor /></TabsContent>
        <TabsContent value="modules"><ModulesEditor /></TabsContent>
        <TabsContent value="integrations"><IntegrationsAdmin /></TabsContent>
        <TabsContent value="questions"><QuestionsEditor /></TabsContent>
        <TabsContent value="users"><UsersAdmin /></TabsContent>
        <TabsContent value="salespeople"><SalespeopleAdmin /></TabsContent>
        <TabsContent value="alerts"><AlertsAdmin /></TabsContent>
        <TabsContent value="log">
          <Card className="p-4">
            {configAudit.length ? <ul className="text-sm space-y-1">{configAudit.map((a) => (
              <li key={a.id}>{fmtDateTime(a.at)} — {state.users.find((u) => u.id === a.userId)?.name ?? a.userId}: {a.label}</li>
            ))}</ul> : <p className="text-sm text-muted-foreground">Henüz ayar değişikliği yok.</p>}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function templateDays(p: PhaseTpl) {
  const start = "2026-01-05";
  const plan = projectPlan([{ id: "p", order: 0, dependency: "independent" }], p.steps.map((s, i) => ({ id: String(i), phaseId: "p", order: i, dependency: s.dependency, durationDays: s.durationDays, status: "locked" })), start);
  return plan.phases.p.days;
}

function TemplateEditor() {
  const { state, setConfig } = useRq();
  const [tpl, setTpl] = useState<PhaseTpl[]>(() => structuredClone(state.template));
  const upd = (pi: number, fn: (p: PhaseTpl) => void) => setTpl((t) => { const n = structuredClone(t); fn(n[pi]); return n; });
  const move = (pi: number, si: number, d: -1 | 1) => upd(pi, (x) => { const j = si + d; if (j < 0 || j >= x.steps.length) return; [x.steps[si], x.steps[j]] = [x.steps[j], x.steps[si]]; });

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start gap-2 rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
        <Info className="h-4 w-4 shrink-0 mt-0.5" />
        Zorunlu olmayan bir adıma bağlı adım, o adım tamamlanmadan veya Kapsam dışı yapılmadan açılmaz.
      </div>
      <Accordion type="multiple">
        {tpl.map((p, pi) => (
          <AccordionItem key={p.code} value={p.code}>
            <AccordionTrigger>{p.code} — {p.name} <span className="ml-auto mr-2 text-xs text-muted-foreground">{p.steps.length} adım · ≈ {p.code === "05" ? "takıma göre" : `${templateDays(p)} iş günü`}</span></AccordionTrigger>
            <AccordionContent className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <Input value={p.name} onChange={(e) => upd(pi, (x) => { x.name = e.target.value; })} className="max-w-xs" aria-label="Aşama adı" />
                <Label className="text-xs">Başlangıç</Label>
                {pi === 0 ? <span className="text-xs text-muted-foreground">Proje açılışında başlar</span> : (
                  <Select value={p.dependency} onValueChange={(v) => upd(pi, (x) => { x.dependency = v as Dependency; })}>
                    <SelectTrigger className="w-72"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="previous">Önceki aşama tamamlanınca</SelectItem>
                      <SelectItem value="independent">Bağımsız (proje açılışında başlar)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              {p.code === "05" && <p className="text-xs text-muted-foreground">Takım başına 5 adım: ilk adım bağımsız, diğerleri sıralı; süreler 2-2-3-3-3 iş günü.</p>}
              {p.steps.length > 0 && <p className="text-xs text-muted-foreground">İlk adımda "Önceki adım tamamlanınca" = aşama başlayınca açılır.</p>}
              {p.steps.map((s, si) => {
                const prev = p.steps[si - 1];
                const warn = s.dependency === "previous" && prev && !prev.required;
                return (
                  <div key={si} className="flex flex-wrap items-center gap-2">
                    <span className="w-5 text-center font-mono text-muted-foreground" title={s.dependency === "previous" ? "Önceki adım tamamlanınca açılır" : "Aşama başlayınca açılır"}>{s.dependency === "previous" ? "↳" : "∥"}</span>
                    {warn ? <span title="Zorunlu olmayan bir adıma bağlı"><AlertTriangle className="h-4 w-4 text-warning" /></span> : <span className="w-4" />}
                    <Input className="flex-1 min-w-48" value={s.title} onChange={(e) => upd(pi, (x) => { x.steps[si].title = e.target.value; })} />
                    <Select value={s.ball} onValueChange={(v) => upd(pi, (x) => { x.steps[si].ball = v as Ball; })}>
                      <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>{(Object.keys(BALL_LABEL) as Ball[]).map((b) => <SelectItem key={b} value={b}>{BALL_LABEL[b]}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={s.dependency} onValueChange={(v) => upd(pi, (x) => { x.steps[si].dependency = v as Dependency; })}>
                      <SelectTrigger className="w-52" aria-label="Başlangıç"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="previous">Önceki adım tamamlanınca</SelectItem>
                        <SelectItem value="independent">Bağımsız</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input type="number" min={1} max={60} className="w-20" aria-label="Süre (iş günü)" title="Süre (iş günü)" value={s.durationDays}
                      onChange={(e) => upd(pi, (x) => { x.steps[si].durationDays = Math.max(1, Math.min(60, Number(e.target.value) || 1)); })} />
                    <span className="text-xs text-muted-foreground">iş günü</span>
                    <label className="flex items-center gap-1 text-xs whitespace-nowrap"><Checkbox checked={s.required} onCheckedChange={(c) => upd(pi, (x) => { x.steps[si].required = !!c; })} />Zorunlu</label>
                    <Pill tone="muted">{completionText(s)}</Pill>
                    <Button variant="ghost" size="icon" disabled={si === 0} aria-label="Yukarı taşı" onClick={() => move(pi, si, -1)}><ArrowUp className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" disabled={si === p.steps.length - 1} aria-label="Aşağı taşı" onClick={() => move(pi, si, 1)}><ArrowDown className="h-4 w-4" /></Button>
                    <Button
                      variant="ghost" size="icon"
                      disabled={(s.completion && s.completion !== "manual") || !!s.key}
                      title={s.completion && s.completion !== "manual" ? "Sistem adımı — veriyle tamamlanır" : s.key ? "Otomatik kurala bağlı adım silinemez" : "Sil"}
                      onClick={() => upd(pi, (x) => { x.steps.splice(si, 1); })}
                    ><Trash2 className="h-4 w-4" /></Button>
                  </div>
                );
              })}
              {p.code !== "05" && <Button variant="outline" size="sm" onClick={() => upd(pi, (x) => { x.steps.push({ title: "Yeni adım", ball: "csm", required: false, dependency: "previous", durationDays: 2, completion: "manual" }); })}><Plus className="h-4 w-4 mr-1" />Adım ekle</Button>}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <Button onClick={() => { setConfig("template", tpl, "Aşama/adım şablonu güncellendi"); toast.success("Şablon kaydedildi"); }}>Şablonu kaydet</Button>
    </Card>
  );
}

function ModulesEditor() {
  const { state, setConfig } = useRq();
  const [name, setName] = useState("");
  const add = () => {
    const n = name.trim();
    if (!n || state.modules.includes(n)) return toast.error("Geçerli ve benzersiz bir modül adı girin");
    setConfig("modules", [...state.modules, n], `Modül eklendi: ${n}`); setName(""); toast.success("Modül eklendi");
  };
  return (
    <Card className="p-4 space-y-3">
      <div className="flex gap-2 max-w-md"><Input placeholder="Modül adı" value={name} onChange={(e) => setName(e.target.value)} /><Button onClick={add}><Plus className="h-4 w-4 mr-1" />Ekle</Button></div>
      <div className="grid gap-2 sm:grid-cols-3">{state.modules.map((m) => {
        const used = state.projects.some((p) => p.purchasedModules.includes(m) || p.desiredModules.includes(m));
        return (
          <div key={m} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
            {m}
            <Button variant="ghost" size="icon" disabled={used} title={used ? "Projelerde kullanılıyor" : "Sil"} onClick={() => setConfig("modules", state.modules.filter((x) => x !== m), `Modül silindi: ${m}`)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        );
      })}</div>
    </Card>
  );
}

function QuestionsEditor() {
  const { state, setConfig } = useRq();
  const [qs, setQs] = useState(() => structuredClone(state.questions).sort((a, b) => a.order - b.order));
  const set = (i: number, patch: Partial<(typeof qs)[number]>) => setQs((q) => q.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const move = (i: number, d: -1 | 1) => setQs((q) => { const j = i + d; if (j < 0 || j >= q.length) return q; const n = [...q]; [n[i], n[j]] = [n[j], n[i]]; return n; });
  return (
    <Card className="p-4 space-y-3">
      {qs.length === 0 && <p className="text-sm text-muted-foreground">Keşif sorusu yok.</p>}
      {qs.map((q, i) => (
        <div key={q.id} className="flex flex-wrap items-center gap-2">
          <Input className="w-48" value={q.group} onChange={(e) => set(i, { group: e.target.value })} aria-label="Grup" />
          <Input className="flex-1 min-w-48" value={q.text} onChange={(e) => set(i, { text: e.target.value })} aria-label="Soru" />
          <Select value={q.type ?? "text"} onValueChange={(v) => set(i, { type: v as "text" | "modules" })}>
            <SelectTrigger className="w-48" aria-label="Tip"><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(QUESTION_TYPE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
          </Select>
          <label className="flex items-center gap-1 text-xs whitespace-nowrap"><Checkbox checked={q.required} onCheckedChange={(c) => set(i, { required: !!c })} />Zorunlu</label>
          <Button variant="ghost" size="icon" disabled={i === 0} aria-label="Yukarı taşı" onClick={() => move(i, -1)}><ArrowUp className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" disabled={i === qs.length - 1} aria-label="Aşağı taşı" onClick={() => move(i, 1)}><ArrowDown className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" aria-label="Sil" onClick={() => setQs((x) => x.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
        </div>
      ))}
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setQs((x) => [...x, { id: uid("q"), group: "Diğer", text: "Yeni soru", required: false, type: "text", order: x.length }])}><Plus className="h-4 w-4 mr-1" />Soru ekle</Button>
        <Button onClick={() => { setConfig("questions", qs.filter((q) => q.text.trim()).map((q, i) => ({ ...q, order: i })), "Keşif soruları güncellendi"); toast.success("Sorular kaydedildi"); }}>Kaydet</Button>
      </div>
    </Card>
  );
}
