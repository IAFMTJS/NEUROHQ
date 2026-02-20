"use client";

import Link from "next/link";
import type { BucketedToday } from "@/lib/today-engine";

type Props = {
  bucketed: BucketedToday;
  streakAtRisk: boolean;
  date: string;
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

export function TodayEngineCard({ bucketed, streakAtRisk, date }: Props) {
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
      </div>
    </section>
  );
}
