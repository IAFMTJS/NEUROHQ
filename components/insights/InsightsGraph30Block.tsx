"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { InsightGraphDay } from "@/app/actions/dcic/insight-engine";

const tooltipStyle = {
  background: "rgba(20,20,35,0.9)",
  border: "1px solid rgba(255,255,255,0.2)",
  borderRadius: "12px",
  color: "white",
} as const;

type Props = {
  graphData30: InsightGraphDay[];
};

export function InsightsGraph30Block({ graphData30 }: Props) {
  if (graphData30.length === 0) return null;
  const chartData = graphData30.map((d) => ({ name: d.name, xp: d.xp }));

  return (
    <section
      className="card-simple hq-card-enter rounded-[var(--hq-card-radius-sharp)] overflow-hidden p-0"
      aria-label="Verloop 30 dagen"
    >
      <div className="border-b border-[var(--card-border)] px-4 py-3">
        <h2 className="hq-h2 mb-1">Verloop · 30 dagen</h2>
        <p className="text-sm text-[var(--text-muted)]">Dagelijkse XP over de laatste 30 dagen.</p>
      </div>
      <div className="h-[260px] w-full p-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="insights30Fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent-focus)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--accent-focus)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="rgba(255,255,255,0.35)"
              tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 9 }}
              interval="preserveStartEnd"
            />
            <YAxis stroke="rgba(255,255,255,0.35)" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 10 }} />
            <Tooltip contentStyle={tooltipStyle} formatter={(value: number | undefined) => [value ?? 0, "XP"]} />
            <Area
              type="monotone"
              dataKey="xp"
              stroke="var(--accent-focus)"
              fill="url(#insights30Fill)"
              strokeWidth={2}
              isAnimationActive
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
