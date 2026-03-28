"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getCurrencySymbol } from "@/lib/utils/currency";
import { xpRangeForNextLevel } from "@/lib/xp";

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
};

const CX = 200;
const CY = 200;
const R = 200;
/** 180° in drie stukken: 45° | 90° (focus, dominant) | 45° */
const ANGLES = [Math.PI, Math.PI + Math.PI / 4, Math.PI + (3 * Math.PI) / 4, 2 * Math.PI] as const;

function polar(cx: number, cy: number, r: number, t: number) {
  return { x: cx + r * Math.cos(t), y: cy + r * Math.sin(t) };
}

const PTS = ANGLES.map((t) => polar(CX, CY, R, t));
const SEG_PATHS = [0, 1, 2].map((i) => {
  const a = PTS[i];
  const b = PTS[i + 1];
  return `M ${a.x} ${a.y} A ${R} ${R} 0 0 1 ${b.x} ${b.y}`;
});
const FULL_BASE_D = `M ${PTS[0].x} ${PTS[0].y} A ${R} ${R} 0 0 1 ${PTS[3].x} ${PTS[3].y}`;

const VB_W = 400;
const VB_H = 200;

const W_TRACK_SIDE = 12;
const W_TRACK_CENTER = 20;
const W_FILL_SIDE = 10;
const W_FILL_CENTER = 17;

const pathLen = 100;

const cardClass =
  "pointer-events-auto max-w-[min(46%,10.5rem)] rounded-xl border border-[var(--card-border)]/55 bg-[var(--bg-surface)]/92 px-2.5 py-2 shadow-lg backdrop-blur-md no-underline outline-none transition-transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-[var(--accent-focus)]/55 sm:max-w-[11rem] sm:px-3";

function clampPct(n: number) {
  return Math.min(100, Math.max(0, n));
}

function format1(v: number | undefined, pct: number) {
  if (typeof v === "number" && Number.isFinite(v)) return `${Math.min(10, Math.max(0, v)).toFixed(1)}/10`;
  return `${(clampPct(pct) / 10).toFixed(1)}/10`;
}

