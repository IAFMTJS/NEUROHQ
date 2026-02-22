"use client";

import { useState } from "react";
import type { HeatmapDay } from "@/app/actions/dcic/heatmap";
import type { XPForecastItem } from "@/app/actions/dcic/xp-forecast";
import { WeeklyHeatmap } from "@/components/dashboard/WeeklyHeatmap";
import { XPForecastWidget } from "@/components/dashboard/XPForecastWidget";
import { HQChart } from "@/components/hq/HQChart";

type Identity = {
  total_xp: number;
  level: number;
  rank: string;
  xp_to_next_level: number;
  next_unlock: { level: number; rank: string; xpNeeded: number };
  streak: { current: number; longest: number; last_completion_date: string | null };
};

type Props = {
  identity: Identity;
  forecast: XPForecastItem[];
  heatmapDays: { date: string; status: HeatmapDay }[];
  velocity: number;
  chartData: { name: string; value: number }[];
  progress: number;
  range: { current: number; needed: number };
  xpLast7: number;
  xpPrevious7: number;
};

export default function XPPageContent({
  identity,
  forecast,
  heatmapDays,
  velocity,
  chartData,
  progress,
  range,
  xpLast7,
  xpPrevious7,
}: Props) {
  const [commanderMode, setCommanderMode] = useState(false);

  return (
    <div className="space-y-6">
      {/* Dual mode toggle */}
      <section className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-surface)]/50 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            {commanderMode ? "Commander Mode" : "Basic Mode"}
          </span>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text-primary)]">
            <span className="text-[var(--text-muted)]">Basic</span>
            <input
              type="checkbox"
              checked={commanderMode}
              onChange={(e) => setCommanderMode(e.target.checked)}
              className="rounded border-[var(--card-border)]"
              aria-label="Commander mode aan/uit"
            />
            <span className={commanderMode ? "text-[var(--accent-focus)]" : "text-[var(--text-muted)]"}>
              Commander
            </span>
          </label>
        </div>
      </section>

      {/* Basic: XP totaal, level, velocity, progress */}
      <section
        className="glass-card glass-card-3d p-4 rounded-2xl border border-[var(--card-border)]"
        aria-label="XP overzicht"
      >
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">XP & Level</h2>
        <div className="mt-3 flex flex-wrap items-baseline gap-3">
          <span className="text-2xl font-bold text-[var(--text-primary)]">{identity.total_xp}</span>
          <span className="text-sm text-[var(--text-muted)]">XP totaal</span>
          <span className="rounded-full bg-[var(--accent-focus)]/20 px-2 py-0.5 text-xs font-medium text-[var(--accent-focus)]">
            Level {identity.level} · {identity.rank}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <span>Velocity: {velocity} XP/dag (laatste 7)</span>
        </div>
        <div className="mt-3">
          <div className="flex justify-between text-xs text-[var(--text-muted)]">
            <span>{range.current} / {range.needed} naar level {identity.level + 1}</span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[var(--accent-focus)] transition-all duration-500"
              style={{ width: `${Math.min(100, progress * 100)}%` }}
            />
          </div>
        </div>
      </section>

      {/* Streak */}
      <section
        className="glass-card glass-card-3d p-4 rounded-2xl border border-[var(--card-border)]"
        aria-label="Streak"
      >
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Streak</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Huidige: <strong>{identity.streak.current}</strong> · Langste: <strong>{identity.streak.longest}</strong>
        </p>
      </section>

      {/* 30-dagen grafiek (14 dagen data) */}
      {chartData.length > 0 && (
        <HQChart
          data={chartData}
          title="XP laatste 14 dagen"
          variant="area"
          dataKey="value"
        />
      )}

      {/* 30-dagen heatmap */}
      <WeeklyHeatmap days={heatmapDays} />

      {/* Forecast scenarios */}
      <XPForecastWidget forecasts={forecast} currentLevel={identity.level} />

      {/* Commander-only: Quality %, Volatility, ROI, Mastery, Leak, Domain breakdown */}
      {commanderMode && (
        <div className="space-y-4">
          <section
            className="glass-card glass-card-3d p-4 rounded-2xl border border-[var(--card-border)]"
            aria-label="XP Quality & Volatility"
          >
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">XP Quality & Volatility</h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Strategic vs misaligned · Std dev laatste 14 dagen. Komt met XP Events.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg bg-white/5 px-3 py-2">
                <span className="text-[var(--text-muted)]">Quality %</span>
                <p className="font-medium text-[var(--text-primary)]">—</p>
              </div>
              <div className="rounded-lg bg-white/5 px-3 py-2">
                <span className="text-[var(--text-muted)]">Volatility</span>
                <p className="font-medium text-[var(--text-primary)]">—</p>
              </div>
            </div>
          </section>

          <section
            className="glass-card glass-card-3d p-4 rounded-2xl border border-[var(--card-border)]"
            aria-label="XP Sources"
          >
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">XP Sources (laatste 7)</h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Missies · Campaigns · Alignment · Pressure · Streak · Penalty. Komt met XP Events.
            </p>
            <div className="mt-2 text-sm text-[var(--text-secondary)]">
              Totaal laatste 7: <strong>{xpLast7}</strong> XP · Vorige 7: <strong>{xpPrevious7}</strong> XP
            </div>
          </section>

          <section
            className="glass-card glass-card-3d p-4 rounded-2xl border border-[var(--card-border)]"
            aria-label="Mastery & Leak"
          >
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Mastery & Leak Detection</h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Tiers: Novice → Operator → Advanced → Elite → Architect. Leak: high abandon, lage ROI, misaligned grind.
            </p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">Komt met Mission Library & XP Events.</p>
          </section>
        </div>
      )}

      {/* Top missions placeholder (Basic) */}
      {!commanderMode && (
        <section
          className="glass-card glass-card-3d p-4 rounded-2xl border border-[var(--card-border)]"
          aria-label="Top missies"
        >
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Top missies</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Meest voltooide missies. Volledige Mission Library (100+) komt met XP Core Engine.
          </p>
        </section>
      )}
    </div>
  );
}
