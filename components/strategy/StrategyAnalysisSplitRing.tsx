"use client";

type Props = {
  budgetHealth: number;
  growthHealth: number;
  budgetWarn: boolean;
  growthWarn: boolean;
};

function clampPct(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** Two half-rings: left = budget (warm when tight), right = growth (cyan family). */
export function StrategyAnalysisSplitRing({ budgetHealth, growthHealth, budgetWarn, growthWarn }: Props) {
  const size = 118;
  const stroke = 7;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const halfLen = Math.PI * r;

  const bPct = clampPct(budgetHealth);
  const gPct = clampPct(growthHealth);
  const bDash = (bPct / 100) * halfLen;
  const gDash = (gPct / 100) * halfLen;

  const budgetStroke = budgetWarn
    ? "url(#strat-budget-warm)"
    : "url(#strat-budget-ok)";
  const growthStroke = growthWarn ? "url(#strat-growth-warn)" : "url(#strat-growth-ok)";

  const leftPath = `M ${cx} ${cy - r} A ${r} ${r} 0 0 0 ${cx} ${cy + r}`;
  const rightPath = `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r}`;

  return (
    <div className="relative shrink-0" aria-hidden>
      <div
        className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_45%,rgba(var(--mode-rgb),0.14),transparent_62%)] blur-[2px]"
        aria-hidden
      />
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="relative drop-shadow-[0_0_22px_rgba(var(--mode-rgb),0.22)]">
        <defs>
          <linearGradient id="strat-budget-warm" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#fb923c" />
          </linearGradient>
          <linearGradient id="strat-budget-ok" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.85} />
            <stop offset="100%" stopColor="#34d399" stopOpacity={0.95} />
          </linearGradient>
          <linearGradient id="strat-growth-warn" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
          <linearGradient id="strat-growth-ok" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>

        <path
          d={leftPath}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={stroke}
          strokeLinecap="round"
          pathLength={halfLen}
        />
        <path
          d={leftPath}
          fill="none"
          stroke={budgetStroke}
          strokeWidth={stroke}
          strokeLinecap="round"
          pathLength={halfLen}
          strokeDasharray={`${bDash} ${halfLen}`}
          style={{ filter: budgetWarn ? "drop-shadow(0 0 8px rgba(251,146,60,0.55))" : "drop-shadow(0 0 6px rgba(52,211,153,0.35))" }}
        />

        <path
          d={rightPath}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={stroke}
          strokeLinecap="round"
          pathLength={halfLen}
        />
        <path
          d={rightPath}
          fill="none"
          stroke={growthStroke}
          strokeWidth={stroke}
          strokeLinecap="round"
          pathLength={halfLen}
          strokeDasharray={`${gDash} ${halfLen}`}
          style={{ filter: growthWarn ? "drop-shadow(0 0 8px rgba(251,191,36,0.4))" : "drop-shadow(0 0 8px rgba(56,189,248,0.45))" }}
        />
      </svg>
    </div>
  );
}
