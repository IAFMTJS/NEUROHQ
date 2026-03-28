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

/** HUD-kaarten: styling in globals (.commander-pedestal-hud-card) */
const cardClass =
  "commander-pedestal-hud-card pointer-events-auto max-w-[min(44%,9.5rem)] rounded-lg border px-2 py-1.5 backdrop-blur-md no-underline outline-none transition-transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-[var(--accent-focus)]/55 sm:max-w-[10rem] sm:rounded-xl sm:px-2.5 sm:py-2";

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
      className="commander-mascot-pedestal commander-mascot-platform relative mx-auto w-full overflow-visible pb-5 sm:pb-6"
      role="group"
      aria-label={`Energy ${ePct} procent, Focus ${fPct} procent, Belasting ${lPct} procent. Level ${displayLevel}, ${current} van ${needed} XP. Budget: ${isNegative ? "−" : ""}${symbol}${amount.toFixed(0)}.`}
    >
      <div className="relative mx-auto flex w-full flex-col items-center">
        <div className="commander-mascot-pedestal-mascot relative z-10 mx-auto w-full max-w-[min(320px,88vw)] shrink-0">
          {children}
        </div>

        <div
          className="commander-mascot-pedestal-arc-wrap relative z-0 -mt-[2.65rem] shrink-0 sm:-mt-[3.35rem]"
          style={{
            width: platformWidth,
            aspectRatio: `${VB_W} / ${VB_H}`,
            maxHeight: "min(11rem, 36vw)",
          }}
        >
          <svg
            className="commander-mascot-pedestal-arc commander-mascot-platform-svg absolute inset-0 block h-full w-full overflow-visible"
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="xMidYMax meet"
            aria-hidden
          >
            <defs>
              <radialGradient id="commander-bowl-floor" cx="50%" cy="100%" r="78%" fx="50%" fy="100%">
                <stop offset="0%" stopColor="rgba(var(--mode-rgb, 0, 212, 255), 0.2)" />
                <stop offset="42%" stopColor="rgba(var(--mode-rgb, 0, 212, 255), 0.07)" />
                <stop offset="100%" stopColor="rgba(0, 0, 0, 0.28)" />
              </radialGradient>
            </defs>

            <ellipse cx={CX} cy={CY + 4} rx={R - 9} ry={21} fill="url(#commander-bowl-floor)" opacity={0.92} />

            <g className="commander-orbit-arc-path" fill="none">
              {/* Basis-ring: zachte groef + randlicht (HUD) */}
              <path
                d={FULL_BASE_D}
                stroke="rgba(var(--mode-rgb, 0, 212, 255), 0.14)"
                strokeWidth={23}
                strokeLinecap="round"
                style={{
                  filter: "drop-shadow(0 4px 14px rgba(0, 0, 0, 0.28)) drop-shadow(0 0 10px rgba(56, 189, 248, 0.1))",
                }}
              />
              <path
                d={FULL_BASE_D}
                stroke="rgba(186, 230, 253, 0.28)"
                strokeWidth={4}
                strokeLinecap="round"
                opacity={0.55}
                transform="translate(0 -1.5)"
              />

              {/* Segment tracks — iets dieper voor contrast met vulling */}
              <path d={SEG_PATHS[0]} stroke="rgba(34, 211, 238, 0.14)" strokeWidth={W_TRACK_SIDE} strokeLinecap="round" />
              <path d={SEG_PATHS[1]} stroke="rgba(56, 189, 248, 0.2)" strokeWidth={W_TRACK_CENTER} strokeLinecap="round" />
              <path d={SEG_PATHS[2]} stroke="rgba(251, 146, 60, 0.16)" strokeWidth={W_TRACK_SIDE} strokeLinecap="round" />

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

          {/* Leesbaarheid + diepte in het midden van de kom */}
          <div className="commander-mascot-pedestal-bowl-overlay pointer-events-none absolute inset-0 z-[4]" aria-hidden />

          {/* XP / Budget in het binnengebied van de halve cirkel (niet onder de mascot) */}
          <div
            className="commander-mascot-pedestal-cards pointer-events-none absolute left-1/2 top-[53%] z-[12] flex w-[min(92%,18rem)] max-w-none -translate-x-1/2 -translate-y-1/2 justify-between gap-1.5 px-0.5 sm:top-[54%] sm:gap-2.5 sm:px-1"
          >
            <Link href="/xp" className={`${cardClass} text-left`}>
              <span className="block text-[8px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)] sm:text-[9px]">XP</span>
              <span className="mt-0.5 block text-xs font-bold tabular-nums text-[var(--text-primary)] sm:text-sm">
                Lv {displayLevel}
              </span>
              <span className="mt-0.5 block text-[10px] tabular-nums text-[var(--text-secondary)] sm:text-[11px]">
                {current}/{needed}
              </span>
            </Link>
            <Link href="/budget" className={`${cardClass} text-right`}>
              <span className="block text-[8px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)] sm:text-[9px]">Budget</span>
              <span className="mt-0.5 block text-xs font-bold tabular-nums text-[var(--text-primary)] sm:text-sm">
                {isNegative && "−"}
                {symbol}
                {amount.toFixed(0)}
              </span>
              <span className="mt-0.5 block text-[10px] text-[var(--text-secondary)] sm:text-[11px]">
                {isNegative ? "over" : "rest"}
              </span>
            </Link>
          </div>

          {/* Stat-labels: in de boog, HUD-leesbaarheid */}
          <div className="pointer-events-none absolute inset-0 z-[5] flex items-end justify-between px-[12%] pb-[17%] pt-10 sm:px-[15%] sm:pb-[18%]">
            <div className="commander-pedestal-stat-pill max-w-[28%] text-left">
              <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-cyan-200/95">Energy</p>
              <p className="text-sm font-bold tabular-nums text-cyan-50 sm:text-base">{ePct}%</p>
              <p className="text-[9px] tabular-nums text-cyan-100/75 sm:text-[10px]">{format1(energy1to10, ePct)}</p>
            </div>
            <div className="commander-pedestal-stat-pill absolute bottom-[50%] left-1/2 max-w-[36%] -translate-x-1/2 text-center">
              <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-sky-200">Focus</p>
              <p className="text-base font-bold tabular-nums text-sky-50 sm:text-lg">{fPct}%</p>
              <p className="text-[9px] tabular-nums text-sky-100/80 sm:text-[10px]">{format1(focus1to10, fPct)}</p>
            </div>
            <div className="commander-pedestal-stat-pill max-w-[28%] text-right">
              <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-orange-200/95">Load</p>
              <p className="text-sm font-bold tabular-nums text-orange-50 sm:text-base">{lPct}%</p>
              <p className="text-[9px] tabular-nums text-orange-100/75 sm:text-[10px]">{format1(load1to10, lPct)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
