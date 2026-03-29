"use client";

import { useId } from "react";
import { EnergyRing } from "@/components/hud-test/EnergyRing";
import { PolygonHudMeter } from "@/components/visual-lab/VisualLabPolygonMeters";

/** Zelfde semantiek als budget hero: resterend % boog, euro in het midden. */
const REF = {
  remainingPct: 58,
  spentPct: 42,
  labelPct: "58%",
  valueEuro: "€186,42",
  mode: "green" as const,
  statusLabel: "Gecontroleerd",
  statusPill:
    "border-cyan-400/35 bg-cyan-950/25 text-cyan-100",
};

/** Resterend + uitgegeven als twee kleuren op dezelfde cirkel (pathLength 100). */
function BudgetTwinToneRing({
  remainingPct,
  spentPct,
  size = 188,
  labelPct,
  valueEuro,
}: {
  remainingPct: number;
  spentPct: number;
  size?: number;
  labelPct: string;
  valueEuro: string;
}) {
  const uid = useId().replace(/:/g, "");
  const idSpent = `lab-budget-spent-${uid}`;
  const idRem = `lab-budget-rem-${uid}`;
  const idGlow = `lab-budget-glow-${uid}`;
  const c = size / 2;
  const r = (size - 14) / 2;
  return (
    <div className="relative flex flex-col items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible" aria-hidden>
        <defs>
          <linearGradient id={idSpent} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
          <linearGradient id={idRem} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5eead4" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <filter id={idGlow} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle
          cx={c}
          cy={c}
          r={r + 10}
          fill="rgba(var(--mode-rgb),0.08)"
          style={{ filter: "blur(8px)" }}
        />
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={12}
          pathLength={100}
        />
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke={`url(#${idSpent})`}
          strokeWidth={11}
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${spentPct} ${100 - spentPct + 0.001}`}
          filter={`url(#${idGlow})`}
        />
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke={`url(#${idRem})`}
          strokeWidth={11}
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${remainingPct} ${100 - remainingPct + 0.001}`}
          strokeDashoffset={-spentPct}
          style={{ filter: "drop-shadow(0 0 12px rgba(6,182,212,0.45))" }}
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Resterend</span>
        <span className="mt-0.5 text-lg font-bold tabular-nums text-[var(--text-primary)]">{labelPct}</span>
        <span className="mt-0.5 text-sm font-semibold tabular-nums text-[var(--semantic-accent)]">{valueEuro}</span>
      </div>
      <p className="absolute -bottom-6 left-1/2 w-max -translate-x-1/2 text-[9px] text-[var(--text-muted)]">
        Oranje = uitgegeven · cyan = resterend
      </p>
    </div>
  );
}

function BudgetLinearRemainingMeter({
  remainingPct,
  valueEuro,
  spentEuroLabel,
}: {
  remainingPct: number;
  valueEuro: string;
  spentEuroLabel: string;
}) {
  return (
    <div className="w-full max-w-[280px] space-y-2">
      <div className="flex items-end justify-between gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
        <span>Resterend deze cyclus</span>
        <span className="tabular-nums text-[var(--accent-focus)]">{remainingPct}%</span>
      </div>
      <div className="relative h-4 overflow-hidden rounded-full border border-[rgba(var(--mode-rgb),0.2)] bg-[rgba(6,18,30,0.75)] shadow-[inset_0_2px_6px_rgba(0,0,0,0.45)]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[rgba(var(--mode-rgb),0.25)] via-[var(--semantic-accent)] to-emerald-400/95 shadow-[0_0_18px_rgba(var(--mode-rgb),0.35)]"
          style={{ width: `${remainingPct}%` }}
        />
      </div>
      <div className="flex justify-between gap-2 text-[10px] tabular-nums text-[var(--text-secondary)]">
        <span className="font-semibold text-[var(--text-primary)]">{valueEuro}</span>
        <span>Uitgegeven {spentEuroLabel}</span>
      </div>
      <p className="text-[9px] leading-snug text-[var(--text-muted)]">Zelfde cijfers als hero; horizontaal i.p.v. boog.</p>
    </div>
  );
}

/**
 * Referentie: zelfde EnergyRing-config als `RemainingBudgetHero` (+ alternatieven voor /budget).
 */
export function VisualLabBudgetStatusAlternatives() {
  return (
    <div className="space-y-6">
      <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
        Op <span className="text-[var(--text-muted)]">/budget</span> toont{" "}
        <span className="font-medium text-[var(--text-primary)]">RemainingBudgetHero</span> een{" "}
        <code className="rounded bg-black/25 px-1 text-[10px]">EnergyRing</code> met{" "}
        <code className="rounded bg-black/25 px-1 text-[10px]">budgetHub</code>,{" "}
        <code className="rounded bg-black/25 px-1 text-[10px]">profileOrbit</code> en{" "}
        <code className="rounded bg-black/25 px-1 text-[10px]">softGlow</code> (±236px). Hier: zelfde props, kleinere demo +
        varianten.
      </p>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Referentie */}
        <article className="relative overflow-hidden rounded-xl border border-[rgba(var(--mode-rgb),0.14)] bg-gradient-to-b from-[rgba(var(--mode-rgb-deep),0.2)] via-[var(--bg-elevated)]/15 to-[var(--bg-primary)]/35 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_50%_0%,rgba(var(--mode-rgb),0.12),transparent_58%)]" aria-hidden />
          <div className="relative space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                Referentie · Budget command
              </h3>
              <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] ${REF.statusPill}`}>
                {REF.statusLabel}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <div className="relative">
                <div
                  className="absolute left-1/2 top-1/2 h-[118%] w-[118%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(var(--mode-rgb),0.14)_0%,transparent_62%)] blur-md"
                  aria-hidden
                />
                <div className="relative drop-shadow-[0_14px_36px_rgba(0,0,0,0.5)]">
                  <EnergyRing
                    softGlow
                    profileOrbit
                    budgetHub
                    centerTag="Resterend"
                    size={200}
                    progress={REF.remainingPct}
                    label={REF.labelPct}
                    value={REF.valueEuro}
                    mode={REF.mode}
                  />
                </div>
              </div>
              <p className="mt-2 max-w-[260px] text-center text-[10px] leading-relaxed text-[var(--text-muted)]">
                Mock: <span className="tabular-nums">€450,00</span> spendable ·{" "}
                <span className="tabular-nums">€263,58</span> uitgegeven — net als de ondertekst op de echte pagina.
              </p>
            </div>
          </div>
        </article>

        {/* Compact zonder breed middenveld */}
        <article className="relative overflow-hidden rounded-xl border border-[rgba(var(--mode-rgb),0.14)] bg-[rgba(4,12,22,0.45)] p-4">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Compact ring</h3>
          <p className="mt-1 text-[10px] leading-relaxed text-[var(--text-secondary)]">
            Zelfde modus en %, geen <code className="text-[9px]">budgetHub</code> — voor dichtere layouts.
          </p>
          <div className="mt-4 flex justify-center">
            <EnergyRing
              softGlow
              profileOrbit
              size={148}
              progress={REF.remainingPct}
              label={REF.labelPct}
              value={REF.valueEuro}
              mode={REF.mode}
            />
          </div>
        </article>

        {/* Twee toon */}
        <article className="relative overflow-hidden rounded-xl border border-[rgba(var(--mode-rgb),0.14)] bg-[rgba(4,12,22,0.45)] p-4 pb-10">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Dubbele kleur · boog</h3>
          <p className="mt-1 text-[10px] leading-relaxed text-[var(--text-secondary)]">
            Uitgegeven en resterend tegelijk zichtbaar (niet in productie).
          </p>
          <div className="mt-5 flex justify-center">
            <BudgetTwinToneRing
              remainingPct={REF.remainingPct}
              spentPct={REF.spentPct}
              labelPct={REF.labelPct}
              valueEuro={REF.valueEuro}
            />
          </div>
        </article>

        {/* Lineair */}
        <article className="relative overflow-hidden rounded-xl border border-[rgba(var(--mode-rgb),0.14)] bg-[rgba(4,12,22,0.45)] p-4">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Lineaire meter</h3>
          <div className="mt-4 flex justify-center">
            <BudgetLinearRemainingMeter
              remainingPct={REF.remainingPct}
              valueEuro={REF.valueEuro}
              spentEuroLabel="€263,58"
            />
          </div>
        </article>

        {/* Tank met vierkant */}
        <article className="relative overflow-hidden rounded-xl border border-[rgba(var(--mode-rgb),0.14)] bg-[rgba(4,12,22,0.45)] p-4 lg:col-span-2">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Tank-metaphor · polygon</h3>
          <p className="mt-1 text-[10px] text-[var(--text-secondary)]">
            Zelfde percentage als vloeistof in een HUD-tank; euro eronder (alleen lab).
          </p>
          <div className="mt-4 flex flex-wrap items-end justify-center gap-10">
            <PolygonHudMeter variant="square" label="Resterend" value={REF.valueEuro} pct={REF.remainingPct} style="fill" />
            <div className="max-w-[220px] pb-2 text-[10px] leading-relaxed text-[var(--text-muted)]">
              Vierkant past bij &quot;capaciteit&quot;; hex kun je via Polygon meters hierboven vergelijken.
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
