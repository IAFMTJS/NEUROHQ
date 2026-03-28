"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { getCurrencySymbol } from "@/lib/utils/currency";
import { xpProgressInLevel, xpRangeForNextLevel } from "@/lib/xp";

export type CommanderMascotPedestalStats = {
  totalXP: number;
  displayLevel: number;
  budgetRemainingCents: number;
  currency: string;
};

type Props = {
  stats: CommanderMascotPedestalStats;
  /** Mascotte + badge; wordt boven de footer en vóór de boog getekend. */
  children: ReactNode;
};

/** Reference cap for budget arc fill (5000 in major units → full right quarter). */
const BUDGET_ARC_CAP_CENTS = 500_000;

function budgetArcRatio(cents: number): number {
  if (cents < 0) return 0.15;
  return Math.min(1, cents / BUDGET_ARC_CAP_CENTS);
}

/** Wide viewBox: shallow “orbit” behind the mascot, stretched to card width. */
const VB_W = 1000;
/** Include negative Y so the full semicircle is drawable (not clipped). */
const VB_MIN_Y = -235;
const VB_VIEW_H = 485;
const CX = 500;
const CY = 235;
const R = 455;
const LX = CX - R;
const RX = CX + R;
const TY = CY - R;
const leftArcD = `M ${LX} ${CY} A ${R} ${R} 0 0 1 ${CX} ${TY}`;
const rightArcD = `M ${CX} ${TY} A ${R} ${R} 0 0 1 ${RX} ${CY}`;
const STROKE_TRACK = 26;
const STROKE_FILL = 22;
const pathLen = 100;

export function CommanderMascotPedestal({ stats, children }: Props) {
  const { totalXP, displayLevel, budgetRemainingCents, currency } = stats;
  const { current, needed } = xpRangeForNextLevel(totalXP);
  const xpPct = xpProgressInLevel(totalXP);
  const budgetPct = budgetArcRatio(budgetRemainingCents);

  const symbol = getCurrencySymbol(currency);
  const amount = Math.abs(budgetRemainingCents) / 100;
  const isNegative = budgetRemainingCents < 0;

  return (
    <div
      className="commander-mascot-pedestal commander-mascot-orbit relative w-full max-w-none overflow-visible"
      role="group"
      aria-label={`Level ${displayLevel}, ${current} van ${needed} XP. Budget: ${isNegative ? "−" : ""}${symbol}${amount.toFixed(0)} ${isNegative ? "over" : "rest"}.`}
    >
      <div className="relative isolate w-full overflow-visible">
        {/* Platte brede boog achter de mascotte; volle kaartbreedte */}
        <svg
          className="commander-mascot-pedestal-arc pointer-events-none absolute left-1/2 z-0 w-[calc(100%+2px)] min-w-full max-w-none -translate-x-1/2"
          style={{
            bottom: "6%",
            height: "min(13.5rem, 52vw)",
            minHeight: "7.5rem",
          }}
          viewBox={`0 ${VB_MIN_Y} ${VB_W} ${VB_VIEW_H}`}
          preserveAspectRatio="none"
          fill="none"
          aria-hidden
        >
          <path
            d={leftArcD}
            stroke="rgba(var(--mode-rgb, 0, 212, 255), 0.14)"
            strokeWidth={STROKE_TRACK}
            strokeLinecap="round"
          />
          <path
            d={rightArcD}
            stroke="rgba(var(--mode-rgb, 0, 212, 255), 0.14)"
            strokeWidth={STROKE_TRACK}
            strokeLinecap="round"
          />
          <path
            d={leftArcD}
            stroke="rgba(var(--mode-rgb, 0, 212, 255), 0.92)"
            strokeWidth={STROKE_FILL}
            strokeLinecap="round"
            pathLength={pathLen}
            strokeDasharray={`${Math.max(0.25, xpPct * pathLen)} ${pathLen}`}
          />
          <path
            d={rightArcD}
            stroke={isNegative ? "rgba(248, 113, 113, 0.92)" : "rgba(167, 139, 250, 0.92)"}
            strokeWidth={STROKE_FILL}
            strokeLinecap="round"
            pathLength={pathLen}
            strokeDasharray={`${Math.max(0.25, budgetPct * pathLen)} ${pathLen}`}
          />
        </svg>

        <div className="relative z-[5] w-full">{children}</div>
      </div>

      <div className="commander-mascot-pedestal-footer relative z-10 mt-1 w-full px-0.5 sm:px-1">
        <div className="flex items-start justify-between gap-3 border-t border-[var(--card-border)]/35 pt-2.5">
          <div className="min-w-0 flex-1 text-left">
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">Level & XP</p>
            <Link
              href="/xp"
              className="mt-0.5 block text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
              <span className="block text-sm font-semibold tabular-nums text-[var(--text-primary)]">Lv {displayLevel}</span>
              <span className="text-xs tabular-nums text-[var(--text-secondary)]">
                {current} / {needed} XP
              </span>
            </Link>
            <p className="mt-1 max-w-[14rem] text-[10px] leading-snug text-[var(--text-muted)]">
              Linker boog: voortgang naar je volgende level. Tik voor XP-overzicht.
            </p>
          </div>
          <div className="min-w-0 max-w-[48%] shrink-0 text-right">
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">Budget</p>
            <Link
              href="/budget"
              className="mt-0.5 block text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
              <span className="block text-sm font-semibold tabular-nums text-[var(--text-primary)]">
                {isNegative && "−"}
                {symbol}
                {amount.toFixed(0)}
              </span>
              <span className="text-xs text-[var(--text-secondary)]">{isNegative ? "over budget" : "resterend"}</span>
            </Link>
            <p className="mt-1 ml-auto max-w-[14rem] text-[10px] leading-snug text-[var(--text-muted)]">
              Rechter boog: resterend bedrag (indicatie; vol totaal op de budgetpagina). Tik om bij te werken.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
