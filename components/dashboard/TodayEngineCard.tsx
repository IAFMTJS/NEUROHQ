"use client";

import Link from "next/link";
import type { BucketedToday } from "@/lib/today-engine";
import type { XPForecastItem } from "@/app/actions/dcic/xp-forecast";

type Props = {
  bucketed: BucketedToday;
  streakAtRisk: boolean;
  date: string;
  forecasts?: XPForecastItem[];
};

const bucketConfig = {
  critical: {
    label: "Critical",
    sublabel: "Streak risk",
    icon: "🔥",
    className: "border-amber-500/40 bg-amber-500/10",
  },
  high_impact: {
    label: "High Impact",
    sublabel: "Meeste XP",
    icon: "⚡",
    className: "border-[var(--accent-focus)]/40 bg-[var(--accent-focus)]/10",
  },
  growth_boost: {
    label: "Growth Boost",
    sublabel: "Unlock progress",
    icon: "🧠",
    className: "border-purple-500/40 bg-purple-500/10",
  },
} as const;

export function TodayEngineCard({ bucketed, streakAtRisk, date, forecasts = [] }: Props) {
  const hasAny =
    bucketed.critical.length > 0 || bucketed.high_impact.length > 0 || bucketed.growth_boost.length > 0;

  return (
    <section
      className="glass-card glass-card-3d overflow-hidden rounded-2xl border border-[var(--card-border)]"
      aria-label="Today Engine"
    >
      <div className="border-b border-[var(--card-border)] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Vandaag — door de app bepaald</h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
          Critical · High Impact · Growth Boost
        </p>
      </div>
      <div className="p-4 space-y-4">
        {!hasAny ? (
          <p className="text-sm text-[var(--text-muted)]">Geen missies vandaag. Start er één op Missions.</p>
        ) : (
          <>
            {bucketed.critical.length > 0 && (
              <div className={bucketConfig.critical.className + " rounded-xl border p-3"}>
                <div className="flex items-center gap-2 text-sm font-medium text-amber-200">
                  <span aria-hidden>{bucketConfig.critical.icon}</span>
                  <span>{bucketConfig.critical.label}</span>
                  <span className="text-xs font-normal text-amber-200/80">— {bucketConfig.critical.sublabel}</span>
                </div>
                <ul className="mt-2 space-y-1">
                  {bucketed.critical.map((t) => (
                    <li key={t.id} className="text-sm text-[var(--text-secondary)]">
                      {t.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {bucketed.high_impact.length > 0 && (
              <div className={bucketConfig.high_impact.className + " rounded-xl border p-3"}>
                <div className="flex items-center gap-2 text-sm font-medium text-[var(--accent-focus)]">
                  <span aria-hidden>{bucketConfig.high_impact.icon}</span>
                  <span>{bucketConfig.high_impact.label}</span>
                  <span className="text-xs font-normal opacity-80">— {bucketConfig.high_impact.sublabel}</span>
                </div>
                <ul className="mt-2 space-y-1">
                  {bucketed.high_impact.map((t) => (
                    <li key={t.id} className="text-sm text-[var(--text-secondary)]">
                      {t.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {bucketed.growth_boost.length > 0 && (
              <div className={bucketConfig.growth_boost.className + " rounded-xl border p-3"}>
                <div className="flex items-center gap-2 text-sm font-medium text-purple-300">
                  <span aria-hidden>{bucketConfig.growth_boost.icon}</span>
                  <span>{bucketConfig.growth_boost.label}</span>
                  <span className="text-xs font-normal opacity-80">— {bucketConfig.growth_boost.sublabel}</span>
                </div>
                <ul className="mt-2 space-y-1">
                  {bucketed.growth_boost.map((t) => (
                    <li key={t.id} className="text-sm text-[var(--text-secondary)]">
                      {t.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
        <Link
          href="/tasks"
          className="mt-2 block text-center text-sm font-medium text-[var(--accent-focus)] hover:underline"
        >
          Naar Missions →
        </Link>

        {forecasts.length > 0 && (
          <div className="rounded-xl border border-[var(--card-border)]/70 bg-[var(--bg-surface)]/20 p-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Als je vandaag…</h3>
            <ul className="mt-2 space-y-2">
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
          </div>
        )}
      </div>
    </section>
  );
}
