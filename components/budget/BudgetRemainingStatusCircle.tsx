"use client";

import { useEffect, useId, useState } from "react";

const SIZE = 176;
const STROKE = 12;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

type Props = {
  /** 0–100: share of spendable budget still remaining (clamped for arc). */
  arcPercent: number;
  /** Raw ratio for labels (can be negative). */
  remainingRatioDisplay: number;
  /** Center line 1 */
  amountLine: string;
  /** Whether spendable budget is defined */
  hasSpendable: boolean;
  isOverBudget: boolean;
};

/** Large HUD-style ring: full = green, approaches red near 0, below zero = red/black drama. */
export function BudgetRemainingStatusCircle({
  arcPercent,
  remainingRatioDisplay,
  amountLine,
  hasSpendable,
  isOverBudget,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const reactId = useId();
  const safeId = reactId.replace(/[:]/g, "-");
  const gradOverId = `budget-ring-over-${safeId}`;
  const filterGlowId = `budget-ring-glow-${safeId}`;

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const clampedArc = Math.min(100, Math.max(0, arcPercent));
  const offset = CIRC * (1 - clampedArc / 100);

  const tHealthy = hasSpendable && !isOverBudget ? clampedArc / 100 : 0;
  const hue = 142 * tHealthy;
  const sat = 78 + 14 * (1 - tHealthy);
  const light = 46 + 10 * (1 - tHealthy);
  const healthyStroke = `hsl(${hue}, ${sat}%, ${light}%)`;

  const pctLabel =
    hasSpendable && !isOverBudget
      ? `${Math.round(remainingRatioDisplay)}%`
      : isOverBudget
        ? `${Math.round(remainingRatioDisplay)}%`
        : "—";

  const aria = hasSpendable
    ? `Resterend ${amountLine}, ${pctLabel} van spendable budget`
    : "Geen spendable budget ingesteld";

  return (
    <div className="flex flex-col items-center gap-2" role="img" aria-label={aria}>
      <div className="relative" style={{ width: SIZE, height: SIZE }} aria-hidden>
        <svg width={SIZE} height={SIZE} className="-rotate-90" suppressHydrationWarning>
          <defs suppressHydrationWarning>
            {isOverBudget ? (
              <linearGradient id={gradOverId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#450a0a" />
                <stop offset="35%" stopColor="#dc2626" />
                <stop offset="65%" stopColor="#0a0a0a" />
                <stop offset="100%" stopColor="#991b1b" />
              </linearGradient>
            ) : null}
            <filter id={filterGlowId} x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation={isOverBudget ? 5 : 4} result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke="rgba(0,0,0,0.45)"
            strokeWidth={STROKE + 2}
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke="rgba(148,163,184,0.12)"
            strokeWidth={STROKE}
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke={isOverBudget ? `url(#${gradOverId})` : hasSpendable ? healthyStroke : "rgba(100,116,139,0.45)"}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={isOverBudget ? `${CIRC} ${CIRC}` : CIRC}
            strokeDashoffset={isOverBudget ? 0 : mounted ? offset : CIRC}
            filter={`url(#${filterGlowId})`}
            style={{
              transition: "stroke-dashoffset 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            }}
            suppressHydrationWarning
          />
          {isOverBudget && (
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R - STROKE / 2}
              fill="none"
              stroke="rgba(220,38,38,0.35)"
              strokeWidth={2}
              strokeDasharray="4 6"
              className="animate-pulse"
            />
          )}
        </svg>
        <div
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center rounded-full px-2 text-center"
          style={{
            background: isOverBudget
              ? "radial-gradient(ellipse 80% 80% at 50% 45%, rgba(40,10,10,0.85), rgba(5,5,8,0.92) 72%)"
              : "radial-gradient(ellipse 80% 80% at 50% 45%, rgba(15,22,35,0.55), rgba(5,8,14,0.88) 72%)",
          }}
        >
          <p
            className="max-w-[9.5rem] truncate text-[13px] font-bold leading-tight tabular-nums text-[var(--text-primary)] sm:max-w-[10rem] sm:text-sm"
            style={{
              textShadow: isOverBudget
                ? "0 0 14px rgba(248,113,113,0.45), 0 1px 2px rgba(0,0,0,0.9)"
                : "0 0 12px rgba(0,229,255,0.35), 0 1px 2px rgba(0,0,0,0.75)",
            }}
          >
            {amountLine}
          </p>
          <p
            className={`mt-1 text-[11px] font-semibold tabular-nums sm:text-xs ${
              isOverBudget ? "text-red-200/95" : "text-[var(--text-secondary)]"
            }`}
          >
            {pctLabel}
          </p>
        </div>
      </div>
    </div>
  );
}
