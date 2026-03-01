"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type Props = { weeklyTotals: { weekLabel: string; xp: number; missions: number }[] };

export function InsightsWeeklyComparison({ weeklyTotals }: Props) {
  if (weeklyTotals.length === 0) return null;
  const data = weeklyTotals.map((w) => ({ name: w.weekLabel, XP: w.xp, Missies: w.missions }));

  return (
    <section className="card-simple hq-card-enter rounded-[var(--hq-card-radius-sharp)] overflow-hidden p-0" aria-label="Wekelijkse vergelijking">
      <div className="border-b border-[var(--card-border)] px-4 py-3">
        <h2 className="hq-h2 mb-1">Wekelijkse vergelijking</h2>
        <p className="text-sm text-[var(--text-muted)]">Laatste 4 weken: XP en missies per week.</p>
      </div>
      <div className="h-[220px] w-full p-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.35)" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 10 }} />
            <YAxis stroke="rgba(255,255,255,0.35)" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 10 }} />
            <Tooltip contentStyle={{ background: "rgba(20,20,35,0.95)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "12px", color: "white" }} />
            <Bar dataKey="XP" fill="var(--accent-focus)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Missies" fill="rgba(255,255,255,0.35)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
