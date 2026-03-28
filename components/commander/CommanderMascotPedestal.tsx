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
/** Middelpunt boven: ondere boog steekt naar voren (naar kijker); open deel boven achter mascotte */
const CY = 0;
/** Referentie midden van de band (centerline boog) */
const R_MID = 204;
/** Asymmetrische band: boven smaller, onder breder — iets dikker totaal */
const R_INNER = R_MID - 12;
const R_OUTER = R_MID + 24;
/** Eindpunten iets omhoog langs de cirkel (schuin naar boven aan de zijkanten) */
const SIDE_ALPHA = Math.PI / 14;
/** Onderlangs: π+α → … → −α (45° | 90° | 45° + zij-opwaarts) */
const ANGLES = [Math.PI + SIDE_ALPHA, (3 * Math.PI) / 4, Math.PI / 4, -SIDE_ALPHA] as const;

/** Middenhoek Focus-segment (XP/Budget-label in de band) */
const SEG_MID_FOCUS_RAD = (ANGLES[1] + ANGLES[2]) / 2;

function polar(cx: number, cy: number, r: number, t: number) {
  return { x: cx + r * Math.cos(t), y: cy + r * Math.sin(t) };
}

/** Kleine boog op de ondere helft (open deel boven); centerline = R_MID */
const PTS = ANGLES.map((t) => polar(CX, CY, R_MID, t));
const sweepLower: 0 | 1 = 0;

/**
 * Gevulde annulus-sector tussen twee hoeken (theta1 → theta2, kleinere hoek eerst in richting sweep).
 * Onderste helft: gebruik zelfde sweep als stroke-paden.
 */
function annularSectorD(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  theta1: number,
  theta2: number,
  sweep: 0 | 1,
): string {
  const p1o = polar(cx, cy, rOuter, theta1);
  const p2o = polar(cx, cy, rOuter, theta2);
  const p2i = polar(cx, cy, rInner, theta2);
  const p1i = polar(cx, cy, rInner, theta1);
  const large = 0;
  const innerSweep = (1 - sweep) as 0 | 1;
  return [
    `M ${p1o.x} ${p1o.y}`,
    `A ${rOuter} ${rOuter} 0 ${large} ${sweep} ${p2o.x} ${p2o.y}`,
    `L ${p2i.x} ${p2i.y}`,
    `A ${rInner} ${rInner} 0 ${large} ${innerSweep} ${p1i.x} ${p1i.y}`,
    "Z",
  ].join(" ");
}

const SEG_SECTOR_D = [0, 1, 2].map((i) =>
  annularSectorD(CX, CY, R_INNER, R_OUTER, ANGLES[i], ANGLES[i + 1], sweepLower),
);

/** Eén pad voor basis-gloed: drie sectoren naast elkaar */
const FULL_BASE_D = SEG_SECTOR_D.join(" ");

/** Stroke-paden op centerline voor dash-vulling */
const SEG_PATHS = [0, 1, 2].map((i) => {
  const a = PTS[i];
  const b = PTS[i + 1];
  return `M ${a.x} ${a.y} A ${R_MID} ${R_MID} 0 0 ${sweepLower} ${b.x} ${b.y}`;
});

const OUTER_RIM_D = [0, 1, 2]
  .map((i) => {
    const a = polar(CX, CY, R_OUTER, ANGLES[i]);
    const b = polar(CX, CY, R_OUTER, ANGLES[i + 1]);
    return `M ${a.x} ${a.y} A ${R_OUTER} ${R_OUTER} 0 0 ${sweepLower} ${b.x} ${b.y}`;
  })
  .join(" ");

const VB_W = 400;
const VB_H = 200;

/** Visuele “dikte” voor dash-strokes op centerline (track + fill lagen) */
const W_TRACK_SIDE = 38;
const W_TRACK_CENTER = 50;
const W_FILL_SIDE = 36;
const W_FILL_CENTER = 46;
const RIM_STROKE = 7;

const pathLen = 100;

