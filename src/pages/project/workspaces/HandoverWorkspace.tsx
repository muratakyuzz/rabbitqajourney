import { useState } from "react";
import { Link } from "react-router";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pill, StepStatusBadge } from "@/components/rq/Badges";
import { personName, useRq } from "@/lib/rabbitqa/store";
import { selectableCsms } from "@/lib/rabbitqa/perm";
import { ACTION_STATUS_LABEL, COMMIT_STATUS_LABEL, INSTALL_LABEL, LLM_LABEL, fmtDate } from "@/lib/rabbitqa/labels";
import type { Commitment, CommitmentStatus, InstallType, LlmChoice } from "@/lib/rabbitqa/types";
import { DocumentUploadDialog } from "../Phase2Tabs";
import { MeetingStepSection } from "./MeetingStepSection";
import type { WorkspaceProps } from "./index";

const NONE = "__none";

function StepMini({ phase, stepKey }: { phase: WorkspaceProps["phase"]; stepKey: string }) {
  const { state } = useRq();
  const step = state.steps.find((s) => s.phaseId === phase.id && s.key === stepKey);
  if (!step) return null;
  return <span className="inline-flex items-center gap-1.5 ml-auto"><StepStatusBadge status={step.status} />{step.due && <span className="text-xs text-muted-foreground">{fmtDate(step.due)}</span>}</span>;
}

