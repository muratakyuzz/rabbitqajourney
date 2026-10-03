import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ChevronDown, ExternalLink, Mail, MessageSquare, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pill } from "@/components/rq/Badges";
import { useAuth } from "@/lib/auth-context";
import { canReviewInsight } from "@/lib/rabbitqa/perm";
import { personName, useRq } from "@/lib/rabbitqa/store";
import { effectiveStatus } from "@/lib/rabbitqa/ai-mock";
import {
  ACTION_STATUS_LABEL, BALL_LABEL, HEALTH_LABEL, INSIGHT_KIND_LABEL, INSIGHT_SOURCE_LABEL, INSIGHT_STATUS_LABEL, PRIORITY_LABEL, STEP_STATUS_LABEL, fmtDate, fmtDateTime,
} from "@/lib/rabbitqa/labels";
import type { AiInsight, InsightKind, RqState } from "@/lib/rabbitqa/types";

const FIELD_LABEL: Record<string, string> = { status: "Durum", due: "Termin", health: "Sağlık", goLiveDate: "Go-Live", planEnd: "Plan bitiş", ownerId: "Sahip", priority: "Öncelik" };

function fmtVal(state: RqState, k: string, v: unknown) {
  if (v === null || v === undefined || v === "") return "—";
  const s = String(v);
  if (k === "status") return (ACTION_STATUS_LABEL as Record<string, string>)[s] ?? (STEP_STATUS_LABEL as Record<string, string>)[s] ?? s;
  if (k === "health") return (HEALTH_LABEL as Record<string, string>)[s] ?? s;
  if (k === "ownerId") return personName(state, s);
  if (k === "priority") return (PRIORITY_LABEL as Record<string, string>)[s] ?? s;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return fmtDate(s);
  return s;
}

export function targetLabel(state: RqState, i: AiInsight) {
  if (!i.targetId) return "";
  return state.actions.find((a) => a.id === i.targetId)?.title ?? state.steps.find((s) => s.id === i.targetId)?.title ?? state.phases.find((p) => p.id === i.targetId)?.name ?? "";
}

export function insightSummary(state: RqState, i: AiInsight) {
  const p = i.proposed as Record<string, any>;
  switch (i.kind) {
    case "action_create": return `Yeni aksiyon: ${p.title}${p.ownerId ? ` — Sahip: ${personName(state, p.ownerId)}` : ""}${p.due ? ` — Termin ${fmtDate(p.due)}` : ""}`;
    case "action_update": return `Aksiyon güncelleme: ${targetLabel(state, i) || "—"}`;
    case "step_update": return `Adım durumu: ${targetLabel(state, i) || "—"}`;
    case "risk_create": return `Yeni risk: ${p.title}`;
    case "decision_create": return `Yeni karar: ${p.title}`;
    case "health_change": return `Sağlık değişikliği: ${fmtVal(state, "health", p.health)}`;
    case "date_change": return p.phaseId ? `Aşama plan bitişi: ${fmtDate(p.planEnd)}` : `Go-Live tarihi: ${fmtDate(p.goLiveDate)}`;
  }
}

/** Hedef kayıt öneriden sonra değişti mi? */
export function targetChanged(state: RqState, i: AiInsight) {
  if (!i.current || !i.targetId) return false;
  const t: Record<string, unknown> | undefined =
    (state.actions.find((a) => a.id === i.targetId) as any) ?? (state.steps.find((s) => s.id === i.targetId) as any) ??
    (state.phases.find((p) => p.id === i.targetId) as any) ?? (state.projects.find((p) => p.id === i.targetId) as any);
  if (!t) return true;
  return Object.entries(i.current).some(([k, v]) => String(t[k] ?? "") !== String(v ?? ""));
}

const confTone = (c: number) => (c >= 80 ? "success" : c >= 60 ? "warning" : "muted") as const;
const statusTone = { pending: "info", approved: "success", rejected: "danger", expired: "muted" } as const;

