"use client";

import Link from "next/link";
import { weeklyDifficultyFromBrain, type DifficultyTier, type WeeklyLockPhase } from "@/lib/growth/adaptive-engine";

function tierStyles(tier: DifficultyTier): { label: string; className: string } {
  switch (tier) {
    case "easy":
      return {
        label: "Light load",
        className: "border-emerald-400/50 bg-emerald-500/15 text-emerald-100",
      };
    case "hard":
      return {
        label: "Heavy load",
        className: "border-rose-400/45 bg-rose-500/15 text-rose-100",
      };
    default:
      return {
        label: "Standard load",
        className: "border-amber-400/50 bg-amber-500/15 text-amber-100",
      };
  }
}

function phaseLabel(phase: WeeklyLockPhase): string {
  return phase === "mon_tue" ? "Mon–Tue anchor" : "Wed–Sun stretch";
}

const DAYS = ["M", "T", "W", "T", "F", "S", "S"] as const;

/** D.3 adaptive preview: brain → suggested tier, phase strip, energy/focus meters. */
export function GrowthAdaptiveHint(props: {
  energyAvg: number | null;
  focusAvg: number | null;
  brainLogged: boolean;
}) {
  const { tier, lockedPhase } = weeklyDifficultyFromBrain(props);
  const pill = tierStyles(tier);
  const e = props.energyAvg;
  const f = props.focusAvg;
  const energyPct = e != null ? Math.round(Math.max(0, Math.min(100, e))) : null;
  const focusPct = f != null ? Math.round(Math.max(0, Math.min(100, f))) : null;

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--semantic-ring)]/40 bg-gradient-to-br from-[var(--semantic-accent)]/12 via-[var(--bg-elevated)]/90 to-purple-500/10 shadow-[0_0_40px_rgba(0,212,255,0.06)]">
      <div className="border-b border-[var(--card-border)]/80 px-4 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">
              Adaptive training
            </p>
            <p className="mt-0.5 text-sm font-semibold text-[var(--text-primary)]">Load preview (phase 1)</p>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${pill.className}`}
          >
            {pill.label}
          </span>
        </div>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-2">
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Brain signal</p>
          <Meter label="Energy" value={energyPct} />
          <Meter label="Focus" value={focusPct} />
          {!props.brainLogged && (
            <p className="rounded-lg border border-dashed border-[var(--card-border)] bg-[var(--bg-primary)]/50 px-2.5 py-2 text-[11px] text-[var(--text-secondary)]">
              No check-in yet — we assume <strong className="text-[var(--text-primary)]">medium</strong> load until you log
              energy &amp; focus on the dashboard.
            </p>
          )}
        </div>

        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Weekly phase</p>
          <p className="text-xs text-[var(--text-secondary)]">{phaseLabel(lockedPhase)}</p>
          <div className="flex gap-1">
            {DAYS.map((d, i) => {
              const highlight =
                lockedPhase === "mon_tue" ? i < 2 : i >= 2;
              return (
                <div
                  key={`${d}-${i}`}
                  className={`flex h-9 flex-1 items-center justify-center rounded-md text-[10px] font-bold ${
                    highlight
                      ? "bg-[var(--semantic-accent)]/25 text-[var(--semantic-accent)] ring-1 ring-[var(--semantic-ring)]/50"
                      : "bg-[var(--bg-primary)]/60 text-[var(--text-muted)]"
                  }`}
                  title={highlight ? "Suggested emphasis window" : "Recovery / flex"}
                >
                  {d}
                </div>
              );
            })}
          </div>
          <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">
            Koppel dit aan je protocol-tier: bij <strong className="text-[var(--text-secondary)]">{pill.label}</strong> hoort
            in de bibliotheek dezelfde load (Light / Standard / Heavy). Zo blijft engine en traject gelijk.
          </p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
            <Link
              href="#growth-protocols"
              className="inline-flex text-xs font-semibold text-[var(--semantic-accent)] underline-offset-2 hover:underline"
            >
              Open protocollen →
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex text-xs font-semibold text-[var(--text-muted)] underline-offset-2 hover:text-[var(--semantic-accent)] hover:underline"
            >
              Brain check-in (Dashboard)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Meter({ label, value }: { label: string; value: number | null }) {
  const pct = value ?? 50;
  const display = value != null ? `${value}%` : "—";
  return (
    <div>
      <div className="mb-1 flex justify-between text-[11px] text-[var(--text-muted)]">
        <span>{label}</span>
        <span className="tabular-nums text-[var(--text-secondary)]">{display}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--card-border)]/80">
        <div
          className={`h-full rounded-full transition-all ${
            value == null ? "bg-[var(--text-muted)]/40" : "bg-gradient-to-r from-cyan-500/90 to-[var(--semantic-accent)]"
          }`}
          style={{ width: `${value == null ? 35 : pct}%` }}
        />
      </div>
    </div>
  );
}