function ChoiceReasonDialog({ title, onCancel, onSave }: { title: string; onCancel: () => void; onSave: (reason: string) => void }) {
  const [reason, setReason] = useState("");
  return (
    <Dialog open onOpenChange={(o) => !o && onCancel()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="choice-reason-dialog-reason">Gerekçe (zorunlu)</Label>
            <Textarea id="choice-reason-dialog-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <p className="text-xs text-muted-foreground">Eski adımlar silinmez, "Kapsam dışı" yapılır; yeni adım ve aksiyonlar açılır.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Vazgeç</Button>
          <Button disabled={!reason.trim()} onClick={() => onSave(reason.trim())}>Kaydet</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function HandoverWorkspace({ project, phase, readOnly, csmEditable }: WorkspaceProps) {
  const { state, updateProject, setInstallChoice, addCommitment, updateCommitment, setNoCommitments } = useRq();
  const [text, setText] = useState("");
  const [phaseCode, setPhaseCode] = useState("07");
  const [editC, setEditC] = useState<Commitment | null>(null);
  const [reasonDialog, setReasonDialog] = useState<{ field: "installType" | "llmChoice"; value: InstallType | LlmChoice } | null>(null);
  const [docDialog, setDocDialog] = useState<"offer" | "contract" | null>(null);

  const commitments = state.commitments.filter((c) => c.projectId === project.id);
  const phases = state.phases.filter((p) => p.projectId === project.id).sort((a, b) => a.order - b.order);
  const ruleActions = state.actions.filter((a) => a.projectId === project.id && a.source === "rule" && !a.ruleKey?.startsWith("rule_review:"));
  const offerStep = state.steps.find((s) => s.phaseId === phase.id && s.key === "offer");
  const contractStep = state.steps.find((s) => s.phaseId === phase.id && s.key === "contract");
  const offerDoc = state.documents.filter((d) => d.projectId === project.id && d.type === "offer").sort((a, b) => b.addedAt.localeCompare(a.addedAt))[0];
  const contractDoc = state.documents.filter((d) => d.projectId === project.id && d.type === "contract").sort((a, b) => b.addedAt.localeCompare(a.addedAt))[0];

  const saveInstallChoice = (field: "installType" | "llmChoice", value: InstallType | LlmChoice, reason?: string) => {
    const { error, summary } = setInstallChoice(project.id, { [field]: value } as Partial<Pick<typeof project, "installType" | "llmChoice">>, reason);
    if (error) return toast.error(error);
    toast.success(field === "installType" ? "Kurulum tipi kaydedildi" : "LLM tercihi kaydedildi", {
      description: summary ? <>{summary}. <Link className="underline" to={`/app/projects/${project.id}?tab=history`}>Müşteri geçmişinde gör</Link></> : undefined,
      duration: summary ? 8000 : undefined,
    });
  };

  const onChoiceChange = (field: "installType" | "llmChoice", value: InstallType | LlmChoice | null) => {
    const current = project[field];
    if (current === null) { if (value !== null) saveInstallChoice(field, value); return; }
    if (value === null) return; // disabled in UI; defensive no-op
    if (value === current) return;
    setReasonDialog({ field, value });
  };

  return (
    <div className="space-y-6">
      {/* a) Devir */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">Devir</h3>
        </div>
        <div className="grid gap-3">
          <div data-field="csmId" className="grid gap-2">
            <div className="flex items-center"><Label>{csmEditable ? "CSM" : "CSM (Manager atar)"}</Label><StepMini phase={phase} stepKey="csm" /></div>
            <Select value={project.csmId ?? NONE} disabled={readOnly || !csmEditable} onValueChange={(v) => updateProject(project.id, { csmId: v === NONE ? null : v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Atanmadı</SelectItem>
                {selectableCsms(state, project.csmId).map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div data-field="salespersonId" className="grid gap-2">
            <div className="flex items-center"><Label>Devir alınan satışçı</Label><StepMini phase={phase} stepKey="sales_license" /></div>
            <Select value={project.salespersonId ?? NONE} disabled={readOnly} onValueChange={(v) => updateProject(project.id, { salespersonId: v === NONE ? null : v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Seçilmedi</SelectItem>
                {state.salespeople.filter((s) => s.active !== false || s.id === project.salespersonId).map((s) => <SelectItem key={s.id} value={s.id} disabled={s.active === false}>{s.name}{s.active === false ? " (pasif)" : ""}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div data-field="licenseModel" className="grid gap-2">
            <Label htmlFor="hw-licenseModel">Lisans modeli</Label>
            <Input id="hw-licenseModel" defaultValue={project.licenseModel} disabled={readOnly} onBlur={(e) => updateProject(project.id, { licenseModel: e.target.value })} />
          </div>
          <div data-field="purchasedModules" className="grid gap-2">
            <div className="flex items-center"><Label>Satın alınan modüller</Label><StepMini phase={phase} stepKey="modules" /></div>
            <div className="grid grid-cols-3 gap-2">
              {state.modules.map((m) => (
                <label key={m} className="flex items-center gap-2 text-sm">
                  <Checkbox disabled={readOnly} checked={project.purchasedModules.includes(m)}
                    onCheckedChange={(c) => updateProject(project.id, { purchasedModules: c ? [...project.purchasedModules, m] : project.purchasedModules.filter((x) => x !== m) })} />
                  {m}
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* b) Kurulum ve LLM */}
      <section className="space-y-3 border-t pt-4">
        <div className="flex items-center"><h3 className="text-sm font-semibold">Kurulum ve LLM</h3><StepMini phase={phase} stepKey="install_llm" /></div>
        <div data-field="installType" className="space-y-2">
          <Label>Kurulum tipi</Label>
          <RadioGroup value={project.installType ?? NONE} disabled={readOnly} onValueChange={(v) => onChoiceChange("installType", v === NONE ? null : v as InstallType)} className="flex gap-6">
            {(Object.keys(INSTALL_LABEL) as InstallType[]).map((k) => (
              <label key={k} className="flex items-center gap-2 text-sm"><RadioGroupItem value={k} />{INSTALL_LABEL[k]}</label>
            ))}
            <label className="flex items-center gap-2 text-sm"><RadioGroupItem value={NONE} disabled={project.installType !== null} />Henüz belli değil</label>
          </RadioGroup>
        </div>
        <div data-field="llmChoice" className="space-y-2">
          <Label>LLM tercihi</Label>
          <RadioGroup value={project.llmChoice ?? NONE} disabled={readOnly} onValueChange={(v) => onChoiceChange("llmChoice", v === NONE ? null : v as LlmChoice)} className="grid gap-2">
            {(Object.keys(LLM_LABEL) as LlmChoice[]).map((k) => (
              <label key={k} className="flex items-center gap-2 text-sm"><RadioGroupItem value={k} />{LLM_LABEL[k]}</label>
            ))}
            <label className="flex items-center gap-2 text-sm"><RadioGroupItem value={NONE} disabled={project.llmChoice !== null} />Henüz belli değil</label>
          </RadioGroup>
        </div>
        <div className="rounded-lg border p-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Bu seçimlere bağlı otomatik aksiyonlar</p>
          {ruleActions.length === 0 && <p className="text-sm text-muted-foreground">Otomatik aksiyon yok.</p>}
          {ruleActions.map((a) => (
            <div key={a.id} className="text-sm">
              <span className={a.status === "cancelled" ? "line-through text-muted-foreground" : ""}>{a.title}</span>
              <span className="text-xs text-muted-foreground ml-2">{personName(state, a.ownerId)} · {ACTION_STATUS_LABEL[a.status]}</span>
            </div>
          ))}
        </div>
      </section>

      {/* c) Sözler ve taahhütler */}
      <section data-field="commitments" className="space-y-3 border-t pt-4">
        <div className="flex items-center"><h3 className="text-sm font-semibold">Sözler ve taahhütler</h3><StepMini phase={phase} stepKey="commitments" /></div>
        {commitments.length === 0 && <p className="text-sm text-muted-foreground">Taahhüt girilmedi.</p>}
        {commitments.map((c) => (
          <div key={c.id} className="rounded-lg border p-3 flex items-start gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium">{c.text}</p>
              <p className="text-xs text-muted-foreground">Hedef aşama: {phases.find((p) => p.code === c.targetPhaseCode)?.name ?? c.targetPhaseCode}{c.note ? ` · ${c.note}` : ""}</p>
            </div>
            <Pill tone={c.status === "met" ? "success" : c.status === "unmet" ? "danger" : "warning"}>
              {COMMIT_STATUS_LABEL[c.status]}
            </Pill>
            {!readOnly && <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditC(c)} aria-label="Taahhüdü düzenle"><Pencil className="h-3.5 w-3.5" /></Button>}
          </div>
        ))}
        {!readOnly && (
          <div className="flex gap-2 pt-2 border-t">
            <Input placeholder="Yeni taahhüt" value={text} onChange={(e) => setText(e.target.value)} />
            <Select value={phaseCode} onValueChange={setPhaseCode}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>{phases.map((p) => <SelectItem key={p.code} value={p.code}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
            <Button onClick={() => {
              if (!text.trim()) return;
              addCommitment({ projectId: project.id, text: text.trim(), targetPhaseCode: phaseCode, status: "open", note: "" });
              setText("");
            }}>Ekle</Button>
          </div>
        )}
        {!readOnly && (
          <label className="flex items-center gap-3 text-sm border-t pt-3" title={commitments.length > 0 ? "Taahhüt varken işaretlenemez" : undefined}>
            <Checkbox checked={project.noCommitments} disabled={commitments.length > 0} onCheckedChange={(c) => {
              const err = setNoCommitments(project.id, !!c);
              if (err) toast.error(err);
            }} />
            Taahhüt yok
          </label>
        )}
      </section>

      {/* d) Dokümanlar */}
      <section className="space-y-3 border-t pt-4">
        <h3 className="text-sm font-semibold">Dokümanlar</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div data-field="doc:offer" className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center"><p className="text-sm font-medium">Teklif</p><StepMini phase={phase} stepKey="offer" /></div>
            {offerDoc ? (
              <>
                <p className="text-sm">{offerDoc.name}</p>
                <p className="text-xs text-muted-foreground">{fmtDate(offerDoc.addedAt)}</p>
                <Link className="text-xs text-primary hover:underline" to={`/app/projects/${project.id}?tab=documents`}>Dokümanlar'da gör</Link>
              </>
            ) : readOnly ? <p className="text-sm text-muted-foreground">Yüklenmedi</p> : (
              <Button size="sm" variant="outline" onClick={() => setDocDialog("offer")}>Yükle</Button>
            )}
          </div>
          <div data-field="doc:contract" className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center"><p className="text-sm font-medium">Sözleşme</p><StepMini phase={phase} stepKey="contract" /></div>
            {contractDoc ? (
              <>
                <p className="text-sm">{contractDoc.name}</p>
                <p className="text-xs text-muted-foreground">{fmtDate(contractDoc.addedAt)}</p>
                <Link className="text-xs text-primary hover:underline" to={`/app/projects/${project.id}?tab=documents`}>Dokümanlar'da gör</Link>
              </>
            ) : readOnly ? <p className="text-sm text-muted-foreground">Yüklenmedi</p> : (
              <Button size="sm" variant="outline" onClick={() => setDocDialog("contract")}>Yükle</Button>
            )}
          </div>
        </div>
      </section>

      {/* e) Satış devri toplantısı */}
      <div className="border-t pt-4">
        <MeetingStepSection project={project} stepKey="brief" type="brief" title="Satış devri toplantısı" readOnly={readOnly} />
      </div>

      {editC && (
        <CommitmentEditDialog c={editC} onClose={() => setEditC(null)} onSave={(p, r) => updateCommitment(editC.id, p, r)} />
      )}
      {reasonDialog && (
        <ChoiceReasonDialog
          title={reasonDialog.field === "installType" ? "Kurulum tipi değişikliği" : "LLM tercihi değişikliği"}
          onCancel={() => setReasonDialog(null)}
          onSave={(reason) => { saveInstallChoice(reasonDialog.field, reasonDialog.value, reason); setReasonDialog(null); }}
        />
      )}
      {docDialog && (
        <DocumentUploadDialog
          project={project}
          lockedType={docDialog}
          defaultLink={{ linkType: "step", linkId: (docDialog === "offer" ? offerStep : contractStep)?.id ?? null }}
          onClose={() => setDocDialog(null)}
        />
      )}
    </div>
  );
}

function CommitmentEditDialog({ c, onClose, onSave }: { c: Commitment; onClose: () => void; onSave: (p: Partial<Commitment>, reason?: string) => void }) {
  const [status, setStatus] = useState<CommitmentStatus>(c.status);
  const [note, setNote] = useState(c.note);
  const [reason, setReason] = useState("");
  const needsReason = status !== c.status;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{c.text}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label>Durum</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as CommitmentStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{(Object.keys(COMMIT_STATUS_LABEL) as CommitmentStatus[]).map((k) => <SelectItem key={k} value={k}>{COMMIT_STATUS_LABEL[k]}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-2"><Label>Not</Label><Textarea value={note} onChange={(e) => setNote(e.target.value)} /></div>
          {needsReason && <div className="grid gap-2"><Label>Gerekçe (zorunlu)</Label><Textarea value={reason} onChange={(e) => setReason(e.target.value)} /></div>}
        </div>
        <DialogFooter>
          <Button onClick={() => {
            if (needsReason && !reason.trim()) return toast.error("Gerekçe zorunlu");
            onSave({ status, note }, reason.trim() || undefined);
            onClose();
          }}>Kaydet</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
