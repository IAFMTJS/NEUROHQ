"use client";

import { useId } from "react";

type Props = {
  budgetHealth: number;
  growthHealth: number;
  budgetWarn: boolean;
  growthWarn: boolean;
};

function clampPct(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * Two half-rings: left = budget (warm when tight), right = growth (cyan family).
 * Layered stroke + glow + center readout for HUD weight (not a thin mock ring).
 */
export function StrategyAnalysisSplitRing({ budgetHealth, growthHealth, budgetWarn, growthWarn }: Props) {
  const uid = useId().replace(/:/g, "");
  const bPct = clampPct(budgetHealth);
  const gPct = clampPct(growthHealth);

  const size = 158;
  const cx = size / 2;
  const cy = size / 2;
  /** Inset so thick strokes + glow stay inside viewBox */
  const r = 52;
  const halfLen = Math.PI * r;
  const bDash = (bPct / 100) * halfLen;
  const gDash = (gPct / 100) * halfLen;

  const idBudgetWarm = `strat-bw-${uid}`;
  const idBudgetOk = `strat-bo-${uid}`;
  const idGrowthWarn = `strat-gw-${uid}`;
  const idGrowthOk = `strat-go-${uid}`;
  const idBloom = `strat-bloom-${uid}`;

  const budgetStroke = budgetWarn ? `url(#${idBudgetWarm})` : `url(#${idBudgetOk})`;
  const growthStroke = growthWarn ? `url(#${idGrowthWarn})` : `url(#${idGrowthOk})`;

  const leftPath = `M ${cx} ${cy - r} A ${r} ${r} 0 0 0 ${cx} ${cy + r}`;
  const rightPath = `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r}`;

  const budgetGlow =
    budgetWarn ? "rgba(251,146,60,0.55)" : "rgba(52,211,153,0.42)";
  const growthGlow =
    growthWarn ? "rgba(251,191,36,0.48)" : "rgba(56,189,248,0.5)";

  return (
    <div
      className="relative shrink-0"
      role="img"
      aria-label={`Budgetgezondheid ${bPct} procent${budgetWarn ? ", aandacht nodig" : ""}. Groei ${gPct} procent${growthWarn ? ", aandacht nodig" : ""}.`}
    >
      <div
        className="pointer-events-none absolute inset-[-8px] rounded-full bg-[radial-gradient(circle_at_50%_42%,rgba(var(--mode-rgb),0.22),transparent_58%)] blur-[3px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.35),transparent_70%)]"
        aria-hidden
      />

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="relative overflow-visible drop-shadow-[0_0_28px_rgba(var(--mode-rgb),0.28)]"
        aria-hidden
      >
        <defs>
          <linearGradient id={idBudgetWarm} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f87171" />
            <stop offset="55%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
          <linearGradient id={idBudgetOk} x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="45%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
          <linearGradient id={idGrowthWarn} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="70%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
          <linearGradient id={idGrowthOk} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#67e8f9" />
            <stop offset="40%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>

          <filter id={idBloom} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.55 0"
              result="soft"
            />
            <feMerge>
              <feMergeNode in="soft" />
            </feMerge>
          </filter>
        </defs>

        {/* Wide cold track — reads as instrument bezel */}
        <path
          d={leftPath}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={18}
          strokeLinecap="round"
          pathLength={halfLen}
        />
        <path
          d={rightPath}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={18}
          strokeLinecap="round"
          pathLength={halfLen}
        />

        {/* Mid track */}
        <path
          d={leftPath}
          fill="none"
          stroke="rgba(0,0,0,0.45)"
          strokeWidth={14}
          strokeLinecap="round"
          pathLength={halfLen}
        />
        <path
          d={rightPath}
          fill="none"
          stroke="rgba(0,0,0,0.45)"
          strokeWidth={14}
          strokeLinecap="round"
          pathLength={halfLen}
        />

        {/* Bloom under active arcs */}
        <path
          d={leftPath}
          fill="none"
          stroke={budgetStroke}
          strokeWidth={20}
          strokeLinecap="round"
          pathLength={halfLen}
          strokeDasharray={`${bDash} ${halfLen}`}
          filter={`url(#${idBloom})`}
          opacity={0.35}
          style={{ transition: "stroke-dasharray 700ms cubic-bezier(0.4,0,0.2,1), opacity 400ms" }}
        />
        <path
          d={rightPath}
          fill="none"
          stroke={growthStroke}
          strokeWidth={20}
          strokeLinecap="round"
          pathLength={halfLen}
          strokeDasharray={`${gDash} ${halfLen}`}
          filter={`url(#${idBloom})`}
          opacity={0.38}
          style={{ transition: "stroke-dasharray 700ms cubic-bezier(0.4,0,0.2,1), opacity 400ms" }}
        />

        {/* Active arc + edge glow */}
        <path
          d={leftPath}
          fill="none"
          stroke={budgetStroke}
          strokeWidth={11}
          strokeLinecap="round"
          pathLength={halfLen}
          strokeDasharray={`${bDash} ${halfLen}`}
          style={{
            transition: "stroke-dasharray 700ms cubic-bezier(0.4,0,0.2,1)",
            filter: `drop-shadow(0 0 4px ${budgetGlow}) drop-shadow(0 0 14px ${budgetGlow})`,
          }}
        />
        <path
          d={rightPath}
          fill="none"
          stroke={growthStroke}
          strokeWidth={11}
          strokeLinecap="round"
          pathLength={halfLen}
          strokeDasharray={`${gDash} ${halfLen}`}
          style={{
            transition: "stroke-dasharray 700ms cubic-bezier(0.4,0,0.2,1)",
            filter: `drop-shadow(0 0 4px ${growthGlow}) drop-shadow(0 0 16px ${growthGlow})`,
          }}
        />

        {/* Crisp inner highlight on active portion */}
        <path
          d={leftPath}
          fill="none"
          stroke="rgba(255,255,255,0.22)"
          strokeWidth={3}
          strokeLinecap="round"
          pathLength={halfLen}
          strokeDasharray={`${bDash} ${halfLen}`}
          style={{ transition: "stroke-dasharray 700ms cubic-bezier(0.4,0,0.2,1)" }}
        />
        <path
          d={rightPath}
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth={3}
          strokeLinecap="round"
          pathLength={halfLen}
          strokeDasharray={`${gDash} ${halfLen}`}
          style={{ transition: "stroke-dasharray 700ms cubic-bezier(0.4,0,0.2,1)" }}
        />

        {/* Vertex ticks at poles */}
        <circle cx={cx} cy={cy - r} r={2.2} fill="rgba(255,255,255,0.35)" />
        <circle cx={cx} cy={cy + r} r={2.2} fill="rgba(255,255,255,0.28)" />
      </svg>

      {/* Center hub */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 w-[min(92px,58%)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[rgba(6,18,30,0.72)] px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_0_24px_rgba(0,0,0,0.45)] backdrop-blur-sm"
        aria-hidden
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 text-center">
            <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Budget</p>
            <p
              className={`mt-0.5 text-lg font-bold tabular-nums leading-none tracking-tight [text-shadow:0_0_18px_rgba(0,0,0,0.5)] ${
                budgetWarn ? "text-amber-200" : "text-emerald-200"
              }`}
            >
              {bPct}
              <span className="text-xs font-semibold opacity-80">%</span>
            </p>
          </div>
          <div className="h-10 w-px shrink-0 bg-gradient-to-b from-transparent via-[rgba(var(--mode-rgb),0.35)] to-transparent" aria-hidden />
          <div className="min-w-0 text-center">
            <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Groei</p>
            <p
              className={`mt-0.5 text-lg font-bold tabular-nums leading-none tracking-tight [text-shadow:0_0_18px_rgba(0,0,0,0.5)] ${
                growthWarn ? "text-amber-200" : "text-sky-200"
              }`}
            >
              {gPct}
              <span className="text-xs font-semibold opacity-80">%</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
