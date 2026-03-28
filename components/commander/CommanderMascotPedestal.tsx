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

/** Dikke band (donut-strip): tracks + vulling breed genoeg voor tekst in de band */
const W_TRACK_SIDE = 28;
const W_TRACK_CENTER = 38;
const W_FILL_SIDE = 26;
const W_FILL_CENTER = 34;
const BASE_STROKE = 48;
const RIM_STROKE = 5;

const pathLen = 100;

/** Middenhoek per segment (rad): Energy | Focus | Load */
const SEG_MID_RAD = [9 * (Math.PI / 8), (3 * Math.PI) / 2, 15 * (Math.PI / 8)] as const;

/** Straal (viewBox) voor tekst iets naar het gat (binnen de band) */
function bandLabelRadius(strokeW: number) {
  return R - strokeW * 0.34;
}

/** HTML-overlay: zelfde meetkunde als SVG-groep met verticale squash */
function bandLabelPct(theta: number, r: number, squash: number) {
  const x = CX + r * Math.cos(theta);
  const ySquashed = CY + r * Math.sin(theta) * squash;
  return { left: `${(x / VB_W) * 100}%`, top: `${(ySquashed / VB_H) * 100}%` };
}

/** Compacte HUD in de band */
const cardClass =
  "commander-pedestal-hud-card commander-pedestal-band-card pointer-events-auto max-w-[min(48%,7.25rem)] rounded-md border px-1.5 py-1 backdrop-blur-md no-underline outline-none transition-transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-[var(--accent-focus)]/55 sm:max-w-[8.5rem] sm:rounded-lg sm:px-2 sm:py-1.5";

