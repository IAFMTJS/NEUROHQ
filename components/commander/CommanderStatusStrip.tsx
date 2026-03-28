"use client";

import Link from "next/link";
import { getCurrencySymbol } from "@/lib/utils/currency";
import { xpRangeForNextLevel } from "@/lib/xp";
import type { CommanderMascotPedestalStats } from "./CommanderMascotPedestal";

const cellClass =
  "commander-status-strip-cell commander-pedestal-hud-card commander-pedestal-band-card rounded-xl border px-2.5 py-2.5 backdrop-blur-md transition-transform hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-focus)]/50 sm:px-3 sm:py-3";

type Props = {
  stats: CommanderMascotPedestalStats;
};

/**
 * Drie kolommen onder de mascotte: links XP/level, midden gereserveerd, rechts budget.
 */
export function CommanderStatusStrip({ stats }: Props) {
  const { displayLevel, totalXP, budgetRemainingCents, currency } = stats;
  const { current, needed } = xpRangeForNextLevel(totalXP);
  const symbol = getCurrencySymbol(currency);
  const amount = Math.abs(budgetRemainingCents) / 100;
  const isNegative = budgetRemainingCents < 0;

  return (
    <section
      className="commander-status-strip relative z-10 mt-3 grid w-full max-w-lg grid-cols-3 gap-1.5 sm:gap-2"
      aria-label="Level, XP-voortgang en resterend budget"
    >
      <Link href="/xp" className={`${cellClass} min-w-0 flex min-h-[5rem] flex-col items-stretch justify-center text-left no-underline`}>
        <span className="text-[7px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)] sm:text-[8px]">XP</span>
        <span className="mt-0.5 text-sm font-bold tabular-nums text-[var(--text-primary)] sm:text-base">Lv {displayLevel}</span>
        <span className="mt-0.5 text-[10px] tabular-nums text-[var(--text-secondary)] sm:text-[11px]">
          {current}/{needed}
        </span>
      </Link>

      <div
        className="commander-status-strip-mid flex min-h-[5rem] min-w-0 items-center justify-center rounded-xl border border-dashed border-[var(--card-border)]/55 bg-[var(--bg-elevated)]/15"
        aria-hidden
      />

      <Link
        href="/budget"
        className={`${cellClass} min-w-0 flex min-h-[5rem] flex-col items-stretch justify-center text-right no-underline`}
      >
        <span className="text-[7px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)] sm:text-[8px]">Budget</span>
        <span className="mt-0.5 text-sm font-bold tabular-nums text-[var(--text-primary)] sm:text-base">
          {isNegative && "−"}
          {symbol}
          {amount.toFixed(0)}
        </span>
        <span className="mt-0.5 text-[10px] text-[var(--text-secondary)] sm:text-[11px]">{isNegative ? "over" : "rest"}</span>
      </Link>
    </section>
  );
}
