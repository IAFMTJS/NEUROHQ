"use client";

import { useState } from "react";
import Link from "next/link";
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

type Layer = "xp" | "energy" | "focus" | "streak";

type Props = {
  graphData: InsightGraphDay[];
};

const tooltipStyle = {
  background: "rgba(20,20,35,0.9)",
  border: "1px solid rgba(255,255,255,0.2)",
  borderRadius: "12px",
  color: "white",
} as const;

export function InsightsGraphBlock({ graphData }: Props) {
  const [layer, setLayer] = useState<Layer>("xp");

  const data = graphData.map((d) => ({
    name: d.name,
    xp: d.xp,
    energy: d.energy != null ? Number(d.energy) : null,
    focus: d.focus != null ? Number(d.focus) : null,
    streak: d.streak ?? 0,
  }));

  const dataKey = layer === "xp" ? "xp" : layer === "energy" ? "energy" : layer === "focus" ? "focus" : "streak";
  const chartData = data.map((d) => {
    const v = (d as Record<string, unknown>)[dataKey];
    return { ...d, [dataKey]: v != null ? v : 0 };
  });

  return (
    <section
      className="card-simple hq-card-enter rounded-[var(--hq-card-radius-sharp)] overflow-hidden p-0"
      aria-label="Grafiek"
    >
      <div className="border-b border-[var(--card-border)] px-4 py-3">
        <h2 className="hq-h2 mb-2">Verloop</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Laatste 14 dagen. Schakel tussen XP, energie, focus en streak.
        </p>
        <div className="mt-3 flex gap-2">
          {(["xp", "energy", "focus", "streak"] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLayer(l)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                layer === l
                  ? "bg-[var(--accent-focus)] text-white"
                  : "bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--card-border)]"
              }`}
            >
              {l === "xp" ? "XP" : l === "energy" ? "Energie" : l === "focus" ? "Focus" : "Streak"}
            </button>
          ))}
        </div>
      </div>
      <div className="h-[280px] w-full p-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="insightsChartFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent-focus)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--accent-focus)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="rgba(255,255,255,0.35)"
              tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 10 }}
            />
            <YAxis
              stroke="rgba(255,255,255,0.35)"
              tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 10 }}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: number | undefined) =>
                [
                  value == null ? "–" : layer === "xp" ? value : layer === "streak" ? value : `${Number(value)}/10`,
                  layer === "xp" ? "XP" : layer === "energy" ? "Energie" : layer === "focus" ? "Focus" : "Streak",
                ]
              }
            />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke="var(--accent-focus)"
              fill="url(#insightsChartFill)"
              strokeWidth={2}
              isAnimationActive
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="border-t border-[var(--card-border)] p-4">
        <Link href="/report" className="btn-hq-secondary inline-flex w-full items-center justify-center rounded-[var(--hq-btn-radius)] py-2.5 px-4">
          Meer data
        </Link>
      </div>
    </section>
  );
}
