import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Check, Pencil, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface DealQualification {
  closingDate: string | null;
  budget: boolean;
  authority: boolean;
  need: boolean;
  time: boolean;
  cra: boolean;
  craReason: string;
}

export const emptyDealQualification: DealQualification = {
  closingDate: null,
  budget: false,
  authority: false,
  need: false,
  time: false,
  cra: false,
  craReason: "",
};

interface Props {
  value: DealQualification;
  onChange: (next: DealQualification) => void;
  disabled?: boolean;
}

function forecastFromDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `Q${q} ${d.getFullYear()}`;
}

const ITEMS: Array<{ key: keyof Pick<DealQualification, "budget" | "authority" | "need" | "time">; letter: string; label: string }> = [
  { key: "budget", letter: "B", label: "Budget Confirmed" },
  { key: "authority", letter: "A", label: "Authority – Decision Maker Engaged" },
  { key: "need", letter: "N", label: "Need Confirmed" },
  { key: "time", letter: "T", label: "Time Confirmed" },
];

function calcScore(v: DealQualification): number {
  return (Number(v.budget) + Number(v.authority) + Number(v.need) + Number(v.time) + Number(v.cra)) * 20;
}

function scoreColor(score: number): string {
  if (score >= 80) return "from-emerald-500 to-emerald-400";
  if (score >= 40) return "from-amber-500 to-amber-400";
  return "from-rose-500 to-rose-400";
}

function Pill({ active, letter, label }: { active: boolean; letter: string; label: string }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 h-8 rounded-full px-3 text-xs font-medium transition-colors border",
        active
          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
          : "bg-muted text-muted-foreground border-transparent",
      )}
    >
      <span
        className={cn(
          "h-5 w-5 rounded-full inline-flex items-center justify-center text-[10px] font-bold",
          active ? "bg-emerald-500 text-white" : "bg-muted-foreground/20 text-muted-foreground",
        )}
      >
        {letter}
      </span>
      <span>{label}</span>
      {active ? <Check className="h-3 w-3" /> : <X className="h-3 w-3 opacity-60" />}
    </div>
  );
}

export function DealQualificationCard({ value, onChange, disabled = false }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DealQualification>(value);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  const score = calcScore(value);
  const draftScore = calcScore(draft);
  const forecast = forecastFromDate(value.closingDate);
  const draftForecast = forecastFromDate(draft.closingDate);

  const hasData = value.closingDate || score > 0 || value.craReason.trim().length > 0;

  const handleSave = () => {
    onChange(draft);
    setOpen(false);
  };

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-base font-semibold text-foreground">Deal Qualification</h3>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">BANT + CRA scoring</p>
        </div>
        {!disabled ? (
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
            <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
          </Button>
        ) : null}
      </div>

      <div className="mt-5">
        {!hasData ? (
          <div className="rounded-md border border-dashed bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
            Not qualified yet — click <span className="font-medium text-foreground">Edit</span> to add details.
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-md border bg-background/40 p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Closing Date</div>
                <div className="mt-1 text-sm font-medium text-foreground">
                  {value.closingDate ? format(new Date(value.closingDate), "PPP") : "—"}
                </div>
              </div>
              <div className="rounded-md border bg-background/40 p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Forecast</div>
                <div className="mt-1">
                  {forecast ? (
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-semibold text-primary">
                      {forecast}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Score</span>
                <span className="text-sm font-semibold text-foreground tabular-nums">{score}% / 100%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={cn("h-full rounded-full bg-gradient-to-r transition-all", scoreColor(score))}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {ITEMS.map((it) => (
                <Pill key={it.key} active={value[it.key]} letter={it.letter} label={it.label} />
              ))}
              <Pill active={value.cra} letter="CRA" label="Compelling Reason to Act" />
            </div>

            {value.craReason.trim().length > 0 ? (
              <div className="rounded-md border-l-4 border-primary bg-muted/30 px-4 py-3">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">CRA reason</div>
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{value.craReason}</p>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Deal Qualification
            </DialogTitle>
            <DialogDescription>Set closing date and score the BANT + CRA criteria.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Closing Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !draft.closingDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {draft.closingDate ? format(new Date(draft.closingDate), "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={draft.closingDate ? new Date(draft.closingDate) : undefined}
                      onSelect={(d) => setDraft((s) => ({ ...s, closingDate: d ? d.toISOString() : null }))}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5">
                <Label>Forecast</Label>
                <div className="h-10 flex items-center rounded-md border bg-muted/30 px-3">
                  {draftForecast ? (
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-semibold text-primary">
                      {draftForecast}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">Select a date</span>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">BANT criteria</Label>
                <span className="text-xs text-muted-foreground tabular-nums">{draftScore}%</span>
              </div>
              <div className="rounded-md border divide-y">
                {ITEMS.map((it) => (
                  <div key={it.key} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="h-7 w-7 shrink-0 rounded-full bg-primary/10 text-primary inline-flex items-center justify-center text-xs font-bold">
                        {it.letter}
                      </span>
                      <span className="text-sm text-foreground truncate">{it.label}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">20%</span>
                      <Switch
                        checked={draft[it.key]}
                        onCheckedChange={(checked) => setDraft((s) => ({ ...s, [it.key]: checked }))}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-md border bg-muted/20 p-3 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="h-7 w-7 shrink-0 rounded-full bg-primary text-primary-foreground inline-flex items-center justify-center text-[10px] font-bold">
                    CRA
                  </span>
                  <div>
                    <div className="text-sm font-medium text-foreground">Compelling Reason to Act</div>
                    <div className="text-xs text-muted-foreground">Confirmed</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">20%</span>
                  <Switch checked={draft.cra} onCheckedChange={(checked) => setDraft((s) => ({ ...s, cra: checked }))} />
                </div>
              </div>
              <Textarea
                value={draft.craReason}
                onChange={(e) => setDraft((s) => ({ ...s, craReason: e.target.value }))}
                rows={3}
                placeholder="Describe the compelling reason to act..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}