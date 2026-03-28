"use client";

import { useEffect, useId, useState } from "react";

const SIZE = 214;
const STROKE = 14;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

type Props = {
  arcPercent: number;
  remainingRatioDisplay: number;
  amountLine: string;
  hasSpendable: boolean;
  isOverBudget: boolean;
};

/** Command HUD ring: outer glow, recessed track, health-colored remaining arc, dramatic over-budget treatment. */
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
  const filterStrongGlowId = `budget-ring-glow2-${safeId}`;

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const clampedArc = Math.min(100, Math.max(0, arcPercent));
  const offset = CIRC * (1 - clampedArc / 100);

  const tHealthy = hasSpendable && !isOverBudget ? clampedArc / 100 : 0;
  const hue = 142 * tHealthy;
  const sat = 78 + 16 * (1 - tHealthy);
  const light = 44 + 12 * (1 - tHealthy);
  const healthyStroke = `hsl(${hue}, ${sat}%, ${light}%)`;
  const glowRgb =
    hasSpendable && !isOverBudget
      ? `rgba(${Math.round(34 + (1 - tHealthy) * 180)}, ${Math.round(197 * tHealthy + 40)}, ${Math.round(94 * tHealthy + 30)}, 0.45)`
      : isOverBudget
        ? "rgba(220, 38, 38, 0.42)"
        : "rgba(100, 116, 139, 0.25)";

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
      <div className="relative flex items-center justify-center" style={{ width: SIZE + 36, height: SIZE + 36 }}>
        <div
          className="pointer-events-none absolute rounded-full blur-2xl transition-[opacity,transform] duration-500"
          style={{
            width: SIZE + 8,
            height: SIZE + 8,
            background: glowRgb,
            opacity: isOverBudget ? 0.85 : 0.75,
          }}
          aria-hidden
        />
        <div className="relative" style={{ width: SIZE, height: SIZE }} aria-hidden>
          <svg width={SIZE} height={SIZE} className="-rotate-90 drop-shadow-[0_0_20px_rgba(0,0,0,0.55)]" suppressHydrationWarning>
            <defs suppressHydrationWarning>
              {isOverBudget ? (
                <linearGradient id={gradOverId} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#450a0a" />
                  <stop offset="28%" stopColor="#ef4444" />
                  <stop offset="55%" stopColor="#0a0a0a" />
                  <stop offset="78%" stopColor="#b91c1c" />
                  <stop offset="100%" stopColor="#1c1917" />
                </linearGradient>
              ) : null}
              <filter id={filterGlowId} x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation={isOverBudget ? 5.5 : 3.5} result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id={filterStrongGlowId} x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation={8} result="bg" />
                <feMerge>
                  <feMergeNode in="bg" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {/* Recessed outer rim */}
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              fill="none"
              stroke="rgba(0,0,0,0.55)"
              strokeWidth={STROKE + 3}
            />
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              fill="none"
              stroke="rgba(0, 229, 255, 0.07)"
              strokeWidth={STROKE + 1}
            />
            {/* Full-capacity track (muted) */}
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              fill="none"
              stroke="rgba(148,163,184,0.14)"
              strokeWidth={STROKE}
            />
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              fill="none"
              stroke="rgba(255,255,255,0.07)"
              strokeWidth={1.5}
            />
            {/* Remaining arc */}
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              fill="none"
              stroke={isOverBudget ? `url(#${gradOverId})` : hasSpendable ? healthyStroke : "rgba(100,116,139,0.5)"}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={isOverBudget ? `${CIRC} ${CIRC}` : CIRC}
              strokeDashoffset={isOverBudget ? 0 : mounted ? offset : CIRC}
              filter={isOverBudget ? `url(#${filterStrongGlowId})` : `url(#${filterGlowId})`}
              style={{
                transition: "stroke-dashoffset 1.05s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
              }}
              suppressHydrationWarning
            />
            {isOverBudget && (
              <circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={R - STROKE / 2 + 1}
                fill="none"
                stroke="rgba(248,113,113,0.4)"
                strokeWidth={2}
                strokeDasharray="5 7"
                className="animate-pulse"
              />
            )}
          </svg>
          <div
            className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center rounded-full px-3 text-center"
            style={{
              background: isOverBudget
                ? "radial-gradient(ellipse 78% 78% at 48% 42%, rgba(60,15,15,0.92), rgba(8,6,10,0.96) 70%)"
                : "radial-gradient(ellipse 78% 78% at 48% 42%, rgba(15,26,38,0.72), rgba(4,8,14,0.94) 72%)",
              boxShadow: "inset 0 0 24px rgba(0,0,0,0.45)",
            }}
          >
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">Resterend</span>
            <p
              className="mt-0.5 max-w-[10rem] truncate text-base font-bold leading-tight tabular-nums tracking-tight text-[var(--text-primary)] sm:text-lg"
              style={{
                textShadow: isOverBudget
                  ? "0 0 16px rgba(248,113,113,0.5), 0 1px 2px rgba(0,0,0,0.95)"
                  : "0 0 14px rgba(0,229,255,0.42), 0 0 4px rgba(148,163,184,0.35), 0 1px 2px rgba(0,0,0,0.85)",
              }}
            >
              {amountLine}
            </p>
            <p
              className={`mt-1 text-xs font-bold tabular-nums tracking-wide ${
                isOverBudget ? "text-red-200" : "text-[var(--text-secondary)]"
              }`}
            >
              {pctLabel}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
