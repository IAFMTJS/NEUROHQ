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
  children: ReactNode;
};

const BUDGET_ARC_CAP_CENTS = 500_000;

function budgetArcRatio(cents: number): number {
  if (cents < 0) return 0.15;
  return Math.min(1, cents / BUDGET_ARC_CAP_CENTS);
}

/**
 * Geometrisch correcte halve cirkel: diameter onderaan, boog naar boven.
 * viewBox 400×200 → center (200,200), r=200, van (0,200) via (200,0) naar (400,200).
 */
const VB_W = 400;
const VB_H = 200;
const CX = 200;
const CY = 200;
const R = 200;
const leftArcD = `M 0 ${CY} A ${R} ${R} 0 0 1 ${CX} 0`;
const rightArcD = `M ${CX} 0 A ${R} ${R} 0 0 1 ${VB_W} ${CY}`;
const STROKE_TRACK = 16;
const STROKE_FILL = 13;
const pathLen = 100;

const statLinkBase =
  "pointer-events-auto max-w-[42%] rounded-lg px-2 py-1 no-underline outline-none transition-colors hover:bg-[var(--bg-surface)]/40 focus-visible:ring-2 focus-visible:ring-[var(--accent-focus)]/60 sm:px-2.5";

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
        <div
          className="commander-mascot-pedestal-arc-wrap pointer-events-none absolute left-1/2 z-0 w-full min-w-0 max-w-full -translate-x-1/2"
          style={{
            bottom: "4%",
            width: "min(100%, 36rem)",
          }}
        >
          {/* Halve cirkel: uniforme schaal (geen preserveAspectRatio none → geen platgedrukte ellips) */}
          <div
            className="relative mx-auto w-full overflow-visible"
            style={{ aspectRatio: `${VB_W} / ${VB_H}`, maxHeight: "min(11rem, 38vw)" }}
          >
            <svg
              className="commander-mascot-pedestal-arc absolute inset-0 block h-full w-full"
              viewBox={`0 0 ${VB_W} ${VB_H}`}
              preserveAspectRatio="xMidYMax meet"
              aria-hidden
            >
              <g className="commander-orbit-arc-path" fill="none">
                <path
                  d={leftArcD}
                  stroke="rgba(var(--mode-rgb, 0, 212, 255), 0.16)"
                  strokeWidth={STROKE_TRACK}
                  strokeLinecap="round"
                />
                <path
                  d={rightArcD}
                  stroke="rgba(var(--mode-rgb, 0, 212, 255), 0.16)"
                  strokeWidth={STROKE_TRACK}
                  strokeLinecap="round"
                />
                <path
                  d={leftArcD}
                  stroke="rgba(var(--mode-rgb, 0, 212, 255), 0.9)"
                  strokeWidth={STROKE_FILL}
                  strokeLinecap="round"
                  pathLength={pathLen}
                  strokeDasharray={`${Math.max(0.25, xpPct * pathLen)} ${pathLen}`}
                />
                <path
                  d={rightArcD}
                  stroke={isNegative ? "rgba(248, 113, 113, 0.9)" : "rgba(167, 139, 250, 0.9)"}
                  strokeWidth={STROKE_FILL}
                  strokeLinecap="round"
                  pathLength={pathLen}
                  strokeDasharray={`${Math.max(0.25, budgetPct * pathLen)} ${pathLen}`}
                />
              </g>
            </svg>

            {/* Waarden als normale tekst op de boog (geen SVG-tekst → geen rekken/vervorming) */}
            <div className="pointer-events-none absolute inset-0 flex items-end justify-between gap-2 px-1 pb-[6%] pt-10 sm:px-2 sm:pb-[7%]">
              <Link
                href="/xp"
                className={`${statLinkBase} text-left [text-shadow:0_1px_10px_rgba(0,0,0,0.55)]`}
              >
                <span className="block text-sm font-bold tabular-nums text-[var(--text-primary)] sm:text-base">
                  Lv {displayLevel}
                </span>
                <span className="mt-0.5 block text-xs tabular-nums text-[var(--text-secondary)] sm:text-sm">
                  {current}/{needed} XP
                </span>
              </Link>
              <Link
                href="/budget"
                className={`${statLinkBase} text-right [text-shadow:0_1px_10px_rgba(0,0,0,0.55)]`}
              >
                <span className="block text-sm font-bold tabular-nums text-[var(--text-primary)] sm:text-base">
                  {isNegative && "−"}
                  {symbol}
                  {amount.toFixed(0)}
                </span>
                <span className="mt-0.5 block text-xs text-[var(--text-secondary)] sm:text-sm">
                  {isNegative ? "over" : "rest"}
                </span>
              </Link>
            </div>
          </div>
        </div>

        <div className="relative z-[5] w-full">{children}</div>
      </div>
    </div>
  );
}
