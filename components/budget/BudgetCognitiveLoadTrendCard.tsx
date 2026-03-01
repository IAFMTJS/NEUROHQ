"use client";

import type { FC } from "react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

type Point = { label: string; value: number };

type Props = {
  points: Point[];
};

export const BudgetCognitiveLoadTrendCard: FC<Props> = ({ points }) => {
  if (!points.length) {
    return (
      <section className="card-simple overflow-hidden p-0">
        <div className="border-b border-[var(--card-border)] px-4 py-3">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Cognitive Load Trend</h2>
        </div>
        <div className="p-4">
          <p className="text-sm text-[var(--text-muted)]">
            Not enough recent data to estimate budget-related load yet.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="card-simple overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Cognitive Load Trend</h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
          Approximate load from overspend, impulse tags, and missed logs over the last two weeks.
        </p>
      </div>
      <div className="p-4 h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points}>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
            <XAxis dataKey="label" hide />
            <YAxis hide domain={[0, "dataMax + 1"]} />
            <Tooltip
              formatter={(val?: number) => [(val ?? 0).toFixed(0), "Load"]}
              labelFormatter={(label) => `Day ${label}`}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--accent-primary)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};