/** Straal voor XP/Budget in de band */
function bandLabelRadiusXp() {
  return R_INNER + (R_OUTER - R_INNER) * 0.22;
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

function clampPct(n: number) {
  return Math.min(100, Math.max(0, n));
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

  const rXpBudget = bandLabelRadiusXp();
  const posXp = bandLabelPct(SEG_MID_FOCUS_RAD, rXpBudget, donutSquash);

  return (
    <div
      className="commander-mascot-pedestal commander-mascot-platform relative mx-auto w-full overflow-visible pb-6 sm:pb-8"
      role="group"
      aria-label={`Resourceband: arcering Energy ${ePct}%, Focus ${fPct}%, Load ${lPct}%. Level ${displayLevel}, ${current} van ${needed} XP. Budget ${isNegative ? "−" : ""}${symbol}${amount.toFixed(0)}. Gedetailleerde stats op de brain circles.`}
    >
      <div className="commander-mascot-pedestal-donut-stage relative mx-auto w-full min-h-[min(300px,78vw)] pb-[min(4.25rem,14vw)] sm:min-h-[min(340px,64vw)] sm:pb-[min(5rem,13vw)]">
        {/* Mascotte eerst (gat van de donut); ring eronder/erachter via z-index */}
        <div className="commander-mascot-pedestal-mascot relative z-[14] -mb-12 mx-auto w-full max-w-[min(320px,88vw)] shrink-0 px-1 sm:-mb-14 lg:-mb-[4.5rem]">
          {children}
        </div>

        {/* Ring op het voetstuk (bottom-0); geen translate-Y — uitrekken via maxHeight/breedte + CSS-tilt, niet omhoog trekken */}
        <div className="absolute bottom-0 left-1/2 z-[1] flex w-full max-w-none -translate-x-1/2 justify-center">
          <div className="commander-mascot-pedestal-donut-tilt">
            <div
              className="commander-mascot-pedestal-arc-wrap commander-mascot-pedestal-donut-ring relative shrink-0"
              style={{
                width: platformWidth,
                aspectRatio: `${VB_W} / ${VB_H}`,
                maxHeight: "min(17rem, 56vw)",
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
                  <ellipse cx={CX} cy={198} rx={R_MID - 6} ry={22} fill="url(#commander-bowl-floor)" opacity={0.18} />

                  <g className="commander-orbit-arc-path">
                    {/* Basis-band: gevulde annulus (onder breder dan boven) */}
                    <path
                      d={FULL_BASE_D}
                      fill="rgba(var(--mode-rgb, 0, 212, 255), 0.14)"
                      stroke="none"
                      style={{
                        filter: "drop-shadow(0 4px 14px rgba(0, 0, 0, 0.28)) drop-shadow(0 0 10px rgba(56, 189, 248, 0.1))",
                      }}
                    />
                    <path
                      d={OUTER_RIM_D}
                      fill="none"
                      stroke="rgba(186, 230, 253, 0.28)"
                      strokeWidth={RIM_STROKE}
                      strokeLinecap="round"
                      opacity={0.55}
                    />

                    <path
                      d={SEG_SECTOR_D[0]}
                      fill="rgba(34, 211, 238, 0.1)"
                      stroke="none"
                    />
                    <path
                      d={SEG_SECTOR_D[1]}
                      fill="rgba(56, 189, 248, 0.12)"
                      stroke="none"
                    />
                    <path
                      d={SEG_SECTOR_D[2]}
                      fill="rgba(251, 146, 60, 0.09)"
                      stroke="none"
                    />

                    <path
                      className="commander-segment-fill"
                      d={SEG_PATHS[0]}
                      fill="none"
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
                      fill="none"
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
                      fill="none"
                      stroke="rgba(251, 146, 60, 0.96)"
                      strokeWidth={W_FILL_SIDE}
                      strokeLinecap="round"
                      pathLength={pathLen}
                      strokeDasharray={`${Math.max(0.2, (lPct / 100) * pathLen)} ${pathLen}`}
                    />
                  </g>
                </g>
              </svg>

          {/* XP / Budget op de band — Energy/Focus/Load alleen via brain circles */}
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
