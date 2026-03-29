"use client";

import React from "react";
import styles from "@/components/hud-test/hud.module.css";
import type { EnergyRingMode } from "@/components/hud-test/EnergyRing";

/** Flat-top hex, clockwise from top — matches PolygonHudMeter */
const HEX_PATH = "M 50 12 L 79 29 L 79 71 L 50 88 L 21 71 L 21 29 Z";

const DIAMOND_PATH = "M 50 6 L 88 50 L 50 94 L 12 50 Z";

export type VisualLabShapeEnergyRingProps = {
  shape: "hex" | "diamond";
  size?: number;
  progress: number;
  arcFillPct?: number;
  label?: string;
  value?: string;
  mode?: EnergyRingMode;
  softGlow?: boolean;
};

function ringPalette(mode: EnergyRingMode | undefined, soft: boolean) {
  const modeRgb = "var(--mode-rgb, 0, 212, 255)";
  const isAlert = mode === "alert";
  const isHighAlert = mode === "high-alert";
  const isGreen = mode === "green";
  const isGreenPeak = mode === "green-peak";
  const ringCore = isHighAlert
    ? "#b91c1c"
    : isAlert
      ? "#ff9a3c"
      : isGreenPeak
        ? "#00ff88"
        : isGreen
          ? "#00e876"
          : "#00E5FF";
  const ringMid = isHighAlert
    ? "#dc2626"
    : isAlert
      ? "#ffb066"
      : isGreenPeak
        ? "#65ffb2"
        : isGreen
          ? "#46f39c"
          : "#00B8E6";
  const ringTrack = isHighAlert
    ? "rgba(255,64,64,0.16)"
    : isAlert
      ? "rgba(255,154,60,0.12)"
      : isGreenPeak
        ? "rgba(0,255,136,0.18)"
        : isGreen
          ? "rgba(0,232,118,0.14)"
          : `rgba(${modeRgb},0.14)`;
  const ringHalo = isHighAlert
    ? soft
      ? "rgba(185,28,28,0.28)"
      : "rgba(185,28,28,0.42)"
    : isAlert
      ? soft
        ? "rgba(255,154,60,0.24)"
        : "rgba(255,154,60,0.45)"
      : isGreenPeak
        ? soft
          ? "rgba(0,255,136,0.34)"
          : "rgba(0,255,136,0.62)"
        : isGreen
          ? soft
            ? "rgba(0,232,118,0.26)"
            : "rgba(0,232,118,0.44)"
          : soft
            ? `rgba(${modeRgb},0.24)`
            : `rgba(${modeRgb},0.45)`;
  return { ringCore, ringMid, ringTrack, ringHalo };
}

const HEX_TICKS: [number, number][] = [
  [50, 12],
  [79, 29],
  [79, 71],
  [50, 88],
  [21, 71],
  [21, 29],
];
const DIAMOND_TICKS: [number, number][] = [
  [50, 6],
  [88, 50],
  [50, 94],
  [12, 50],
];

/**
 * EnergyRing-style stroke progress on a closed hex or diamond path (visual lab only).
 */
export function VisualLabShapeEnergyRing({
  shape,
  size = 96,
  progress,
  arcFillPct,
  label = "BUDGET",
  value = "48%",
  mode = "default",
  softGlow = true,
}: VisualLabShapeEnergyRingProps) {
  const soft = softGlow;
  const d = shape === "hex" ? HEX_PATH : DIAMOND_PATH;
  const arcClamp = Math.max(0, Math.min(100, arcFillPct ?? progress));
  const { ringCore, ringMid, ringTrack, ringHalo } = ringPalette(mode, soft);
  const modeRgb = "var(--mode-rgb, 0, 212, 255)";
  const isHighAlert = mode === "high-alert";
  const isAlert = mode === "alert";
  const isGreenPeak = mode === "green-peak";
  const isGreen = mode === "green";
  const isLocked = mode === "locked";

  const strokeW = soft ? 4.8 : 6.8;
  const trackW = soft ? 4 : 5.5;
  const gradientId = React.useId().replace(/:/g, "");
  const glowId = React.useId().replace(/:/g, "");
  const valueFontSize = Math.max(14, Math.round(size * 0.16));

  const tickFill = isHighAlert
    ? "rgba(255,64,64,0.24)"
    : isAlert
      ? "rgba(255,154,60,0.24)"
      : isGreenPeak
        ? "rgba(0,255,136,0.24)"
        : isGreen
          ? "rgba(0,232,118,0.2)"
          : `rgba(${modeRgb},0.2)`;

  const ticks = shape === "hex" ? HEX_TICKS : DIAMOND_TICKS;

  const ambientR = soft ? 42 : 44;

  return (
    <div
      className={styles.energyRingWrapper}
      data-mode={mode}
      style={
        soft
          ? {
              width: size,
              height: size,
              animation: "none",
              boxShadow: isHighAlert
                ? "0 0 7px rgba(185,28,28,0.24), 0 0 14px rgba(185,28,28,0.06)"
                : isGreenPeak
                  ? "0 0 7px rgba(0,255,136,0.2), 0 0 14px rgba(0,255,136,0.06)"
                  : isGreen
                    ? "0 0 6px rgba(0,232,118,0.18), 0 0 12px rgba(0,232,118,0.06)"
                    : "0 0 6px rgba(0,229,255,0.18), 0 0 12px rgba(0,229,255,0.06)",
            }
          : { width: size, height: size }
      }
    >
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={ringMid} />
            <stop offset="100%" stopColor={ringCore} />
          </linearGradient>
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={soft ? 1.4 : 3.2} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle cx={50} cy={50} r={ambientR} fill={ringHalo} style={{ opacity: soft ? 0.2 : 0.32 }} />

        <path
          d={d}
          fill="none"
          stroke={ringTrack}
          strokeWidth={trackW}
          strokeLinejoin="round"
          strokeLinecap="round"
          pathLength={100}
        />

        <path
          d={d}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeW}
          strokeLinejoin="round"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${arcClamp} ${100 - arcClamp + 0.001}`}
          filter={`url(#${glowId})`}
          style={{
            transition: "stroke-dasharray 900ms cubic-bezier(0.4,0,0.2,1)",
            opacity: isLocked ? 0.6 : soft ? 0.78 : 1,
          }}
        />

        <path
          d={d}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeW}
          strokeLinejoin="round"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${arcClamp} ${100 - arcClamp + 0.001}`}
          style={{
            transition: "stroke-dasharray 900ms cubic-bezier(0.4,0,0.2,1)",
            opacity: isLocked ? 0.55 : 1,
          }}
        />

        <path
          d={d}
          fill="none"
          stroke={ringHalo}
          strokeWidth={soft ? 1.1 : 1.6}
          strokeLinejoin="round"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${arcClamp} ${100 - arcClamp + 0.001}`}
          strokeDashoffset={0.35}
          style={{ opacity: soft ? 0.45 : 0.55 }}
        />

        {ticks.map(([tx, ty], i) => (
          <circle key={`tick-${i}`} cx={tx} cy={ty} r={1.25} fill={tickFill} />
        ))}
      </svg>

      <div className={styles.energyRingCenter}>
        {label ? <div className={styles.energyRingLabel}>{label}</div> : null}
        <div className={styles.energyRingValue} style={{ fontSize: `${valueFontSize}px`, marginTop: label ? 4 : 0 }}>
          {value}
        </div>
      </div>
    </div>
  );
}
