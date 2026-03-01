"use client";

import type { FC } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { WeeklyLearningPoint } from "@/app/actions/learning-analytics";

type Props = {
  points: WeeklyLearningPoint[];
};

export const LearningVelocityChart: FC<Props> = ({ points }) => {
  if (!points.length) {
    return (
      <p className="text-sm text-[var(--text-muted)]">
        No learning data yet. Log a few sessions to see your trend.
      </p>
    );
  }

  const data = points.map((p) => ({
    week: p.weekStart.slice(5), // MM-DD
    minutes: p.minutes,
    sessions: p.sessions,
  }));

  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis
            dataKey="week"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "var(--text-muted)" }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "var(--text-muted)" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--card-border)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Line
            type="monotone"
            dataKey="minutes"
            stroke="var(--accent-primary)"
            strokeWidth={2}
            dot={false}
            name="Minutes"
          />
          <Line
            type="monotone"
            dataKey="sessions"
            stroke="var(--accent-cyan)"
            strokeWidth={1.5}
            dot={false}
            name="Sessions"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

