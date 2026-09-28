import { useState } from "react";
import { BarChart3, TriangleRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatCurrency, type StageBucket } from "@/lib/partner-dashboard-data";
import type { DealStage } from "@/lib/deal-payload";

const PYRAMID_COLORS: Record<DealStage, string> = {
  Identified: "#6B7280",
  Qualified: "#3B82F6",
  Proposal: "#7C3AED",
  Negotiation: "#F59E0B",
  Won: "#10B981",
  Lost: "#EF4444",
};

interface Props {
  buckets: StageBucket[];
  winRate: number;
  activePipelineValue: number;
  totalWonValue: number;
}

export function PipelineFunnel({ buckets, winRate, activePipelineValue, totalWonValue }: Props) {
  const [mode, setMode] = useState<"bar" | "pyramid">("bar");
  const maxCount = Math.max(1, ...buckets.map((b) => b.count));

  return (
    <Card className="h-full shadow-none">
      <CardContent className="p-5 flex flex-col h-full">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-foreground">Pipeline funnel</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Distribution by stage</p>
          </div>
          <div className="inline-flex rounded-md border border-border bg-muted/40 p-0.5">
            <button
              type="button"
              aria-label="Bar chart view"
              onClick={() => setMode("bar")}
              className={cn(
                "inline-flex h-7 w-7 items-center justify-center rounded-[5px] transition-colors",
                mode === "bar" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <BarChart3 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label="Pyramid funnel view"
              onClick={() => setMode("pyramid")}
              className={cn(
                "inline-flex h-7 w-7 items-center justify-center rounded-[5px] transition-colors",
                mode === "pyramid" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <TriangleRight className="h-3.5 w-3.5 rotate-90" />
            </button>
          </div>
        </div>

        <div className="flex-1 animate-fade-in" key={mode}>
          {mode === "bar" ? <BarView buckets={buckets} maxCount={maxCount} /> : <PyramidView buckets={buckets} />}
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <Chip label="Win rate" value={`${Math.round(winRate * 100)}%`} />
          <Chip label="Active" value={formatCurrency(activePipelineValue)} />
          <Chip label="Won" value={formatCurrency(totalWonValue)} />
        </div>
      </CardContent>
    </Card>
  );
}

function BarView({ buckets, maxCount }: { buckets: StageBucket[]; maxCount: number }) {
  return (
    <div className="space-y-2">
      {buckets.map((b) => {
        const pct = Math.max(4, (b.count / maxCount) * 100);
        const color = PYRAMID_COLORS[b.stage];
        const dim = b.count === 0;
        return (
          <div key={b.stage} className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-medium text-foreground">{b.stage}</span>
              <span className="tabular-nums text-muted-foreground">
                {b.count} · {formatCurrency(b.value)}
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: color, opacity: dim ? 0.3 : 1 }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PyramidView({ buckets }: { buckets: StageBucket[] }) {
  const N = buckets.length;
  const W = 720;
  const rowH = 58;
  const gap = 4;
  const H = N * rowH + (N - 1) * gap + 12;
  // Center the pyramid in the middle band of the SVG; outer side bands hold annotations.
  const bandW = 320;
  const cx = W / 2;
  const minRatio = 0.18;
  const widthAt = (i: number) => {
    const linear = 1 - (i / N) * (1 - minRatio);
    return bandW * linear;
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
      <defs>
        {buckets.map((b) => {
          const c = PYRAMID_COLORS[b.stage];
          return (
            <linearGradient key={b.stage} id={`pf-${b.stage}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={c} stopOpacity="0.95" />
              <stop offset="100%" stopColor={c} stopOpacity="0.72" />
            </linearGradient>
          );
        })}
        <filter id="pf-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.08" />
        </filter>
      </defs>

      {buckets.map((b, i) => {
        const wTop = widthAt(i);
        const wBot = widthAt(i + 1);
        const y = i * (rowH + gap) + 6;
        const xTop = cx - wTop / 2;
        const xBot = cx - wBot / 2;
        const color = PYRAMID_COLORS[b.stage];
        const dim = b.count === 0;
        const points = `${xTop},${y} ${xTop + wTop},${y} ${xBot + wBot},${y + rowH} ${xBot},${y + rowH}`;
        const labelY = y + rowH / 2;

        // Conversion % between this stage and previous (skip first, skip Lost)
        const prev = i > 0 ? buckets[i - 1].count : 0;
        const showConv = i > 0 && b.stage !== "Lost" && prev > 0;
        const conv = showConv ? Math.round((b.count / prev) * 100) : null;

        return (
          <g key={b.stage} opacity={dim ? 0.45 : 1}>
            {/* connector line from label to shape (left) */}
            <line
              x1={20}
              y1={labelY}
              x2={xTop - 10}
              y2={labelY}
              stroke="currentColor"
              strokeOpacity="0.12"
              strokeDasharray="2 3"
            />
            {/* stage label, left */}
            <text x={20} y={labelY - 2} fontSize="12" fontWeight="600" fill="currentColor">
              {b.stage}
            </text>
            <text x={20} y={labelY + 13} fontSize="10" fill="currentColor" fillOpacity="0.55">
              {b.stage === "Won" ? "Closed" : b.stage === "Lost" ? "Closed" : "Stage"}
            </text>

            {/* trapezoid */}
            <polygon
              points={points}
              fill={`url(#pf-${b.stage})`}
              stroke={color}
              strokeOpacity={dim ? 0.2 : 0.35}
              strokeWidth="1"
              filter="url(#pf-shadow)"
            />
            {/* count inside */}
            <text
              x={cx}
              y={labelY + 4}
              textAnchor="middle"
              fontSize="14"
              fontWeight="700"
              fill="#ffffff"
              style={{ letterSpacing: "0.01em" }}
            >
              {dim ? "—" : b.count}
            </text>

            {/* value right side */}
            <text x={W - 20} y={labelY - 2} textAnchor="end" fontSize="12" fontWeight="600" fill="currentColor">
              {dim ? "—" : formatCurrency(b.value)}
            </text>
            <text x={W - 20} y={labelY + 13} textAnchor="end" fontSize="10" fill="currentColor" fillOpacity="0.55">
              {b.count === 1 ? "1 deal" : `${b.count} deals`}
            </text>
            <line
              x1={xTop + wTop + 10}
              y1={labelY}
              x2={W - 100}
              y2={labelY}
              stroke="currentColor"
              strokeOpacity="0.12"
              strokeDasharray="2 3"
            />

            {/* conversion badge between this row and previous, centered on top edge */}
            {conv !== null ? (
              <g>
                <rect
                  x={cx - 26}
                  y={y - 9}
                  width="52"
                  height="14"
                  rx="7"
                  fill="hsl(var(--background))"
                  stroke="currentColor"
                  strokeOpacity="0.15"
                />
                <text x={cx} y={y + 1} textAnchor="middle" fontSize="9" fontWeight="600" fill="currentColor" fillOpacity="0.7">
                  {conv}% ↓
                </text>
              </g>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold tabular-nums text-foreground mt-0.5">{value}</p>
    </div>
  );
}