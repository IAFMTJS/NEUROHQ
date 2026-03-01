"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { domainLabel, type StrategyDomain } from "@/lib/strategyDomains";

const DOMAINS: StrategyDomain[] = ["discipline", "health", "learning", "business"];
const PLANNED_COLOR = "var(--accent-focus)";
const ACTUAL_COLOR = "var(--accent-cyan)";

type Props = {
  plannedDistribution: Record<string, number>;
  actualDistribution: Record<string, number>;
  alignmentScore: number | null;
  /** Last N days alignment log for chart (optional: show trend) */
  alignmentLog?: { date: string; alignment_score: number }[];
};

export function StrategyAlignmentGraph({
  plannedDistribution,
  actualDistribution,
  alignmentScore,
  alignmentLog,
}: Props) {
  const barData = DOMAINS.map((d) => ({
    name: domainLabel(d),
    planned: Math.round((plannedDistribution[d] ?? 0) * 100),
    actual: Math.round((actualDistribution[d] ?? 0) * 100),
  }));

  const scorePct = alignmentScore != null ? Math.round(alignmentScore * 100) : null;
  const scoreLabel =
    scorePct == null
      ? "—"
      : scorePct >= 85
        ? "Scherp"
        : scorePct >= 70
          ? "Lichte drift"
          : "Focus verloren";

  return (
    <section className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-elevated)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Alignment — Gepland vs Werkelijk
        </h2>
        {scorePct != null && (
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold tabular-nums text-[var(--accent-focus)]">
              {scorePct}%
            </span>
            <span className="text-xs text-[var(--text-muted)]">{scoreLabel}</span>
          </div>
        )}
      </div>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        85%+ scherp, 70–85% lichte drift, &lt;70% focus verloren.
        {scorePct != null && scorePct < 100 && (
          <> Opportunity cost: bij 100% alignment zou je ~{100 - scorePct}% meer focus in je primaire domein hebben.</>
        )}
      </p>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={barData}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            barCategoryGap="20%"
            barGap={4}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" opacity={0.5} />
            <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
            <YAxis
              tick={{ fill: "var(--text-muted)", fontSize: 11 }}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--card-border)",
                borderRadius: "8px",
                color: "var(--text-primary)",
              }}
              formatter={(value: number | undefined) => [value != null ? `${value}%` : "", ""]}
              labelFormatter={(label) => label}
            />
            <Legend
              formatter={() => (
                <>
                  <span style={{ color: "var(--text-muted)" }}>Gepland</span>
                  <span style={{ color: "var(--text-muted)", marginLeft: 16 }}>Werkelijk</span>
                </>
              )}
            />
            <Bar dataKey="planned" name="Gepland" fill={PLANNED_COLOR} radius={[4, 4, 0, 0]} />
            <Bar dataKey="actual" name="Werkelijk" fill={ACTUAL_COLOR} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {alignmentLog && alignmentLog.length > 0 && (
        <div className="mt-3 text-xs text-[var(--text-muted)]">
          Laatste dagen alignment:{" "}
          {alignmentLog
            .slice(0, 7)
            .map((l) => `${Math.round(l.alignment_score * 100)}%`)
            .join(" → ")}
        </div>
      )}
    </section>
  );
}
