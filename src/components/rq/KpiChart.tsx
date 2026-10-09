import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmtDate } from "@/lib/rabbitqa/labels";
import type { Kpi } from "@/lib/rabbitqa/types";

/** KPI ölçümlerinin zaman grafiği; hedef değer yatay referans çizgisi. */
export function KpiChart({ kpi }: { kpi: Kpi }) {
  const data = kpi.measurements.map((m) => ({ date: fmtDate(m.date), value: m.value }));
  return (
    <div className="h-36 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} accessibilityLayer={false} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
          <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} domain={["auto", "auto"]} />
          <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 12 }} formatter={(v) => [`${v} ${kpi.unit}`, "Değer"]} />
          {kpi.target !== null && <ReferenceLine y={kpi.target} stroke="hsl(var(--primary))" strokeDasharray="4 4" label={{ value: `Hedef ${kpi.target}`, fontSize: 10, fill: "hsl(var(--primary))", position: "insideTopRight" }} />}
          <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
