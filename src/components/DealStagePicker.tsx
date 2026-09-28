import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Search, ShieldCheck, FileText, Handshake, Trophy, XCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { DEAL_STAGES, type DealStage } from "@/lib/deal-payload";
import { fireDealWonConfetti } from "@/components/DealStageTracker";

const META: Record<DealStage, { num: string; icon: React.ComponentType<{ className?: string }>; cls: string; dot: string }> = {
  Identified:  { num: "01", icon: Search,      cls: "bg-slate-500/10 text-slate-600 border-slate-500/30 dark:text-slate-300",   dot: "bg-slate-500" },
  Qualified:   { num: "02", icon: ShieldCheck, cls: "bg-blue-500/10 text-blue-600 border-blue-500/30 dark:text-blue-300",       dot: "bg-blue-500" },
  Proposal:    { num: "03", icon: FileText,    cls: "bg-violet-500/10 text-violet-600 border-violet-500/30 dark:text-violet-300", dot: "bg-violet-500" },
  Negotiation: { num: "04", icon: Handshake,   cls: "bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-300",   dot: "bg-amber-500" },
  Won:         { num: "05", icon: Trophy,      cls: "bg-success/15 text-success border-success/40",                              dot: "bg-success" },
  Lost:        { num: "06", icon: XCircle,     cls: "bg-destructive/10 text-destructive border-destructive/30",                  dot: "bg-destructive" },
};

interface Props {
  value: DealStage;
  onChange?: (stage: DealStage) => void;
  disabled?: boolean;
  size?: "sm" | "md";
}

export function DealStagePicker({ value, onChange, disabled, size = "md" }: Props) {
  const [open, setOpen] = useState(false);
  const prevRef = useRef<DealStage>(value);

  useEffect(() => {
    if (prevRef.current !== "Won" && value === "Won") fireDealWonConfetti();
    prevRef.current = value;
  }, [value]);

  const m = META[value];
  const Icon = m.icon;

  return (
    <Popover open={open} onOpenChange={(o) => !disabled && setOpen(o)}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "group inline-flex items-center gap-2 rounded-full border font-medium transition-all",
            "shadow-sm hover:shadow-md",
            size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm",
            m.cls,
            disabled && "opacity-70 cursor-default",
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          <span className="font-mono opacity-70">{m.num}</span>
          <span>{value}</span>
          {!disabled && <ChevronDown className="h-3.5 w-3.5 opacity-60 transition-transform group-data-[state=open]:rotate-180" />}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-1.5">
        <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Change stage
        </div>
        <div className="space-y-0.5">
          {DEAL_STAGES.map((s) => {
            const sm = META[s];
            const SIcon = sm.icon;
            const active = s === value;
            return (
              <button
                key={s}
                type="button"
                onClick={() => {
                  onChange?.(s);
                  setOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-2.5 rounded-md px-2 py-2 text-sm text-left transition-colors",
                  active ? "bg-muted" : "hover:bg-muted/60",
                )}
              >
                <span className={cn("h-2 w-2 rounded-full shrink-0", sm.dot)} />
                <SIcon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-mono text-xs text-muted-foreground">{sm.num}</span>
                <span className="flex-1 text-foreground">{s}</span>
                {active && <Check className="h-4 w-4 text-primary" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}