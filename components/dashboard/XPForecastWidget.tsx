"use client";

import type { XPForecastItem } from "@/app/actions/dcic/xp-forecast";

type Props = {
  forecasts: XPForecastItem[];
  currentLevel: number;
};

export function XPForecastWidget({ forecasts, currentLevel }: Props) {
  if (forecasts.length === 0) return null;

  return (
    <section
      className="glass-card glass-card-3d p-4 rounded-2xl border border-[var(--card-border)]"
      aria-label="XP forecast"
    >
      <h2 className="text-sm font-semibold text-[var(--text-primary)]">Als je vandaag…</h2>
      <ul className="mt-3 space-y-2">
        {forecasts.map((f) => (
          <li
            key={f.scenario}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm"
          >
            <span className="text-[var(--text-secondary)]">{f.label}</span>
            <span className="flex items-center gap-2">
              {f.levelUp && <span className="text-xs font-medium text-emerald-400">Level {f.levelAfter} ↑</span>}
              {f.streakBreaks && <span className="text-xs font-medium text-amber-400">Streak breekt</span>}
              {!f.levelUp && !f.streakBreaks && f.scenario === "none" && (
                <span className="text-xs text-[var(--text-muted)]">Geen change</span>
              )}
              {f.xpGain > 0 && (
                <span className="text-xs text-[var(--text-muted)]">+{f.xpGain} XP</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
