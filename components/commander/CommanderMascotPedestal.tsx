"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getCurrencySymbol } from "@/lib/utils/currency";
import { xpRangeForNextLevel } from "@/lib/xp";
import { CommanderVerticalResourcePies } from "./CommanderVerticalResourcePies";

export type CommanderMascotPedestalStats = {
  totalXP: number;
  displayLevel: number;
  budgetRemainingCents: number;
  currency: string;
  energyPct: number;
  focusPct: number;
  loadPct: number;
  /** 1–10 voor sublabel; anders afgeleid uit % */
  energy1to10?: number;
  focus1to10?: number;
  load1to10?: number;
};

type Props = {
  stats: CommanderMascotPedestalStats;
  children: ReactNode;
  /** Zonder resource-meter (alleen mascotte-vlak); o.a. visual lab alternatieven. */
  showResourceArc?: boolean;
};

const cardClass =
  "commander-pedestal-hud-card commander-pedestal-band-card pointer-events-auto block w-full max-w-none rounded-lg border px-1.5 py-1.5 text-center backdrop-blur-md no-underline outline-none transition-transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-[var(--accent-focus)]/55 sm:rounded-xl sm:px-2 sm:py-2";

function clampPct(n: number) {
  return Math.min(100, Math.max(0, n));
}

export function CommanderMascotPedestal({ stats, children, showResourceArc = true }: Props) {
  const {
    totalXP,
    displayLevel,
    budgetRemainingCents,
    currency,
    energyPct,
    focusPct,
    loadPct,
  } = stats;

  const { current, needed } = xpRangeForNextLevel(totalXP);
  const ePct = clampPct(energyPct);
  const fPct = clampPct(focusPct);
  const lPct = clampPct(loadPct);

  const symbol = getCurrencySymbol(currency);
  const amount = Math.abs(budgetRemainingCents) / 100;
  const isNegative = budgetRemainingCents < 0;

  const prevLoad = useRef(loadPct);
  const [loadPulse, setLoadPulse] = useState(false);
  useEffect(() => {
    let t: number | undefined;
    if (loadPct > prevLoad.current + 2) {
      setLoadPulse(true);
      t = window.setTimeout(() => setLoadPulse(false), 1600);
    }
    prevLoad.current = loadPct;
    return () => {
      if (t !== undefined) window.clearTimeout(t);
    };
  }, [loadPct]);

  const ariaBand = showResourceArc
    ? `Resourcemeter links: Energy ${ePct}%, Focus ${fPct}%, Load ${lPct}%. XP level ${displayLevel}, ${current} van ${needed}. Budget ${isNegative ? "−" : ""}${symbol}${amount.toFixed(0)}. Brain status-cirkels onder de mascotte.`
    : `Mascotte. Energy ${ePct}%, Focus ${fPct}%, Load ${lPct}%. XP level ${displayLevel}.`;

  const xpLink = (
    <Link href="/profile" className={cardClass}>
      <span className="block text-[8px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)] sm:text-[9px]">XP</span>
      <span className="mt-0.5 block text-[12px] font-bold tabular-nums leading-tight text-[var(--text-primary)] sm:text-[13px]">
        Lv {displayLevel}
      </span>
      <span className="mt-0.5 block text-[9px] tabular-nums text-[var(--text-secondary)] sm:text-[10px]">
        {current}/{needed}
      </span>
    </Link>
  );

  const budgetLink = (
    <Link href="/budget" className={cardClass}>
      <span className="block text-[8px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)] sm:text-[9px]">Budget</span>
      <span className="mt-0.5 block text-[12px] font-bold tabular-nums leading-tight text-[var(--text-primary)] sm:text-[13px]">
        {isNegative && "−"}
        {symbol}
        {amount.toFixed(0)}
      </span>
      <span className="mt-0.5 block text-[10px] text-[var(--text-secondary)] sm:text-[11px]">
        {isNegative ? "over" : "rest"}
      </span>
    </Link>
  );

  return (
    <div
      className="commander-mascot-pedestal commander-mascot-platform relative mx-auto w-full overflow-visible pb-4 sm:pb-5"
      role="group"
      aria-label={ariaBand}
    >
      <div
        className={
          showResourceArc
            ? "commander-mascot-pedestal-donut-stage relative mx-auto w-full min-h-0 overflow-visible"
            : "commander-mascot-pedestal-donut-stage relative mx-auto w-full min-h-0 overflow-visible pb-3 sm:pb-4"
        }
      >
        {showResourceArc ? (
          <div className="commander-mascot-pedestal-hero-row mx-auto flex w-full max-w-[min(400px,100%)] items-center justify-center gap-2 sm:max-w-[min(440px,100%)] sm:gap-3">
            <CommanderVerticalResourcePies
              energyPct={ePct}
              focusPct={fPct}
              loadPct={lPct}
              loadPulse={loadPulse}
              xpLink={xpLink}
              budgetLink={budgetLink}
            />
            <div className="flex min-w-0 flex-1 flex-col items-center">
              <div className="commander-mascot-pedestal-mascot relative z-[14] mx-auto w-full max-w-[min(320px,88vw)] shrink-0 px-1 sm:-mb-2 lg:-mb-3">
                {children}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="commander-mascot-pedestal-mascot relative z-[14] mx-auto mb-0 w-full max-w-[min(280px,80vw)] shrink-0 px-1">
              {children}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
