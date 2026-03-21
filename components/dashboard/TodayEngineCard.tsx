"use client";

import { useState } from "react";
import Link from "next/link";
import type { BucketedToday } from "@/lib/today-engine";
import type { XPForecastItem } from "@/app/actions/dcic/xp-forecast";
import { Modal } from "@/components/Modal";

type Props = {
  bucketed: BucketedToday;
  streakAtRisk: boolean;
  date: string;
  forecasts?: XPForecastItem[];
};

function missionSlotHint(missionEquivalent: number): string | null {
  if (missionEquivalent >= 2) return "2× missie";
  if (missionEquivalent <= 0.5) return "½ missie";
  return null;
}

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
  const [explainOpen, setExplainOpen] = useState(false);
  const hasAny =
    bucketed.critical.length > 0 || bucketed.high_impact.length > 0 || bucketed.growth_boost.length > 0;

  return (
    <section
      className="glass-card glass-card-3d overflow-hidden rounded-2xl border border-[var(--card-border)]"
      aria-label="Today Engine"
    >
      <div className="border-b border-[var(--card-border)] px-4 py-3 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Vandaag — door de app bepaald</h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            Drie buckets: streak/risico, impact, groei. Slotregels staan in &quot;Meer uitleg&quot;.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExplainOpen(true)}
          className="shrink-0 rounded-lg border border-[var(--card-border)] px-3 py-1.5 text-xs font-medium text-[var(--accent-focus)] hover:bg-[var(--bg-surface)]"
        >
          Meer uitleg
        </button>
      </div>
      <div className="p-4 flex flex-col gap-4 md:flex-row md:items-stretch">
        <div className="min-w-0 flex-1 space-y-4">
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
                  {bucketed.critical.map((t) => {
                    const slotHint = missionSlotHint(t.missionEquivalent);
                    return (
                      <li key={t.id} className="flex flex-wrap items-baseline gap-2 text-sm text-[var(--text-secondary)]">
                        <span>{t.title}</span>
                        {slotHint ? (
                          <span className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{slotHint}</span>
                        ) : null}
                      </li>
                    );
                  })}
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
                  {bucketed.high_impact.map((t) => {
                    const slotHint = missionSlotHint(t.missionEquivalent);
                    return (
                      <li key={t.id} className="flex flex-wrap items-baseline gap-2 text-sm text-[var(--text-secondary)]">
                        <span>{t.title}</span>
                        {slotHint ? (
                          <span className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{slotHint}</span>
                        ) : null}
                      </li>
                    );
                  })}
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
                  {bucketed.growth_boost.map((t) => {
                    const slotHint = missionSlotHint(t.missionEquivalent);
                    return (
                      <li key={t.id} className="flex flex-wrap items-baseline gap-2 text-sm text-[var(--text-secondary)]">
                        <span>{t.title}</span>
                        {slotHint ? (
                          <span className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{slotHint}</span>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </>
        )}
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
        <div className="flex w-full shrink-0 flex-col justify-center gap-2 md:w-44 md:border-l md:border-[var(--card-border)] md:pl-4">
          <Link
            href="/tasks"
            className="neon-button inline-flex min-h-[44px] w-full items-center justify-center rounded-xl px-4 py-2.5 text-center text-sm font-semibold"
          >
            Naar Missions
          </Link>
          <p className="text-center text-[10px] text-[var(--text-muted)] md:text-left">
            {streakAtRisk ? "Streak onder druk — begin met Critical." : "Kies één focus; de rest wacht."}
          </p>
        </div>
      </div>

      <Modal open={explainOpen} onClose={() => setExplainOpen(false)} title="Hoe vandaag werkt" size="md">
        <div className="space-y-3 text-sm text-[var(--text-secondary)]">
          <p>
            De app sorteert je openstaande missies in <strong className="text-[var(--text-primary)]">Critical</strong> (streak/risico),{" "}
            <strong className="text-[var(--text-primary)]">High Impact</strong> (meeste XP-waarde) en{" "}
            <strong className="text-[var(--text-primary)]">Growth Boost</strong> (ontwikkeling / zwaardere groei).
          </p>
          <p>
            <strong className="text-[var(--text-primary)]">Missie-slots:</strong> zware taken kosten ongeveer twee slots in je dag; heel korte
            mini-missies tellen vaak als een half slot. Zo blijft je dag haalbaar binnen energie en focus.
          </p>
          <p className="text-xs text-[var(--text-muted)]">Datum context: {date}</p>
        </div>
      </Modal>
    </section>
  );
}