export function CommanderMascotPedestal({ stats, children }: Props) {
  const {
    totalXP,
    displayLevel,
    budgetRemainingCents,
    currency,
    energyPct,
    focusPct,
    loadPct,
    energy1to10,
    focus1to10,
    load1to10,
  } = stats;

  const { current, needed } = xpRangeForNextLevel(totalXP);
  const ePct = clampPct(energyPct);
  const fPct = clampPct(focusPct);
  const lPct = clampPct(loadPct);

  const symbol = getCurrencySymbol(currency);
  const amount = Math.abs(budgetRemainingCents) / 100;
  const isNegative = budgetRemainingCents < 0;

  const platformWidth = "min(100%, calc(min(320px, 88vw) * 1.32))";

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

  return (
    <div
      className="commander-mascot-pedestal commander-mascot-platform relative mx-auto w-full overflow-visible pb-7 sm:pb-8"
      role="group"
      aria-label={`Energy ${ePct} procent, Focus ${fPct} procent, Belasting ${lPct} procent. Level ${displayLevel}, ${current} van ${needed} XP. Budget: ${isNegative ? "−" : ""}${symbol}${amount.toFixed(0)}.`}
    >
      <div className="relative mx-auto flex w-full flex-col items-center">
        <div className="commander-mascot-pedestal-mascot relative z-10 mx-auto w-full max-w-[min(320px,88vw)] shrink-0">
          {/* Zwevende XP / Budget bóven de ring (niet in de boog) */}
          <div
            className="commander-mascot-pedestal-cards pointer-events-none absolute left-1/2 top-full z-20 mt-1 flex max-w-none -translate-x-1/2 justify-between gap-2 px-0.5 sm:mt-2 sm:gap-3 sm:px-1"
            style={{ width: platformWidth }}
          >
            <Link href="/xp" className={`${cardClass} text-left`}>
              <span className="block text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">XP</span>
              <span className="mt-0.5 block text-sm font-bold tabular-nums text-[var(--text-primary)] sm:text-base">
                Lv {displayLevel}
              </span>
              <span className="mt-0.5 block text-[11px] tabular-nums text-[var(--text-secondary)] sm:text-xs">
                {current}/{needed}
              </span>
            </Link>
            <Link href="/budget" className={`${cardClass} text-right`}>
              <span className="block text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">Budget</span>
              <span className="mt-0.5 block text-sm font-bold tabular-nums text-[var(--text-primary)] sm:text-base">
                {isNegative && "−"}
                {symbol}
                {amount.toFixed(0)}
              </span>
              <span className="mt-0.5 block text-[11px] text-[var(--text-secondary)] sm:text-xs">
                {isNegative ? "over" : "rest"}
              </span>
            </Link>
          </div>
          {children}
        </div>

        <div
          className="commander-mascot-pedestal-arc-wrap relative z-0 -mt-[2.65rem] shrink-0 sm:-mt-[3.35rem]"
          style={{
            width: platformWidth,
            aspectRatio: `${VB_W} / ${VB_H}`,
            maxHeight: "min(10.5rem, 34vw)",
          }}
        >
          <svg
            className="commander-mascot-pedestal-arc commander-mascot-platform-svg absolute inset-0 block h-full w-full overflow-visible"
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="xMidYMax meet"
            aria-hidden
          >
            <defs>
              <linearGradient id="commander-platform-floor" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(var(--mode-rgb, 0, 212, 255), 0.22)" />
                <stop offset="100%" stopColor="rgba(var(--mode-rgb, 0, 212, 255), 0.04)" />
              </linearGradient>
            </defs>

            <ellipse cx={CX} cy={CY + 5} rx={R - 10} ry={20} fill="url(#commander-platform-floor)" opacity={0.85} />

            <g className="commander-orbit-arc-path" fill="none">
              {/* Basis-ring: volledige 180° container */}
              <path
                d={FULL_BASE_D}
                stroke="rgba(var(--mode-rgb, 0, 212, 255), 0.1)"
                strokeWidth={22}
                strokeLinecap="round"
                style={{
                  filter: "drop-shadow(0 8px 20px rgba(0, 0, 0, 0.35)) drop-shadow(0 0 12px rgba(56, 189, 248, 0.12))",
                }}
              />

              {/* Segment tracks */}
              <path d={SEG_PATHS[0]} stroke="rgba(34, 211, 238, 0.2)" strokeWidth={W_TRACK_SIDE} strokeLinecap="round" />
              <path d={SEG_PATHS[1]} stroke="rgba(56, 189, 248, 0.28)" strokeWidth={W_TRACK_CENTER} strokeLinecap="round" />
              <path d={SEG_PATHS[2]} stroke="rgba(251, 146, 60, 0.22)" strokeWidth={W_TRACK_SIDE} strokeLinecap="round" />

              {/* Energy fill — cyan */}
              <path
                className="commander-segment-fill"
                d={SEG_PATHS[0]}
                stroke="rgba(34, 211, 238, 0.95)"
                strokeWidth={W_FILL_SIDE}
                strokeLinecap="round"
                pathLength={pathLen}
                strokeDasharray={`${Math.max(0.2, (ePct / 100) * pathLen)} ${pathLen}`}
                style={{
                  filter: "drop-shadow(0 0 8px rgba(34, 211, 238, 0.45))",
                }}
              />
              {/* Focus fill — fel blauw, dikker segment */}
              <path
                className="commander-segment-fill"
                d={SEG_PATHS[1]}
                stroke="rgba(56, 189, 248, 1)"
                strokeWidth={W_FILL_CENTER}
                strokeLinecap="round"
                pathLength={pathLen}
                strokeDasharray={`${Math.max(0.2, (fPct / 100) * pathLen)} ${pathLen}`}
                style={{
                  filter: "drop-shadow(0 0 12px rgba(56, 189, 248, 0.55))",
                }}
              />
              {/* Load fill — oranje */}
              <path
                className={`commander-segment-fill commander-segment-load ${loadPulse ? "commander-segment-load-pulse" : ""}`}
                d={SEG_PATHS[2]}
                stroke="rgba(251, 146, 60, 0.96)"
                strokeWidth={W_FILL_SIDE}
                strokeLinecap="round"
                pathLength={pathLen}
                strokeDasharray={`${Math.max(0.2, (lPct / 100) * pathLen)} ${pathLen}`}
              />
            </g>
          </svg>

          {/* Stat-labels op de ring (geen XP/budget) */}
          <div className="pointer-events-none absolute inset-0 z-[5] flex items-end justify-between px-[7%] pb-[15%] pt-10 sm:px-[8%] sm:pb-[16%]">
            <div className="max-w-[30%] text-left">
              <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-cyan-200/90">Energy</p>
              <p className="text-sm font-bold tabular-nums text-cyan-100 sm:text-base">{ePct}%</p>
              <p className="text-[9px] tabular-nums text-[var(--text-muted)] sm:text-[10px]">{format1(energy1to10, ePct)}</p>
            </div>
            <div className="absolute bottom-[52%] left-1/2 max-w-[38%] -translate-x-1/2 text-center">
              <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-sky-200">Focus</p>
              <p className="text-base font-bold tabular-nums text-sky-100 sm:text-lg">{fPct}%</p>
              <p className="text-[9px] tabular-nums text-[var(--text-muted)] sm:text-[10px]">{format1(focus1to10, fPct)}</p>
            </div>
            <div className="max-w-[30%] text-right">
              <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-orange-200/90">Load</p>
              <p className="text-sm font-bold tabular-nums text-orange-100 sm:text-base">{lPct}%</p>
              <p className="text-[9px] tabular-nums text-[var(--text-muted)] sm:text-[10px]">{format1(load1to10, lPct)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
