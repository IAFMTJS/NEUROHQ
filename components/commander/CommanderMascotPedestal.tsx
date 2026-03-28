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
  /** Mascotte + badge; boven de booglaag. */
  children: ReactNode;
};

/** Reference cap for budget arc fill (5000 in major units → full right quarter). */
const BUDGET_ARC_CAP_CENTS = 500_000;

function budgetArcRatio(cents: number): number {
  if (cents < 0) return 0.15;
  return Math.min(1, cents / BUDGET_ARC_CAP_CENTS);
}

/** Wide viewBox: boog bijna rand-tot-rand (breder). */
const VB_W = 1000;
const VB_MIN_Y = -275;
const VB_VIEW_H = 548;
const CX = 500;
const CY = 242;
/** ~499px radius → eindpunten op x≈1 en x≈999 */
const R = 499;
const LX = CX - R;
const RX = CX + R;
const TY = CY - R;
const leftArcD = `M ${LX} ${CY} A ${R} ${R} 0 0 1 ${CX} ${TY}`;
const rightArcD = `M ${CX} ${TY} A ${R} ${R} 0 0 1 ${RX} ${CY}`;
const STROKE_TRACK = 28;
const STROKE_FILL = 24;
const pathLen = 100;

const labelBox =
  "max-w-[min(46%,11.5rem)] rounded-lg border border-[var(--card-border)]/45 bg-[var(--bg-surface)]/82 px-2 py-1.5 shadow-sm backdrop-blur-md";

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
        {/* Boog + labels op de boog (zelfde vlak, breder dan voorheen) */}
        <div
          className="commander-mascot-pedestal-arc-wrap pointer-events-none absolute left-1/2 z-0 w-[calc(100%+12px)] min-w-full max-w-none -translate-x-1/2"
          style={{
            bottom: "5%",
            height: "min(16.5rem, 58vw)",
            minHeight: "8.5rem",
          }}
        >
          <svg
            className="commander-mascot-pedestal-arc absolute inset-0 h-full w-full"
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

          <div className="commander-mascot-pedestal-labels pointer-events-none absolute inset-0 flex items-end justify-between gap-1 px-1 pb-[10%] pt-6 sm:gap-2 sm:px-2 sm:pb-[11%]">
            <Link
              href="/xp"
              className={`${labelBox} pointer-events-auto text-left no-underline transition-opacity hover:opacity-95`}
            >
              <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">Level & XP</p>
              <span className="mt-0.5 block text-[var(--text-secondary)]">
                <span className="block text-xs font-bold tabular-nums text-[var(--text-primary)] sm:text-sm">Lv {displayLevel}</span>
                <span className="text-[10px] tabular-nums text-[var(--text-secondary)] sm:text-xs">
                  {current}/{needed} XP
                </span>
              </span>
              <p className="mt-1 text-[9px] leading-tight text-[var(--text-muted)] sm:text-[10px]">
                Linkerhelft = voortgang naar volgend level.
              </p>
            </Link>
            <Link
              href="/budget"
              className={`${labelBox} pointer-events-auto text-right no-underline transition-opacity hover:opacity-95`}
            >
              <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">Budget</p>
              <span className="mt-0.5 block text-[var(--text-secondary)]">
                <span className="block text-xs font-bold tabular-nums text-[var(--text-primary)] sm:text-sm">
                  {isNegative && "−"}
                  {symbol}
                  {amount.toFixed(0)}
                </span>
                <span className="text-[10px] text-[var(--text-secondary)] sm:text-xs">
                  {isNegative ? "over budget" : "resterend"}
                </span>
              </span>
              <p className="mt-1 text-[9px] leading-tight text-[var(--text-muted)] sm:text-[10px]">
                Rechterhelft = restant (indicatie). Details op budget.
              </p>
            </Link>
          </div>
        </div>

        <div className="relative z-[5] w-full">{children}</div>
      </div>
    </div>
  );
}