export function SourceIcon({ source, className = "h-4 w-4" }: { source: AiInsight["source"]; className?: string }) {
  return source === "teams" ? <MessageSquare className={className} /> : <Mail className={className} />;
}

export function InsightCard({ insight: i, showProject = true, onDone }: { insight: AiInsight; showProject?: boolean; onDone?: () => void }) {
  const { state, approveInsight } = useRq();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState<null | "confirm" | "edit" | "reject">(null);
  const status = effectiveStatus(state, i);
  const canReview = status === "pending" && canReviewInsight(state, user, i);
  const project = state.projects.find((p) => p.id === i.projectId);
  const diffs = i.current ? Object.keys(i.proposed).filter((k) => k in (i.current ?? {})) : [];
  const changed = status === "pending" && targetChanged(state, i);

  const quickApprove = () => {
    if (changed || i.kind === "health_change" || i.kind === "date_change") return setDialog("confirm");
    const err = approveInsight(i.id);
    if (err) return toast.error(err);
    toast.success("Öneri onaylandı ve uygulandı");
    onDone?.();
  };

  return (
    <Card className="p-4 space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <span className="mt-0.5 text-primary"><SourceIcon source={i.source} /></span>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{i.sourceRef.title}</p>
            <p className="text-xs text-muted-foreground">
              {i.sourceRef.from} · {fmtDateTime(i.sourceRef.at)}
              {i.sourceRef.direction && ` · ${i.sourceRef.direction === "in" ? "Gelen" : "Giden"}`}
              {showProject && project && <> · <Link to={`/app/projects/${project.id}`} className="hover:underline">{project.customerName}</Link></>}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Pill tone="info">{INSIGHT_KIND_LABEL[i.kind]}</Pill>
          <Pill tone={confTone(i.confidence)}>%{i.confidence} güven</Pill>
          {status !== "pending" && <Pill tone={statusTone[status]}>{INSIGHT_STATUS_LABEL[status]}</Pill>}
        </div>
      </div>
      <p className="text-sm font-medium">{insightSummary(state, i)}</p>
      {diffs.length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs">
          {diffs.map((k) => (
            <span key={k} className="rounded-md border bg-muted/40 px-2 py-0.5">{FIELD_LABEL[k] ?? k}: {fmtVal(state, k, i.current?.[k])} → <b>{fmtVal(state, k, i.proposed[k])}</b></span>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground"><Sparkles className="inline h-3 w-3 mr-1" />{i.rationale}</p>
      <button className="text-xs text-primary inline-flex items-center gap-1" onClick={() => setOpen(!open)}>
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />Kaynağı göster
      </button>
      {open && (
        <div className="rounded-md border-l-2 border-primary/50 bg-muted/40 px-3 py-2 text-sm whitespace-pre-line">
          “{i.sourceRef.excerpt}”
          {i.sourceRef.link && i.sourceRef.link !== "#" && (
            <a href={i.sourceRef.link} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1 text-xs text-primary"><ExternalLink className="h-3 w-3" />Orijinal mesaj</a>
          )}
        </div>
      )}
      {changed && <p className="text-xs text-warning-foreground flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" />Bu kayıt öneriden sonra değişti.</p>}
      {status !== "pending" && i.reviewedBy && (
        <p className="text-xs text-muted-foreground">
          {personName(state, i.reviewedBy)} · {i.reviewedAt ? fmtDateTime(i.reviewedAt) : ""}{i.reviewNote && ` · Not: ${i.reviewNote}`}
          {i.appliedEntityId && project && <> · <Link to={`/app/projects/${project.id}`} className="text-primary hover:underline">Uygulanan kayda git</Link></>}
        </p>
      )}
      {canReview && (
        <div className="flex flex-wrap gap-2 pt-1">
          <Button size="sm" onClick={quickApprove}>Onayla</Button>
          <Button size="sm" variant="outline" onClick={() => setDialog("edit")}>Düzenle ve onayla</Button>
          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDialog("reject")}>Reddet</Button>
        </div>
      )}
      {(dialog === "confirm" || dialog === "edit") && <ApproveDialog insight={i} edit={dialog === "edit"} changed={changed} onClose={() => setDialog(null)} onDone={onDone} />}
      {dialog === "reject" && <RejectDialog ids={[i.id]} onClose={() => setDialog(null)} onDone={onDone} />}
    </Card>
  );
}

function ApproveDialog({ insight: i, edit, changed, onClose, onDone }: { insight: AiInsight; edit: boolean; changed: boolean; onClose: () => void; onDone?: () => void }) {
  const { state, approveInsight } = useRq();
  const [v, setV] = useState<Record<string, any>>({ ...i.proposed });
  const needsReason = i.kind === "health_change" || i.kind === "date_change";
  const [note, setNote] = useState(needsReason ? i.rationale : "");
  const set = (k: string, val: unknown) => setV((x) => ({ ...x, [k]: val }));
  const people = [...state.users.map((u) => ({ id: u.id, name: u.name })), ...state.contacts.filter((c) => c.projectId === i.projectId).map((c) => ({ id: c.id, name: `${c.name} (müşteri)` }))];
  const sel = (k: string, labels: Record<string, string>) => (
    <Select value={String(v[k] ?? "")} onValueChange={(x) => set(k, x)}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>{Object.entries(labels).map(([a, b]) => <SelectItem key={a} value={a}>{b}</SelectItem>)}</SelectContent>
    </Select>
  );
  const keys = Object.keys(i.proposed);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{edit ? "Düzenle ve onayla" : "Öneriyi onayla"}</DialogTitle></DialogHeader>
        {changed && <p className="rounded-md border border-warning/40 bg-warning/15 px-3 py-2 text-sm flex gap-2"><AlertTriangle className="h-4 w-4 shrink-0" />Bu kayıt öneriden sonra değişti. Yine de uygulayabilir veya reddedebilirsiniz.</p>}
        <p className="text-sm">{insightSummary(state, { ...i, proposed: v })}</p>
        {edit && (
          <div className="grid gap-3">
            {keys.includes("title") && <div className="grid gap-1.5"><Label>Başlık</Label><Input value={v.title ?? ""} onChange={(e) => set("title", e.target.value)} /></div>}
            {keys.includes("description") && <div className="grid gap-1.5"><Label>Açıklama</Label><Textarea value={v.description ?? ""} onChange={(e) => set("description", e.target.value)} /></div>}
            {keys.includes("ownerId") && (
              <div className="grid gap-1.5"><Label>Sahip</Label>
                <Select value={v.ownerId ?? "__none"} onValueChange={(x) => set("ownerId", x === "__none" ? null : x)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="__none">Atanmadı</SelectItem>{people.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              {keys.includes("ball") && <div className="grid gap-1.5"><Label>Top kimde</Label>{sel("ball", BALL_LABEL)}</div>}
              {keys.includes("priority") && <div className="grid gap-1.5"><Label>Öncelik</Label>{sel("priority", PRIORITY_LABEL)}</div>}
              {keys.includes("impact") && <div className="grid gap-1.5"><Label>Etki</Label>{sel("impact", PRIORITY_LABEL)}</div>}
              {keys.includes("due") && <div className="grid gap-1.5"><Label>Termin</Label><Input type="date" value={v.due ?? ""} onChange={(e) => set("due", e.target.value || null)} /></div>}
              {keys.includes("status") && <div className="grid gap-1.5"><Label>Durum</Label>{sel("status", i.kind === "step_update" ? STEP_STATUS_LABEL : ACTION_STATUS_LABEL)}</div>}
              {keys.includes("health") && <div className="grid gap-1.5"><Label>Sağlık</Label>{sel("health", HEALTH_LABEL)}</div>}
              {keys.includes("goLiveDate") && <div className="grid gap-1.5"><Label>Go-Live</Label><Input type="date" value={v.goLiveDate ?? ""} onChange={(e) => set("goLiveDate", e.target.value)} /></div>}
              {keys.includes("planEnd") && <div className="grid gap-1.5"><Label>Plan bitiş</Label><Input type="date" value={v.planEnd ?? ""} onChange={(e) => set("planEnd", e.target.value)} /></div>}
            </div>
            {keys.includes("healthReason") && <div className="grid gap-1.5"><Label>Sağlık açıklaması</Label><Textarea value={v.healthReason ?? ""} onChange={(e) => set("healthReason", e.target.value)} /></div>}
          </div>
        )}
        <div className="grid gap-1.5">
          <Label>{needsReason ? "Gerekçe (zorunlu)" : "Not (opsiyonel)"}</Label>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Vazgeç</Button>
          <Button onClick={() => {
            if (needsReason && !note.trim()) return toast.error("Gerekçe zorunlu");
            if (keys.includes("title") && !String(v.title ?? "").trim()) return toast.error("Başlık zorunlu");
            const err = approveInsight(i.id, edit ? v : undefined, note.trim() || undefined);
            if (err) return toast.error(err);
            toast.success("Öneri onaylandı ve uygulandı");
            onClose(); onDone?.();
          }}>Onayla ve uygula</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RejectDialog({ ids, onClose, onDone }: { ids: string[]; onClose: () => void; onDone?: () => void }) {
  const { rejectInsights } = useRq();
  const [note, setNote] = useState("");
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{ids.length > 1 ? `${ids.length} öneriyi reddet` : "Öneriyi reddet"}</DialogTitle></DialogHeader>
        <div className="grid gap-1.5"><Label>Not (opsiyonel)</Label><Textarea value={note} onChange={(e) => setNote(e.target.value)} /></div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Vazgeç</Button>
          <Button variant="destructive" onClick={() => { rejectInsights(ids, note.trim() || undefined); toast.success("Reddedildi"); onClose(); onDone?.(); }}>Reddet</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export interface InsightFilter { source: "all" | "teams" | "email"; project: string; kind: "all" | InsightKind }
export const DEFAULT_FILTER: InsightFilter = { source: "all", project: "all", kind: "all" };

export function applyFilter(list: AiInsight[], f: InsightFilter) {
  return list.filter((i) => (f.source === "all" || i.source === f.source) && (f.project === "all" || i.projectId === f.project) && (f.kind === "all" || i.kind === f.kind));
}

export function InsightFilters({ f, setF, projects }: { f: InsightFilter; setF: (f: InsightFilter) => void; projects: { id: string; customerName: string }[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Select value={f.source} onValueChange={(v) => setF({ ...f, source: v as InsightFilter["source"] })}>
        <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="all">Tüm kaynaklar</SelectItem>{Object.entries(INSIGHT_SOURCE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={f.project} onValueChange={(v) => setF({ ...f, project: v })}>
        <SelectTrigger className="w-44 h-9"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="all">Tüm projeler</SelectItem>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.customerName}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={f.kind} onValueChange={(v) => setF({ ...f, kind: v as InsightFilter["kind"] })}>
        <SelectTrigger className="w-44 h-9"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="all">Tüm türler</SelectItem>{Object.entries(INSIGHT_KIND_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}

export function SelectableInsight({ insight, checked, onCheck }: { insight: AiInsight; checked: boolean; onCheck: (c: boolean) => void }) {
  return (
    <div className="flex gap-2 items-start">
      <Checkbox className="mt-5" checked={checked} onCheckedChange={(c) => onCheck(!!c)} aria-label="Seç" />
      <div className="flex-1 min-w-0"><InsightCard insight={insight} /></div>
    </div>
  );
}
