"use client";

import type { HeatmapDay } from "@/app/actions/dcic/heatmap";

type Props = {
  days: { date: string; status: HeatmapDay }[];
};

/** Mini heatmap: last 30 days, green = active, red/gray = inactive. */
export function WeeklyHeatmap({ days }: Props) {
  if (days.length === 0) return null;

  // Show as 5–6 rows of ~7 (week view) or 6 columns of 5
  const cols = 7;
  const rows = Math.ceil(days.length / cols);
  const grid = Array.from({ length: rows }, (_, i) => days.slice(i * cols, (i + 1) * cols));

  return (
    <section
      className="glass-card glass-card-3d p-4 rounded-2xl border border-[var(--card-border)]"
      aria-label="Activity heatmap laatste 30 dagen"
    >
      <h2 className="text-sm font-semibold text-[var(--text-primary)]">Laatste 30 dagen</h2>
      <p className="mt-0.5 text-xs text-[var(--text-muted)]">Groen = actief, grijs = inactief</p>
      <div className="mt-3 flex flex-wrap gap-1" style={{ maxWidth: cols * 14 }}>
        {days.map((d) => (
          <div
            key={d.date}
            className={`h-3 w-3 rounded-sm shrink-0 ${d.status === "active" ? "bg-emerald-500" : "bg-white/15"}`}
            title={d.date + (d.status === "active" ? " — actief" : " — inactief")}
            aria-hidden
          />
        ))}
      </div>
    </section>
  );
}
