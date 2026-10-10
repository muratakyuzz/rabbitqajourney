import { useState } from "react";
import { AlertTriangle, ArrowDown, ArrowUp, Info, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Pill } from "@/components/rq/Badges";
import { useRq } from "@/lib/rabbitqa/store";
import { ApiError, apiErrorMessage } from "@/lib/api";
import { fetchTemplate, saveTemplate } from "@/lib/api/template";
import { projectPlan } from "@rabbitqa/shared/domain/flow";
import { conditionFor } from "@rabbitqa/shared/domain/completion";
import { BALL_LABEL, COMPLETION_LABEL, MEETING_TYPE_LABEL, fmtDateTime } from "@rabbitqa/shared/domain/labels";
import type { Ball, Dependency, PhaseTpl, StepTpl } from "@rabbitqa/shared/domain/types";

function completionText(s: StepTpl) {
  const c = s.completion ?? "manual";
  if (c === "manual") return COMPLETION_LABEL.manual;
  if (c === "data") return `${COMPLETION_LABEL.data}: ${s.key ? conditionFor(s.key)?.label ?? s.key : ""}`;
  return `${COMPLETION_LABEL.meeting}: ${s.meetingType ? MEETING_TYPE_LABEL[s.meetingType] : ""}`;
}

function templateDays(p: PhaseTpl) {
  const start = "2026-01-05";
  const plan = projectPlan([{ id: "p", order: 0, dependency: "independent" }], p.steps.map((s, i) => ({ id: String(i), phaseId: "p", order: i, dependency: s.dependency, durationDays: s.durationDays, status: "locked" })), start);
  return plan.phases.p.days;
}

/** Saves to the API as a new template version (docs/PLAN.md M1). Remount it (key = version) to drop local edits. */
export function TemplateEditor() {
  const { state, templateVersion, applyTemplateVersion } = useRq();
  const [tpl, setTpl] = useState<PhaseTpl[]>(() => structuredClone(state.template));
  const [saving, setSaving] = useState(false);
  const upd = (pi: number, fn: (p: PhaseTpl) => void) => setTpl((t) => { const n = structuredClone(t); fn(n[pi]); return n; });
  const move = (pi: number, si: number, d: -1 | 1) => upd(pi, (x) => { const j = si + d; if (j < 0 || j >= x.steps.length) return; [x.steps[si], x.steps[j]] = [x.steps[j], x.steps[si]]; });

  const reload = () => fetchTemplate().then(applyTemplateVersion, (e: unknown) => toast.error(apiErrorMessage(e)));

  const save = async () => {
    if (!templateVersion) return;
    setSaving(true);
    try {
      const tv = await saveTemplate(templateVersion.version, tpl);
      applyTemplateVersion(tv);
      toast.success(`Şablon kaydedildi · sürüm ${tv.version}`);
    } catch (e) {
      const versionConflict = e instanceof ApiError && e.status === 409 && e.field === "baseVersion";
      toast.error(apiErrorMessage(e), versionConflict ? { action: { label: "Yenile", onClick: () => void reload() } } : undefined);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-4 space-y-3">
      <p className="text-sm text-muted-foreground" data-testid="template-version">
        {templateVersion
          ? `Sürüm ${templateVersion.version} · ${fmtDateTime(templateVersion.createdAt)} · yalnızca yeni projeler etkilenir`
          : "Sunucuya ulaşılamadı; şablon yalnızca görüntüleniyor ve kaydedilemez."}
      </p>
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
              {p.code === "05" && <p className="text-xs text-muted-foreground">Takım başına tek adım (bağımsız, 10 iş günü) ve 5 maddelik kontrol listesi. Takım yoksa genel "Uyarlama" adımı.</p>}
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
      <Button onClick={() => void save()} disabled={!templateVersion || saving}>{saving ? "Kaydediliyor…" : "Şablonu kaydet"}</Button>
    </Card>
  );
}
