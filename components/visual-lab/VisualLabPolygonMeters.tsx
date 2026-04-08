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
  size?: "sm" | "md" | "lg" | "xl";
  ringThickness?: "normal" | "thick";
  hideFooter?: boolean;
  centerTopText?: string;
  centerValueText?: string;
  centerBottomText?: string;
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

export function PolygonHudMeter({
  label,
  value,
  pct,
  variant,
  style = "ring",
  size = "md",
  ringThickness = "normal",
  hideFooter = false,
  centerTopText,
  centerValueText,
  centerBottomText,
}: Props) {
  const gid = useId().replace(/:/g, "");
  const p = clampPct(pct);
  const d = pathForVariant(variant);
  const isHex = variant === "hex";

  const gradId = `vl-poly-grad-${gid}`;
  const trackStroke = "rgba(255,255,255,0.08)";
  const glow = variant === "triangle" ? "drop-shadow(0 0 8px rgba(0,212,255,0.35))" : "drop-shadow(0 0 10px rgba(0,212,255,0.3))";
  const hexGlow =
    "drop-shadow(0 0 4px rgba(34,211,238,0.95)) drop-shadow(0 0 14px rgba(0,184,230,0.55)) drop-shadow(0 0 22px rgba(0,212,255,0.35))";

  /** Hex trace: heavier bezel + neon stack (matches “thick line” HUD). */
  const sizeClass = isHex
    ? size === "xl"
      ? "h-[208px] w-[208px]"
      : size === "lg"
        ? "h-[168px] w-[168px]"
        : size === "sm"
          ? "h-[96px] w-[96px]"
          : "h-[112px] w-[112px]"
    : size === "xl"
      ? "h-[160px] w-[160px]"
      : size === "lg"
        ? "h-[132px] w-[132px]"
        : size === "sm"
          ? "h-[86px] w-[86px]"
          : "h-[100px] w-[100px]";
  const thicknessBoost = ringThickness === "thick" ? 1.45 : 1;
  const ringTrackW = (isHex ? 6.5 : 5) * thicknessBoost;
  const ringNeonW = (isHex ? 6 : 5) * thicknessBoost;

  if (style === "fill") {
    return (
      <div className="flex flex-col items-center gap-2 text-center">
        <div className={`relative ${sizeClass}`} aria-hidden>
          <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
            <defs>
              <linearGradient id={`${gradId}-fill`} x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="rgba(0,212,255,0.85)" />
                <stop offset="55%" stopColor="rgba(56,189,248,0.5)" />
                <stop offset="100%" stopColor="rgba(52,211,153,0.35)" />
              </linearGradient>
              <linearGradient id={`${gradId}-edge`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#5eead4" />
                <stop offset="45%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#00b8e6" />
              </linearGradient>
              <filter id={`${gradId}-bloom`} x="-35%" y="-35%" width="170%" height="170%">
                <feGaussianBlur stdDeviation="1.8" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <clipPath id={`${gradId}-clip`}>
                <path d={d} />
              </clipPath>
            </defs>
            <path
              d={d}
              fill="rgba(6,18,30,0.9)"
              stroke={isHex ? "rgba(0,212,255,0.2)" : "rgba(0,212,255,0.35)"}
              strokeWidth={isHex ? 2 : 1.5}
              strokeLinejoin="round"
            />
            <g clipPath={`url(#${gradId}-clip)`}>
              <rect x="0" y={100 - p} width="100" height="100" fill={`url(#${gradId}-fill)`} opacity={0.92} />
            </g>
            {isHex ? (
              <>
                <path
                  d={d}
                  fill="none"
                  stroke="rgba(255,255,255,0.07)"
                  strokeWidth={8}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                <path
                  d={d}
                  fill="none"
                  stroke={`url(#${gradId}-edge)`}
                  strokeWidth={5.5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  filter={`url(#${gradId}-bloom)`}
                />
                <path
                  d={d}
                  fill="none"
                  stroke={`url(#${gradId}-edge)`}
                  strokeWidth={4}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  style={{ filter: hexGlow }}
                />
                <path
                  d={d}
                  fill="none"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth={1.25}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </>
            ) : (
              <path d={d} fill="none" stroke="rgba(0,212,255,0.45)" strokeWidth="1.2" />
            )}
          </svg>
          {centerValueText || centerTopText || centerBottomText ? (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              {centerTopText ? <p className="text-[9px] uppercase tracking-[0.14em] text-[var(--text-muted)]">{centerTopText}</p> : null}
              {centerValueText ? <p className="text-base font-bold tabular-nums text-[var(--text-primary)]">{centerValueText}</p> : null}
              {centerBottomText ? <p className="text-[10px] text-[var(--text-secondary)]">{centerBottomText}</p> : null}
            </div>
          ) : null}
        </div>
        {!hideFooter ? (
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">{label}</p>
            <p className="text-xs font-semibold tabular-nums text-[var(--text-primary)]">{value}</p>
            <p className="text-[10px] tabular-nums text-[var(--text-secondary)]">{p}% fill</p>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className={`relative ${sizeClass}`} aria-hidden>
        <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#5eead4" />
              <stop offset="50%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#00b8e6" />
            </linearGradient>
            {isHex ? (
              <filter id={`${gradId}-ringbloom`} x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="2" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            ) : null}
          </defs>
          <path
            d={d}
            fill="none"
            stroke={trackStroke}
            strokeWidth={ringTrackW}
            strokeLinejoin="round"
            strokeLinecap="round"
            pathLength={100}
          />
          {isHex ? (
            <path
              d={d}
              fill="none"
              stroke={`url(#${gradId})`}
              strokeWidth={ringNeonW}
              strokeLinejoin="round"
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray={`${p} ${100 - p + 0.001}`}
              filter={`url(#${gradId}-ringbloom)`}
              style={{ opacity: 0.88 }}
            />
          ) : null}
          <path
            d={d}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={ringNeonW}
            strokeLinejoin="round"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={`${p} ${100 - p + 0.001}`}
            style={{ filter: isHex ? hexGlow : glow }}
          />
        </svg>
        {centerValueText || centerTopText || centerBottomText ? (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            {centerTopText ? <p className="text-[9px] uppercase tracking-[0.14em] text-[var(--text-muted)]">{centerTopText}</p> : null}
            {centerValueText ? <p className="text-base font-bold tabular-nums text-[var(--text-primary)]">{centerValueText}</p> : null}
            {centerBottomText ? <p className="text-[10px] text-[var(--text-secondary)]">{centerBottomText}</p> : null}
          </div>
        ) : null}
      </div>
      {!hideFooter ? (
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">{label}</p>
          <p className="text-xs font-semibold tabular-nums text-[var(--text-primary)]">{value}</p>
          <p className="text-[10px] tabular-nums text-[var(--text-secondary)]">{p}% trace</p>
        </div>
      ) : null}
    </div>
  );
}
