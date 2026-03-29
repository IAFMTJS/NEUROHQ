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

/** Base design was 158×158, r=52; user-requested 4× visual scale. */
const SCALE = 4;
const BASE_SIZE = 158;
const BASE_R = 52;

/**
 * Two half-rings: left = budget (warm when tight), right = growth (cyan family).
 * Layered stroke + glow + center readout for HUD weight (not a thin mock ring).
 */
export function StrategyAnalysisSplitRing({ budgetHealth, growthHealth, budgetWarn, growthWarn }: Props) {
  const uid = useId().replace(/:/g, "");
  const bPct = clampPct(budgetHealth);
  const gPct = clampPct(growthHealth);

  const size = BASE_SIZE * SCALE;
  const cx = size / 2;
  const cy = size / 2;
  const r = BASE_R * SCALE;
  const halfLen = Math.PI * r;
  const bDash = (bPct / 100) * halfLen;
  const gDash = (gPct / 100) * halfLen;

  const sw = {
    trackWide: 18 * SCALE,
    trackMid: 14 * SCALE,
    bloom: 20 * SCALE,
    active: 11 * SCALE,
    rim: 3 * SCALE,
  };

  const idBudgetWarm = `strat-bw-${uid}`;
  const idBudgetOk = `strat-bo-${uid}`;
  const idGrowthWarn = `strat-gw-${uid}`;
  const idGrowthOk = `strat-go-${uid}`;
  const idBloom = `strat-bloom-${uid}`;

  const budgetStroke = budgetWarn ? `url(#${idBudgetWarm})` : `url(#${idBudgetOk})`;
  const growthStroke = growthWarn ? `url(#${idGrowthWarn})` : `url(#${idGrowthOk})`;

  const leftPath = `M ${cx} ${cy - r} A ${r} ${r} 0 0 0 ${cx} ${cy + r}`;
  const rightPath = `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r}`;

  const budgetGlow = budgetWarn ? "rgba(251,146,60,0.55)" : "rgba(52,211,153,0.42)";
  const growthGlow = growthWarn ? "rgba(251,191,36,0.48)" : "rgba(56,189,248,0.5)";

  const tickR = 2.2 * SCALE;
  const blurStd = Math.min(20, 5 * SCALE);

  return (
    <div
      className="relative mx-auto aspect-square w-full max-w-[min(100%,632px)] shrink-0"
      role="img"
      aria-label={`Budgetgezondheid ${bPct} procent${budgetWarn ? ", aandacht nodig" : ""}. Groei ${gPct} procent${growthWarn ? ", aandacht nodig" : ""}.`}
    >
      <div
        className="pointer-events-none absolute inset-[-32px] rounded-full bg-[radial-gradient(circle_at_50%_42%,rgba(var(--mode-rgb),0.22),transparent_58%)] blur-[12px] sm:blur-[3px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.35),transparent_70%)]"
        aria-hidden
      />

      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${size} ${size}`}
        className="relative aspect-square overflow-visible drop-shadow-[0_0_28px_rgba(var(--mode-rgb),0.28)]"
        aria-hidden
        preserveAspectRatio="xMidYMid meet"
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
            <feGaussianBlur stdDeviation={blurStd} result="blur" />
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

        <path
          d={leftPath}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={sw.trackWide}
          strokeLinecap="round"
          pathLength={halfLen}
        />
        <path
          d={rightPath}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={sw.trackWide}
          strokeLinecap="round"
          pathLength={halfLen}
        />

        <path
          d={leftPath}
          fill="none"
          stroke="rgba(0,0,0,0.45)"
          strokeWidth={sw.trackMid}
          strokeLinecap="round"
          pathLength={halfLen}
        />
        <path
          d={rightPath}
          fill="none"
          stroke="rgba(0,0,0,0.45)"
          strokeWidth={sw.trackMid}
          strokeLinecap="round"
          pathLength={halfLen}
        />

        <path
          d={leftPath}
          fill="none"
          stroke={budgetStroke}
          strokeWidth={sw.bloom}
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
          strokeWidth={sw.bloom}
          strokeLinecap="round"
          pathLength={halfLen}
          strokeDasharray={`${gDash} ${halfLen}`}
          filter={`url(#${idBloom})`}
          opacity={0.38}
          style={{ transition: "stroke-dasharray 700ms cubic-bezier(0.4,0,0.2,1), opacity 400ms" }}
        />

        <path
          d={leftPath}
          fill="none"
          stroke={budgetStroke}
          strokeWidth={sw.active}
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
          strokeWidth={sw.active}
          strokeLinecap="round"
          pathLength={halfLen}
          strokeDasharray={`${gDash} ${halfLen}`}
          style={{
            transition: "stroke-dasharray 700ms cubic-bezier(0.4,0,0.2,1)",
            filter: `drop-shadow(0 0 4px ${growthGlow}) drop-shadow(0 0 16px ${growthGlow})`,
          }}
        />

        <path
          d={leftPath}
          fill="none"
          stroke="rgba(255,255,255,0.22)"
          strokeWidth={sw.rim}
          strokeLinecap="round"
          pathLength={halfLen}
          strokeDasharray={`${bDash} ${halfLen}`}
          style={{ transition: "stroke-dasharray 700ms cubic-bezier(0.4,0,0.2,1)" }}
        />
        <path
          d={rightPath}
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth={sw.rim}
          strokeLinecap="round"
          pathLength={halfLen}
          strokeDasharray={`${gDash} ${halfLen}`}
          style={{ transition: "stroke-dasharray 700ms cubic-bezier(0.4,0,0.2,1)" }}
        />

        <circle cx={cx} cy={cy - r} r={tickR} fill="rgba(255,255,255,0.35)" />
        <circle cx={cx} cy={cy + r} r={tickR} fill="rgba(255,255,255,0.28)" />
      </svg>

      <div
        className="pointer-events-none absolute left-1/2 top-1/2 w-[min(220px,38%)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[rgba(255,255,255,0.1)] bg-[rgba(6,18,30,0.72)] px-2 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_0_24px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:w-[min(248px,40%)] sm:px-3 sm:py-2.5"
        aria-hidden
      >
        <div className="flex items-center justify-between gap-2 sm:gap-5">
          <div className="min-w-0 flex-1 text-center">
            <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)] sm:text-[9px]">Budget</p>
            <p
              className={`mt-0.5 text-lg font-bold tabular-nums leading-none tracking-tight [text-shadow:0_0_14px_rgba(0,0,0,0.5)] sm:text-2xl md:text-3xl ${
                budgetWarn ? "text-amber-200" : "text-emerald-200"
              }`}
            >
              {bPct}
              <span className="text-[10px] font-semibold opacity-80 sm:text-xs">%</span>
            </p>
          </div>
          <div
            className="h-10 w-px shrink-0 bg-gradient-to-b from-transparent via-[rgba(var(--mode-rgb),0.35)] to-transparent sm:h-14"
            aria-hidden
          />
          <div className="min-w-0 flex-1 text-center">
            <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)] sm:text-[9px]">Groei</p>
            <p
              className={`mt-0.5 text-lg font-bold tabular-nums leading-none tracking-tight [text-shadow:0_0_14px_rgba(0,0,0,0.5)] sm:text-2xl md:text-3xl ${
                growthWarn ? "text-amber-200" : "text-sky-200"
              }`}
            >
              {gPct}
              <span className="text-[10px] font-semibold opacity-80 sm:text-xs">%</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
