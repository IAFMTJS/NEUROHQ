"use client";

import { useId } from "react";
import type { QuarterEngineSnapshot } from "@/app/actions/quarter-engine-snapshot";
import { buildPillarCardModel } from "@/lib/strategy/command-pillar-summaries";
import type { PillarCardModel } from "@/lib/strategy/command-pillar-summaries";
import {
  EXECUTION_BEHAVIOR_LABELS_NL,
  normalizeExecutionBehaviorFocus,
} from "@/lib/strategy/execution-behavior";

function deg2rad(d: number) {
  return (d * Math.PI) / 180;
}

/** Annular sector in SVG coords (0° = right, clockwise); we pass standard math angles from top = -90°. */
function annularSectorPath(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  startDeg: number,
  endDeg: number
) {
  const a1 = deg2rad(startDeg);
  const a2 = deg2rad(endDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  const x0 = cx + rInner * Math.cos(a1);
  const y0 = cy + rInner * Math.sin(a1);
  const x1 = cx + rOuter * Math.cos(a1);
  const y1 = cy + rOuter * Math.sin(a1);
  const x2 = cx + rOuter * Math.cos(a2);
  const y2 = cy + rOuter * Math.sin(a2);
  const x3 = cx + rInner * Math.cos(a2);
  const y3 = cy + rInner * Math.sin(a2);
  return `M ${x0} ${y0} L ${x1} ${y1} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 ${largeArc} 0 ${x0} ${y0} Z`;
}

function pillarStatusClass(committed: boolean, pct: number) {
  if (!committed) return "bg-[var(--text-muted)]/45";
  if (pct >= 80) return "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.45)]";
  if (pct >= 60) return "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.35)]";
  return "bg-red-500/90 shadow-[0_0_10px_rgba(239,68,68,0.4)]";
}

type PillarKey = "budget" | "growth" | "xp" | "discipline";

type PillarSlice = {
  key: PillarKey;
  label: string;
  pct: number;
  committed: boolean;
  trackClass: string;
  progClass: string;
  swatchClass: string;
};

/** Donut segment + legenda: mode-tint voor budget, aparte hues per pijler (leesbaar in war/recovery). */
const PILLAR_VISUAL: Record<PillarKey, { trackClass: string; progClass: string; swatchClass: string }> = {
  budget: {
    trackClass: "fill-[rgba(var(--mode-rgb),0.14)]",
    progClass: "fill-[rgba(var(--mode-rgb-deep),0.9)]",
    swatchClass: "bg-[rgba(var(--mode-rgb-deep),0.85)]",
  },
  growth: {
    trackClass: "fill-emerald-400/14",
    progClass: "fill-emerald-400/88",
    swatchClass: "bg-emerald-400/80",
  },
  xp: {
    trackClass: "fill-violet-400/14",
    progClass: "fill-violet-400/85",
    swatchClass: "bg-violet-400/78",
  },
  discipline: {
    trackClass: "fill-amber-400/14",
    progClass: "fill-amber-300/88",
    swatchClass: "bg-amber-300/80",
  },
};

function QuarterCommandOverview({
  scorePct,
  pillars,
}: {
  scorePct: number;
  pillars: PillarSlice[];
}) {
  const filterId = useId().replace(/:/g, "");
  const cx = 64;
  const cy = 64;
  const rOuter = 54;
  const rInner = 30;
  const gapDeg = 5;
  const slot = 90;
  /** Clockwise from top (12u): top → right → bottom → left. */
  const baseStarts = [-135, -45, 45, 135].map((deg) => deg + gapDeg / 2);

  const p = Math.max(0, Math.min(100, Math.round(scorePct)));

  return (
    <div className="mx-auto max-w-md">
      <div className="relative mx-auto aspect-square w-full max-w-[220px] sm:max-w-[248px]">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 128 128"
          className="overflow-visible drop-shadow-[0_0_24px_rgba(var(--mode-rgb),0.12)]"
          role="img"
          aria-label={`Kwartaal contractscore ${p} procent, vier pijlers elk een kwart`}
        >
          <defs>
            <filter id={`hq-strategy-quarter-glow-${filterId}`} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="1.2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {pillars.map((pl, i) => {
            const start = baseStarts[i];
            const trackEnd = start + slot - gapDeg;
            const progSpan = (slot - gapDeg) * (pl.committed ? Math.max(0, Math.min(100, pl.pct)) / 100 : 0);
            const progEnd = start + progSpan;
            return (
              <g key={pl.key}>
                <path
                  d={annularSectorPath(cx, cy, rInner, rOuter, start, trackEnd)}
                  className={`transition-opacity duration-300 ${pl.trackClass}`}
                />
                {progSpan > 0.35 ? (
                  <path
                    d={annularSectorPath(cx, cy, rInner, rOuter, start, progEnd)}
                    filter={`url(#hq-strategy-quarter-glow-${filterId})`}
                    className={`transition-all duration-500 ease-out ${pl.progClass}`}
                  />
                ) : null}
              </g>
            );
          })}
          <circle
            cx={cx}
            cy={cy}
            r={rInner - 2}
            fill="rgba(4,12,22,0.92)"
            stroke="rgba(var(--mode-rgb),0.18)"
            strokeWidth="1"
          />
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-mono text-3xl font-bold tabular-nums text-[var(--text-primary)] sm:text-4xl">{p}</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">contract</span>
          <span className="mt-0.5 text-[9px] text-[var(--text-muted)]">4 × 25%</span>
        </div>
      </div>

      <ul className="mt-5 grid grid-cols-2 gap-2 sm:gap-3" aria-label="Pijlers in het kwartaaloverzicht">
        {pillars.map((pl) => (
          <li
            key={pl.key}
            className="flex items-center gap-2 rounded-xl border border-[rgba(var(--mode-rgb),0.12)] bg-[var(--bg-card)]/80 px-2.5 py-2 sm:px-3"
          >
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${pillarStatusClass(pl.committed, pl.pct)}`}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-[var(--text-primary)]">
                {pl.label}
              </p>
              <p className="font-mono text-xs tabular-nums text-[var(--text-secondary)]">
                {pl.committed ? `${pl.pct}%` : "—"}
              </p>
            </div>
            <span
              className={`h-4 w-4 shrink-0 rounded-sm border border-[rgba(var(--mode-rgb),0.2)] ${
                pl.committed ? pl.swatchClass : "bg-[var(--text-muted)]/20"
              }`}
              title={pl.label}
              aria-hidden
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function Bar({
  label,
  pct,
  committed,
  sub,
}: {
  label: string;
  pct: number;
  committed: boolean;
  sub: string;
}) {
  const w = committed ? Math.max(0, Math.min(100, pct)) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-end justify-between gap-2">
        <span className="text-xs font-semibold text-[var(--text-primary)]">{label}</span>
        <span className="font-mono text-xs tabular-nums text-[var(--text-secondary)]">
          {committed ? `${pct}%` : "—"}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-primary)]/80">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[rgba(var(--mode-rgb-deep),0.85)] to-[var(--semantic-accent)] transition-[width] duration-500"
          style={{ width: `${w}%` }}
        />
      </div>
      <p className="text-[10px] leading-snug text-[var(--text-muted)]">{sub}</p>
    </div>
  );
}

function PillarInsightCard({
  label,
  pct,
  committed,
  model,
}: {
  label: string;
  pct: number;
  committed: boolean;
  model: PillarCardModel;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-[var(--card-border)] bg-[var(--bg-elevated)]/85 p-4 shadow-[0_0_20px_rgba(0,0,0,0.04)]">
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-[rgba(var(--mode-rgb),0.1)] pb-2">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</h3>
        <div className="text-right">
          <p className="font-mono text-xl font-bold tabular-nums text-[var(--text-primary)]">
            {committed ? `${pct}%` : "—"}
          </p>
          <p className="text-[9px] font-medium uppercase tracking-wide text-[var(--text-muted)]">pijlerscore</p>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-[var(--text-secondary)]">{model.summary}</p>
      <p className="text-[10px] leading-snug text-[var(--text-muted)]">{model.scoreLine}</p>

      <div>
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--semantic-accent)]">Data dit kwartaal</p>
        <ul className="mt-1.5 list-inside list-disc space-y-1 text-[11px] leading-snug text-[var(--text-secondary)]">
          {model.dataLines.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-3 py-2.5">
          <p className="text-[9px] font-bold uppercase tracking-wide text-emerald-200/90">Wat goed gaat</p>
          {model.goodPoints.length > 0 ? (
            <ul className="mt-1.5 list-inside list-disc space-y-1 text-[11px] leading-snug text-[var(--text-secondary)]">
              {model.goodPoints.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-1.5 text-[11px] text-[var(--text-muted)]">Nog geen extra pluspunten — blijf meten.</p>
          )}
        </div>
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2.5">
          <p className="text-[9px] font-bold uppercase tracking-wide text-amber-100/90">Aandacht / verbeterplek</p>
          {model.badPoints.length > 0 ? (
            <ul className="mt-1.5 list-inside list-disc space-y-1 text-[11px] leading-snug text-[var(--text-secondary)]">
              {model.badPoints.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-1.5 text-[11px] text-[var(--text-muted)]">Geen harde waarschuwingen op basis van deze data.</p>
          )}
        </div>
      </div>
    </section>
  );
}

type Props = {
  snapshot: QuarterEngineSnapshot | null;
};

export function StrategyCommandTab({ snapshot }: Props) {
  if (!snapshot) {
    return (
      <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--bg-elevated)]/60 p-6 text-sm text-[var(--text-muted)]">
        Geen kwartaal-command beschikbaar. Controleer je actieve strategie en contract op het tabblad Contract.
      </div>
    );
  }

  const pct = snapshot.strategyScorePct;
  const execFocus = normalizeExecutionBehaviorFocus(snapshot.engineParams.execution?.behaviorFocus);
  const execMeta = EXECUTION_BEHAVIOR_LABELS_NL[execFocus];

  const bars = [
    {
      key: "budget" as const,
      label: "Spaardoel",
      pct: snapshot.budget.displayPct,
      committed: snapshot.budget.committed,
      sub: "Kwartaal t.o.v. spaarcommitment in contract",
    },
    {
      key: "growth" as const,
      label: "Leerdoel",
      pct: snapshot.growth.displayPct,
      committed: snapshot.growth.committed,
      sub: "Kwartaal: protocoltaken + leer-% uit contract",
    },
    {
      key: "xp" as const,
      label: "XP-doel",
      pct: snapshot.xp.displayPct,
      committed: snapshot.xp.committed,
      sub: "Kwartaal-XP t.o.v. doel in contract",
    },
    {
      key: "discipline" as const,
      label: execFocus === "balanced" ? "Executie & gedrag" : `${execMeta.title} (executie)`,
      pct: snapshot.discipline.displayPct,
      committed: snapshot.discipline.committed,
      sub: execMeta.measure,
    },
  ];

  const pillarSlices: PillarSlice[] = bars.map((b) => ({
    key: b.key,
    label: b.label,
    pct: b.pct,
    committed: b.committed,
    ...PILLAR_VISUAL[b.key],
  }));

  return (
    <div className="space-y-6">
      <section
        className="rounded-[22px] border border-[var(--card-border)] bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow-card)] sm:p-6"
        aria-label="Command"
      >
        <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--semantic-accent)]">
          Kwartaal · {snapshot.quarterLabel}
        </p>
        <div className="mt-4">
          <QuarterCommandOverview scorePct={pct} pillars={pillarSlices} />
        </div>
        <p className="mt-4 text-center text-sm text-[var(--text-secondary)]">
          Totaalscore over de vier contractpijlers (elk 25% in de engine).
        </p>

        <div className="mt-8 space-y-5 border-t border-[rgba(var(--mode-rgb),0.12)] pt-6">
          {bars.map((b) => (
            <Bar key={b.key} label={b.label} pct={b.pct} committed={b.committed} sub={b.sub} />
          ))}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        {bars.map((b) => (
          <PillarInsightCard
            key={b.key}
            label={b.label}
            pct={b.pct}
            committed={b.committed}
            model={buildPillarCardModel(snapshot, b.key)}
          />
        ))}
      </div>

      {snapshot.ruleLinesNl.length > 0 ? (
        <section className="rounded-xl border border-[rgba(var(--mode-rgb),0.2)] bg-[rgba(var(--mode-rgb-deep),0.08)] p-4">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--semantic-accent)]">
            Engine-regels actief
          </h3>
          <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-[var(--text-secondary)]">
            {snapshot.ruleLinesNl.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
