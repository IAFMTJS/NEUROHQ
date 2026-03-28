"use client";

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
};

/** Reference cap for budget arc fill (5000 in major units → full right quarter). */
const BUDGET_ARC_CAP_CENTS = 500_000;

function budgetArcRatio(cents: number): number {
  if (cents < 0) return 0.15;
  return Math.min(1, cents / BUDGET_ARC_CAP_CENTS);
}

export function CommanderMascotPedestal({ stats }: Props) {
  const { totalXP, displayLevel, budgetRemainingCents, currency } = stats;
  const { current, needed } = xpRangeForNextLevel(totalXP);
  const xpPct = xpProgressInLevel(totalXP);
  const budgetPct = budgetArcRatio(budgetRemainingCents);

  const symbol = getCurrencySymbol(currency);
  const amount = Math.abs(budgetRemainingCents) / 100;
  const isNegative = budgetRemainingCents < 0;

  const vbW = 200;
  const cx = 100;
  const cy = 60;
  const r = 58;
  const lx = cx - r;
  const rx = cx + r;
  const ty = cy - r;
  const leftArcD = `M ${lx} ${cy} A ${r} ${r} 0 0 1 ${cx} ${ty}`;
  const rightArcD = `M ${cx} ${ty} A ${r} ${r} 0 0 1 ${rx} ${cy}`;
  const pathLen = 100;

  return (
    <div
      className="commander-mascot-pedestal mx-auto w-full max-w-[min(320px,88vw)] -mt-3 pt-1"
      role="group"
      aria-label={`Level ${displayLevel}, ${current} van ${needed} XP. Budget: ${isNegative ? "−" : ""}${symbol}${amount.toFixed(0)} ${isNegative ? "over" : "rest"}.`}
    >
      <svg
        className="mx-auto block h-[52px] w-full max-w-[280px]"
        viewBox={`0 0 ${vbW} 72`}
        fill="none"
        aria-hidden
      >
        <path
          d={leftArcD}
          stroke="rgba(var(--mode-rgb, 0, 212, 255), 0.18)"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d={rightArcD}
          stroke="rgba(var(--mode-rgb, 0, 212, 255), 0.18)"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d={leftArcD}
          stroke="rgba(var(--mode-rgb, 0, 212, 255), 0.95)"
          strokeWidth="5"
          strokeLinecap="round"
          pathLength={pathLen}
          strokeDasharray={`${Math.max(0.2, xpPct * pathLen)} ${pathLen}`}
        />
        <path
          d={rightArcD}
          stroke={isNegative ? "rgba(248, 113, 113, 0.95)" : "rgba(167, 139, 250, 0.95)"}
          strokeWidth="5"
          strokeLinecap="round"
          pathLength={pathLen}
          strokeDasharray={`${Math.max(0.2, budgetPct * pathLen)} ${pathLen}`}
        />
      </svg>

      <div className="-mt-2 flex items-start justify-between gap-2 px-0.5 text-[10px] leading-tight">
        <Link
          href="/xp"
          className="min-w-0 flex-1 text-left text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
        >
          <span className="block font-semibold tabular-nums text-[var(--text-primary)]">Lv {displayLevel}</span>
          <span className="tabular-nums text-[var(--text-muted)]">
            {current}/{needed} XP
          </span>
        </Link>
        <Link
          href="/budget"
          className="min-w-0 shrink-0 text-right text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
        >
          <span className="block font-semibold tabular-nums text-[var(--text-primary)]">
            {isNegative && "−"}
            {symbol}
            {amount.toFixed(0)}
          </span>
          <span className="text-[var(--text-muted)]">{isNegative ? "over" : "rest"}</span>
        </Link>
      </div>
    </div>
  );
}
