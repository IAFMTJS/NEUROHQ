"use client";

import type { ReactNode } from "react";

type Segment = {
  pct: number;
  /** Tooltip + stable React key */
  name: string;
  fill: string;
  glow: string;
  loadPulse?: boolean;
};

/** Neutral track + three fills: green (energy), indigo (focus), orange (load). */
const TRACK_STROKE = "rgba(148, 163, 184, 0.28)";

/** Left semicircle from top → bottom, sweep-flag 0 (CCW in SVG). */
function wedgePath(cx: number, cy: number, r: number, pct: number): string {
  const clamped = Math.min(100, Math.max(0, pct));
  if (clamped <= 0) return "";
  const start = -Math.PI / 2;
  const sweep = (clamped / 100) * Math.PI;
  const end = start - sweep;
  const x1 = cx + r * Math.cos(start);
  const y1 = cy + r * Math.sin(start);
  const x2 = cx + r * Math.cos(end);
  const y2 = cy + r * Math.sin(end);
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 0 ${x2} ${y2} Z`;
}

function trackPath(cx: number, cy: number, r: number): string {
  const start = -Math.PI / 2;
  const x1 = cx + r * Math.cos(start);
  const y1 = cy + r * Math.sin(start);
  const end = Math.PI / 2;
  const x2 = cx + r * Math.cos(end);
  const y2 = cy + r * Math.sin(end);
  return `M ${x1} ${y1} A ${r} ${r} 0 0 0 ${x2} ${y2}`;
}

const VB = { w: 40, h: 36, cx: 22, cy: 18, r: 15 };

type Props = {
  energyPct: number;
  focusPct: number;
  loadPct: number;
  loadPulse?: boolean;
  /** XP- en Budget-links (zelfde HUD-kaarten als voorheen), in deze kolom. */
  xpLink: ReactNode;
  budgetLink: ReactNode;
};

/**
 * Three stacked left-opening half-pies (Energy / Focus / Load) for the dashboard pedestal.
 * Colors align with commander segment semantics; chrome uses mode-rgb like the rest of the HUD.
 */
export function CommanderVerticalResourcePies({
  energyPct,
  focusPct,
  loadPct,
  loadPulse,
  xpLink,
  budgetLink,
}: Props) {
  const segments: Segment[] = [
    {
      pct: energyPct,
      name: "Energy",
      fill: "rgb(34, 197, 94)",
      glow: "rgba(34, 197, 94, 0.4)",
    },
    {
      pct: focusPct,
      name: "Focus",
      fill: "rgb(99, 102, 241)",
      glow: "rgba(99, 102, 241, 0.4)",
    },
    {
      pct: loadPct,
      name: "Mentale belasting",
      fill: "rgb(234, 88, 12)",
      glow: "rgba(234, 88, 12, 0.4)",
      loadPulse,
    },
  ];

  return (
    <div
      className="commander-vertical-resource-pies flex h-[min(248px,56vw)] w-full shrink-0 flex-col rounded-2xl border border-[rgba(var(--mode-rgb),0.2)] bg-[linear-gradient(180deg,rgba(var(--mode-rgb-deep),0.22)_0%,rgba(6,12,22,0.55)_100%)] py-1 pl-0.5 pr-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_4px_18px_rgba(0,0,0,0.35)] sm:h-[min(280px,52vw)] sm:py-1.5 sm:pl-1 sm:pr-1"
    >
      <div className="commander-mascot-pedestal-cards commander-vertical-resource-pies-hud shrink-0 px-0.5 pb-1.5">
        {xpLink}
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-0.5 border-y border-[rgba(var(--mode-rgb),0.12)] px-0.5 py-1 sm:gap-1 sm:py-1.5">
      {segments.map((seg) => {
        const dFill = wedgePath(VB.cx, VB.cy, VB.r, seg.pct);
        const dTrack = trackPath(VB.cx, VB.cy, VB.r);
        return (
          <div
            key={seg.name}
            className="commander-vertical-resource-pie-cell relative flex min-h-0 flex-1 flex-col justify-center"
            title={`${seg.name}: ${Math.round(seg.pct)}%`}
          >
            <svg
              className={`commander-vertical-resource-pie-svg block h-full w-full max-h-[4.5rem] sm:max-h-[5.25rem] ${seg.loadPulse ? "commander-vertical-resource-pie-load-pulse" : ""}`}
              viewBox={`0 0 ${VB.w} ${VB.h}`}
              preserveAspectRatio="xMaxYMid meet"
            >
              <path
                d={dTrack}
                fill="none"
                stroke={TRACK_STROKE}
                strokeWidth={3.5}
                strokeLinecap="round"
              />
              {dFill ? (
                <path
                  d={dFill}
                  fill={seg.fill}
                  fillOpacity={0.92}
                  className="commander-vertical-resource-pie-fill"
                  style={{
                    filter: `drop-shadow(0 0 4px ${seg.glow})`,
                  }}
                />
              ) : null}
            </svg>
          </div>
        );
      })}
      </div>
      <div className="commander-mascot-pedestal-cards commander-vertical-resource-pies-hud shrink-0 px-0.5 pt-1.5">
        {budgetLink}
      </div>
    </div>
  );
}
