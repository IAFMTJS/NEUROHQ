"use client";

import { useId, type ReactNode } from "react";

type Segment = {
  pct: number;
  /** Tooltip + stable React key */
  name: string;
  fill: string;
  glow: string;
  loadPulse?: boolean;
};

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
  const uid = useId();
  const segments: Segment[] = [
    {
      pct: energyPct,
      name: "Energy",
      fill: "rgba(34, 211, 238, 0.92)",
      glow: "rgba(34, 211, 238, 0.35)",
    },
    {
      pct: focusPct,
      name: "Focus",
      fill: "rgba(167, 139, 250, 0.95)",
      glow: "rgba(167, 139, 250, 0.38)",
    },
    {
      pct: loadPct,
      name: "Mentale belasting",
      fill: "rgba(251, 146, 60, 0.94)",
      glow: "rgba(251, 146, 60, 0.32)",
      loadPulse,
    },
  ];

  return (
    <div
      className="commander-vertical-resource-pies flex h-[min(248px,56vw)] w-[min(5.35rem,26vw)] shrink-0 flex-col rounded-2xl border border-[rgba(var(--mode-rgb),0.2)] bg-[linear-gradient(180deg,rgba(var(--mode-rgb-deep),0.22)_0%,rgba(6,12,22,0.55)_100%)] py-1.5 pl-1 pr-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_4px_18px_rgba(0,0,0,0.35)] sm:h-[min(280px,52vw)] sm:w-[5.65rem] sm:py-2 sm:pl-1.5 sm:pr-1.5"
    >
      <div className="commander-mascot-pedestal-cards commander-vertical-resource-pies-hud shrink-0 px-0.5 pb-1.5">
        {xpLink}
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-0.5 border-y border-[rgba(var(--mode-rgb),0.12)] px-0.5 py-1 sm:gap-1 sm:py-1.5">
      {segments.map((seg) => {
        const dFill = wedgePath(VB.cx, VB.cy, VB.r, seg.pct);
        const dTrack = trackPath(VB.cx, VB.cy, VB.r);
        const gid = `${uid}-${seg.name}`;
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
              <defs>
                <linearGradient id={`${gid}-edge`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(var(--mode-rgb), 0.45)" />
                  <stop offset="100%" stopColor="rgba(var(--mode-rgb), 0.08)" />
                </linearGradient>
              </defs>
              <path
                d={dTrack}
                fill="none"
                stroke="rgba(0,0,0,0.4)"
                strokeWidth={2}
                strokeLinecap="round"
                opacity={0.75}
              />
              <path
                d={dTrack}
                fill="none"
                stroke="rgba(var(--mode-rgb),0.2)"
                strokeWidth={4}
                strokeLinecap="round"
              />
              {dFill ? (
                <path
                  d={dFill}
                  fill={seg.fill}
                  fillOpacity={0.88}
                  className="commander-vertical-resource-pie-fill"
                  style={{
                    filter: `drop-shadow(0 0 5px ${seg.glow})`,
                  }}
                />
              ) : null}
              <path
                d={dTrack}
                fill="none"
                stroke={`url(#${gid}-edge)`}
                strokeWidth={1}
                strokeLinecap="round"
                opacity={0.65}
              />
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
