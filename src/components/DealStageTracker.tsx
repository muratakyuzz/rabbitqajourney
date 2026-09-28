import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { Check, Search, ShieldCheck, FileText, Handshake, Trophy, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEAL_STAGES, type DealStage } from "@/lib/deal-payload";

const STAGE_META: Record<DealStage, { icon: React.ComponentType<{ className?: string }>; num: string }> = {
  Identified: { icon: Search, num: "01" },
  Qualified: { icon: ShieldCheck, num: "02" },
  Proposal: { icon: FileText, num: "03" },
  Negotiation: { icon: Handshake, num: "04" },
  Won: { icon: Trophy, num: "05" },
  Lost: { icon: XCircle, num: "06" },
};

const FLOW: DealStage[] = ["Identified", "Qualified", "Proposal", "Negotiation", "Won"];

export function fireDealWonConfetti() {
  const duration = 2500;
  const end = Date.now() + duration;
  const colors = ["#22c55e", "#facc15", "#3b82f6", "#ec4899", "#f97316"];
  (function frame() {
    confetti({ particleCount: 5, angle: 60, spread: 70, origin: { x: 0 }, colors });
    confetti({ particleCount: 5, angle: 120, spread: 70, origin: { x: 1 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
  confetti({
    particleCount: 180,
    spread: 120,
    startVelocity: 45,
    origin: { y: 0.6 },
    colors,
  });
}

interface Props {
  value: DealStage;
  onChange?: (stage: DealStage) => void;
  disabled?: boolean;
}

export function DealStageTracker({ value, onChange, disabled }: Props) {
  const prevRef = useRef<DealStage>(value);

  useEffect(() => {
    if (prevRef.current !== "Won" && value === "Won") {
      fireDealWonConfetti();
    }
    prevRef.current = value;
  }, [value]);

  const isLost = value === "Lost";
  const currentFlowIdx = FLOW.indexOf(value);

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-foreground">Deal Stage</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isLost ? "Marked as lost" : `Current: ${STAGE_META[value].num}. ${value}`}
          </p>
        </div>
        {value === "Won" ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 text-success px-3 py-1 text-xs font-semibold animate-fade-in">
            <Trophy className="h-3.5 w-3.5" /> Closed Won 🎉
          </span>
        ) : isLost ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 text-destructive px-3 py-1 text-xs font-semibold">
            <XCircle className="h-3.5 w-3.5" /> Closed Lost
          </span>
        ) : null}
      </div>

      {/* Flow */}
      <div className="relative">
        <div className="absolute left-0 right-0 top-5 h-0.5 bg-border" aria-hidden />
        <div
          className={cn(
            "absolute left-0 top-5 h-0.5 transition-all duration-700 ease-out",
            isLost ? "bg-destructive/40" : "bg-primary",
          )}
          style={{
            width: isLost
              ? "0%"
              : `${currentFlowIdx <= 0 ? 0 : (currentFlowIdx / (FLOW.length - 1)) * 100}%`,
          }}
          aria-hidden
        />
        <div className="relative grid grid-cols-5 gap-2">
          {FLOW.map((stage, idx) => {
            const meta = STAGE_META[stage];
            const Icon = meta.icon;
            const reached = !isLost && currentFlowIdx >= idx;
            const isCurrent = !isLost && value === stage;
            const completed = reached && !isCurrent;
            return (
              <button
                key={stage}
                type="button"
                disabled={disabled}
                onClick={() => onChange?.(stage)}
                className={cn(
                  "group flex flex-col items-center gap-2 focus:outline-none",
                  disabled ? "cursor-default" : "cursor-pointer",
                )}
              >
                <span
                  className={cn(
                    "relative z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border-2 bg-background transition-all duration-300",
                    isCurrent && stage === "Won" && "border-success bg-success text-success-foreground shadow-[0_0_0_6px_hsl(var(--success)/0.15)] scale-110",
                    isCurrent && stage !== "Won" && "border-primary bg-primary text-primary-foreground shadow-[0_0_0_6px_hsl(var(--primary)/0.15)] scale-110",
                    completed && "border-primary bg-primary/10 text-primary",
                    !reached && "border-border text-muted-foreground group-hover:border-primary/50",
                  )}
                >
                  {completed ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </span>
                <div className="text-center">
                  <div className="text-[10px] font-mono text-muted-foreground">{meta.num}</div>
                  <div
                    className={cn(
                      "text-xs font-medium",
                      isCurrent ? "text-foreground" : reached ? "text-foreground/80" : "text-muted-foreground",
                    )}
                  >
                    {stage}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lost button row */}
      <div className="mt-5 flex items-center justify-between border-t pt-4">
        <span className="text-xs text-muted-foreground">Or close the deal as:</span>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange?.("Lost")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            isLost
              ? "border-destructive bg-destructive/10 text-destructive"
              : "border-border text-muted-foreground hover:border-destructive/50 hover:text-destructive",
            disabled && "cursor-default opacity-60",
          )}
        >
          <XCircle className="h-3.5 w-3.5" /> 06. Lost
        </button>
      </div>
    </div>
  );
}