const bandStatClass =
  "commander-pedestal-stat-pill commander-pedestal-band-stat pointer-events-none max-w-[min(30%,5.75rem)] sm:max-w-[6.25rem]";

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

  /** Foreshortening: cirkel → ellips (donut van schuin boven); midden blijft (CX,CY). */
  const donutSquash = 0.56;

  const rE = bandLabelRadius(W_FILL_SIDE);
  const rF = bandLabelRadius(W_FILL_CENTER);
  const rL = bandLabelRadius(W_FILL_SIDE);
  const rXpBudget = R - W_FILL_CENTER * 0.72;
  const posE = bandLabelPct(SEG_MID_RAD[0], rE, donutSquash);
  const posF = bandLabelPct(SEG_MID_RAD[1], rF, donutSquash);
  const posL = bandLabelPct(SEG_MID_RAD[2], rL, donutSquash);
  const posXp = bandLabelPct(SEG_MID_RAD[1], rXpBudget, donutSquash);

  return (
    <div
      className="commander-mascot-pedestal commander-mascot-platform relative mx-auto w-full overflow-visible pb-6 sm:pb-8"
      role="group"
      aria-label={`Energy ${ePct} procent, Focus ${fPct} procent, Belasting ${lPct} procent. Level ${displayLevel}, ${current} van ${needed} XP. Budget: ${isNegative ? "−" : ""}${symbol}${amount.toFixed(0)}.`}
    >
      <div className="commander-mascot-pedestal-donut-stage relative mx-auto w-full min-h-[min(260px,72vw)] pb-[min(5.5rem,18vw)] sm:min-h-[min(300px,58vw)] sm:pb-[min(6.5rem,14vw)]">
        {/* Mascotte eerst (gat van de donut); ring eronder/erachter via z-index */}
        <div className="commander-mascot-pedestal-mascot relative z-[14] -mb-7 mx-auto w-full max-w-[min(320px,88vw)] shrink-0 px-1 sm:-mb-9">
          {children}
        </div>

        {/* Ring achter mascotte: lager + donut-perspectief */}
        <div className="absolute bottom-0 left-1/2 z-[1] flex w-full max-w-none -translate-x-1/2 translate-y-5 justify-center sm:translate-y-7">
          <div className="commander-mascot-pedestal-donut-tilt">
            <div
              className="commander-mascot-pedestal-arc-wrap commander-mascot-pedestal-donut-ring relative shrink-0"
              style={{
                width: platformWidth,
                aspectRatio: `${VB_W} / ${VB_H}`,
                maxHeight: "min(12.75rem, 44vw)",
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

                <g transform={`translate(${CX} ${CY}) scale(1 ${donutSquash}) translate(${-CX} ${-CY})`}>
                  <ellipse cx={CX} cy={CY + 4} rx={R - 9} ry={21} fill="url(#commander-bowl-floor)" opacity={0.22} />

                  <g className="commander-orbit-arc-path" fill="none">
                    {/* Basis-band (dikke donut-strip) */}
                    <path
                      d={FULL_BASE_D}
                      stroke="rgba(var(--mode-rgb, 0, 212, 255), 0.16)"
                      strokeWidth={BASE_STROKE}
                      strokeLinecap="round"
                      style={{
                        filter: "drop-shadow(0 4px 14px rgba(0, 0, 0, 0.28)) drop-shadow(0 0 10px rgba(56, 189, 248, 0.1))",
                      }}
                    />
                    <path
                      d={FULL_BASE_D}
                      stroke="rgba(186, 230, 253, 0.22)"
                      strokeWidth={RIM_STROKE}
                      strokeLinecap="round"
                      opacity={0.55}
                      transform="translate(0 -1.5)"
                    />

                    <path d={SEG_PATHS[0]} stroke="rgba(34, 211, 238, 0.12)" strokeWidth={W_TRACK_SIDE} strokeLinecap="round" />
                    <path d={SEG_PATHS[1]} stroke="rgba(56, 189, 248, 0.16)" strokeWidth={W_TRACK_CENTER} strokeLinecap="round" />
                    <path d={SEG_PATHS[2]} stroke="rgba(251, 146, 60, 0.12)" strokeWidth={W_TRACK_SIDE} strokeLinecap="round" />

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
                </g>
              </svg>

          {/* Stats + labels in de band (pool-geometrie) */}
          <div
            className={`${bandStatClass} absolute z-[6] text-left`}
            style={{ ...posE, transform: "translate(-50%, -50%)" }}
          >
            <p className="text-[7px] font-semibold uppercase tracking-[0.12em] text-cyan-200/95 sm:text-[8px]">Energy</p>
            <p className="text-xs font-bold tabular-nums text-cyan-50 sm:text-sm">{ePct}%</p>
            <p className="text-[8px] tabular-nums text-cyan-100/80 sm:text-[9px]">{format1(energy1to10, ePct)}</p>
          </div>
          <div
            className={`${bandStatClass} absolute z-[6] text-center`}
            style={{ ...posF, transform: "translate(-50%, -50%)" }}
          >
            <p className="text-[7px] font-semibold uppercase tracking-[0.12em] text-sky-200 sm:text-[8px]">Focus</p>
            <p className="text-sm font-bold tabular-nums text-sky-50 sm:text-base">{fPct}%</p>
            <p className="text-[8px] tabular-nums text-sky-100/80 sm:text-[9px]">{format1(focus1to10, fPct)}</p>
          </div>
          <div
            className={`${bandStatClass} absolute z-[6] text-right`}
            style={{ ...posL, transform: "translate(-50%, -50%)" }}
          >
            <p className="text-[7px] font-semibold uppercase tracking-[0.12em] text-orange-200/95 sm:text-[8px]">Load</p>
            <p className="text-xs font-bold tabular-nums text-orange-50 sm:text-sm">{lPct}%</p>
            <p className="text-[8px] tabular-nums text-orange-100/75 sm:text-[9px]">{format1(load1to10, lPct)}</p>
          </div>

          {/* XP / Budget in de Focus-band (dieper in het gat) */}
          <div
            className="commander-mascot-pedestal-cards pointer-events-none absolute z-[12] flex w-[min(92%,17rem)] max-w-none justify-between gap-1 px-0.5 sm:gap-2"
            style={{ left: posXp.left, top: posXp.top, transform: "translate(-50%, -50%)" }}
          >
            <Link href="/xp" className={`${cardClass} text-left`}>
              <span className="block text-[7px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)] sm:text-[8px]">XP</span>
              <span className="mt-0.5 block text-[11px] font-bold tabular-nums text-[var(--text-primary)] sm:text-xs">
                Lv {displayLevel}
              </span>
              <span className="mt-0.5 block text-[9px] tabular-nums text-[var(--text-secondary)] sm:text-[10px]">
                {current}/{needed}
              </span>
            </Link>
            <Link href="/budget" className={`${cardClass} text-right`}>
              <span className="block text-[7px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)] sm:text-[8px]">Budget</span>
              <span className="mt-0.5 block text-[11px] font-bold tabular-nums text-[var(--text-primary)] sm:text-xs">
                {isNegative && "−"}
                {symbol}
                {amount.toFixed(0)}
              </span>
              <span className="mt-0.5 block text-[9px] text-[var(--text-secondary)] sm:text-[10px]">
                {isNegative ? "over" : "rest"}
              </span>
            </Link>
          </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
