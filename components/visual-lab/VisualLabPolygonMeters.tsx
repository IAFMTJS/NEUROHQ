"use client";

import { useId } from "react";

type Props = {
  label: string;
  value: string;
  /** 0–100 progress along perimeter or fill. */
  pct: number;
  variant: "square" | "triangle" | "hex" | "diamond";
  /** "ring" = stroke dash along outline; "fill" = level inside shape (square/diamond/triangle/hex fill styles differ). */
  style?: "ring" | "fill";
};

function clampPct(n: number) {
  return Math.max(0, Math.min(100, n));
}

/** Rounded square path, clockwise from top-center. viewBox 0 0 100 100 */
const SQUARE_PATH =
  "M 50 4 L 88 4 Q 96 4 96 12 L 96 88 Q 96 96 88 96 L 12 96 Q 4 96 4 88 L 4 12 Q 4 4 12 4 L 50 4 Z";

/** Equilateral-ish triangle: top vertex, clockwise */
const TRI_PATH = "M 50 8 L 90 88 L 10 88 Z";

/** Flat-top hexagon */
const HEX_PATH = "M 50 12 L 79 29 L 79 71 L 50 88 L 21 71 L 21 29 Z";

/** Diamond (square 45°) */
const DIAMOND_PATH = "M 50 6 L 88 50 L 50 94 L 12 50 Z";

function pathForVariant(v: Props["variant"]) {
  switch (v) {
    case "square":
      return SQUARE_PATH;
    case "triangle":
      return TRI_PATH;
    case "hex":
      return HEX_PATH;
    case "diamond":
      return DIAMOND_PATH;
    default:
      return SQUARE_PATH;
  }
}

export function PolygonHudMeter({ label, value, pct, variant, style = "ring" }: Props) {
  const gid = useId().replace(/:/g, "");
  const p = clampPct(pct);
  const d = pathForVariant(variant);

  const gradId = `vl-poly-grad-${gid}`;
  const trackStroke = "rgba(255,255,255,0.08)";
  const glow = variant === "triangle" ? "drop-shadow(0 0 8px rgba(0,212,255,0.35))" : "drop-shadow(0 0 10px rgba(0,212,255,0.3))";

  if (style === "fill") {
    return (
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="relative h-[100px] w-[100px]" aria-hidden>
          <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
            <defs>
              <linearGradient id={`${gradId}-fill`} x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="rgba(0,212,255,0.85)" />
                <stop offset="55%" stopColor="rgba(56,189,248,0.5)" />
                <stop offset="100%" stopColor="rgba(52,211,153,0.35)" />
              </linearGradient>
              <clipPath id={`${gradId}-clip`}>
                <path d={d} />
              </clipPath>
            </defs>
            <path d={d} fill="rgba(6,18,30,0.85)" stroke="rgba(0,212,255,0.35)" strokeWidth="1.5" />
            <g clipPath={`url(#${gradId}-clip)`}>
              <rect x="0" y={100 - p} width="100" height="100" fill={`url(#${gradId}-fill)`} opacity={0.92} />
            </g>
            <path d={d} fill="none" stroke="rgba(0,212,255,0.45)" strokeWidth="1.2" />
          </svg>
        </div>
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">{label}</p>
          <p className="text-xs font-semibold tabular-nums text-[var(--text-primary)]">{value}</p>
          <p className="text-[10px] tabular-nums text-[var(--text-secondary)]">{p}% fill</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="relative h-[100px] w-[100px]" aria-hidden>
        <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#00b8e6" />
            </linearGradient>
          </defs>
          <path
            d={d}
            fill="none"
            stroke={trackStroke}
            strokeWidth="5"
            strokeLinejoin="round"
            strokeLinecap="round"
            pathLength={100}
          />
          <path
            d={d}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={5}
            strokeLinejoin="round"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={`${p} ${100 - p + 0.001}`}
            style={{ filter: glow }}
          />
        </svg>
      </div>
      <div>
        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">{label}</p>
        <p className="text-xs font-semibold tabular-nums text-[var(--text-primary)]">{value}</p>
        <p className="text-[10px] tabular-nums text-[var(--text-secondary)]">{p}% trace</p>
      </div>
    </div>
  );
}
