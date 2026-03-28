"use client";

import type { ReactNode } from "react";
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

const VB_W = 1000;
const VB_MIN_Y = -275;
const VB_VIEW_H = 548;
const CX = 500;
const CY = 242;
const R = 499;
const LX = CX - R;
const RX = CX + R;
const TY = CY - R;
const leftArcD = `M ${LX} ${CY} A ${R} ${R} 0 0 1 ${CX} ${TY}`;
const rightArcD = `M ${CX} ${TY} A ${R} ${R} 0 0 1 ${RX} ${CY}`;
const STROKE_TRACK = 28;
const STROKE_FILL = 24;
const pathLen = 100;

/** Text stroke for contrast on busy background (viewBox units). */
const TEXT_STROKE = "rgba(15, 23, 42, 0.5)";
const TEXT_STROKE_W = 5;

export function CommanderMascotPedestal({ stats, children }: Props) {
  const { totalXP, displayLevel, budgetRemainingCents, currency } = stats;
  const { current, needed } = xpRangeForNextLevel(totalXP);
  const xpPct = xpProgressInLevel(totalXP);
  const budgetPct = budgetArcRatio(budgetRemainingCents);

  const symbol = getCurrencySymbol(currency);
  const amount = Math.abs(budgetRemainingCents) / 100;
  const isNegative = budgetRemainingCents < 0;

  const budgetLine1 = `${isNegative ? "−" : ""}${symbol}${amount.toFixed(0)}`;
  const budgetLine2 = isNegative ? "over" : "rest";

  return (
    <div
      className="commander-mascot-pedestal commander-mascot-orbit relative w-full max-w-none overflow-visible"
      role="group"
      aria-label={`Level ${displayLevel}, ${current} van ${needed} XP. Budget: ${budgetLine1} ${budgetLine2}.`}
    >
      <div className="relative isolate w-full overflow-visible">
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
            aria-hidden
          >
            <defs>
              <style>{`
                .commander-orbit-arc-path { pointer-events: none; }
                .commander-orbit-hit { pointer-events: auto; cursor: pointer; }
                .commander-orbit-hit:focus { outline: none; }
                .commander-orbit-hit:focus rect { stroke: rgba(var(--mode-rgb, 0, 212, 255), 0.6); stroke-width: 2; }
              `}</style>
            </defs>

            <g className="commander-orbit-arc-path" fill="none">
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
            </g>

            {/* Waarden in de boog; geen aparte uitlegteksten */}
            <a href="/xp" className="commander-orbit-hit" aria-label={`Level ${displayLevel}, ${current} van ${needed} XP`}>
              <rect x={LX - 4} y={CY - 88} width={290} height={102} fill="transparent" rx={8} />
              <text
                x={LX + 26}
                y={CY - 22}
                fill="var(--text-primary)"
                fontSize={44}
                fontWeight={700}
                fontFamily="var(--font-sans), system-ui, sans-serif"
                stroke={TEXT_STROKE}
                strokeWidth={TEXT_STROKE_W}
                paintOrder="stroke fill"
              >
                {`Lv ${displayLevel}`}
              </text>
              <text
                x={LX + 26}
                y={CY + 18}
                fill="var(--text-secondary)"
                fontSize={28}
                fontWeight={600}
                fontFamily="var(--font-sans), ui-monospace, monospace"
                stroke={TEXT_STROKE}
                strokeWidth={3}
                paintOrder="stroke fill"
              >
                {`${current}/${needed}`}
              </text>
            </a>

            <a href="/budget" className="commander-orbit-hit" aria-label={`Budget ${budgetLine1} ${budgetLine2}`}>
              <rect x={RX - 286} y={CY - 88} width={290} height={102} fill="transparent" rx={8} />
              <text
                textAnchor="end"
                x={RX - 26}
                y={CY - 22}
                fill="var(--text-primary)"
                fontSize={44}
                fontWeight={700}
                fontFamily="var(--font-sans), system-ui, sans-serif"
                stroke={TEXT_STROKE}
                strokeWidth={TEXT_STROKE_W}
                paintOrder="stroke fill"
              >
                {budgetLine1}
              </text>
              <text
                textAnchor="end"
                x={RX - 26}
                y={CY + 18}
                fill="var(--text-secondary)"
                fontSize={28}
                fontWeight={600}
                fontFamily="var(--font-sans), system-ui, sans-serif"
                stroke={TEXT_STROKE}
                strokeWidth={3}
                paintOrder="stroke fill"
              >
                {budgetLine2}
              </text>
            </a>
          </svg>
        </div>

        <div className="relative z-[5] w-full">{children}</div>
      </div>
    </div>
  );
}
