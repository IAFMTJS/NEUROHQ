"use client";

import React from "react";
import styles from "@/components/hud-test/hud.module.css";
import type { EnergyRingMode } from "@/components/hud-test/EnergyRing";

/** ViewBox 0–100 paths — scaled to pixel `size` so stroke widths match EnergyRing (px). */
const HEX_PATH_VB = "M 50 12 L 79 29 L 79 71 L 50 88 L 21 71 L 21 29 Z";
const DIAMOND_PATH_VB = "M 50 6 L 88 50 L 50 94 L 12 50 Z";

function scalePathFromVb(d: string, size: number): string {
  const s = size / 100;
  return d.replace(/[\d.]+/g, (m) => {
    const v = parseFloat(m) * s;
    return String(Math.round(v * 1000) / 1000);
  });
}

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

const DUST = [
  { top: "12%", left: "54%", size: 2, delay: "0s", duration: "7s" },
  { top: "24%", left: "78%", size: 1, delay: "1.3s", duration: "9s" },
  { top: "66%", left: "20%", size: 3, delay: "0.8s", duration: "11s" },
  { top: "76%", left: "64%", size: 2, delay: "2.1s", duration: "10s" },
  { top: "42%", left: "88%", size: 1, delay: "1.8s", duration: "8s" },
  { top: "32%", left: "14%", size: 2, delay: "0.4s", duration: "12s" },
] as const;

/**
 * Hex / diamond rings with the same px stroke stack, ambient, ticks, dust, and vignette
 * treatment as EnergyRing (not thin viewBox-normalized strokes).
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
  const d = scalePathFromVb(shape === "hex" ? HEX_PATH_VB : DIAMOND_PATH_VB, size);
  const arcClamp = Math.max(0, Math.min(100, arcFillPct ?? progress));
  const { ringCore, ringMid, ringTrack, ringHalo } = ringPalette(mode, soft);
  const modeRgb = "var(--mode-rgb, 0, 212, 255)";
  const isHighAlert = mode === "high-alert";
  const isAlert = mode === "alert";
  const isGreenPeak = mode === "green-peak";
  const isGreen = mode === "green";
  const isLocked = mode === "locked";

  const strokeMain = 10;
  const strokeTrack = soft ? Math.max(4, strokeMain - 3) : strokeMain;
  const radius = (size - strokeMain) / 2;
  const center = size / 2;

  const gradientId = React.useId().replace(/:/g, "");
  const glowId = React.useId().replace(/:/g, "");
  const vignetteId = React.useId().replace(/:/g, "");
  const clipId = React.useId().replace(/:/g, "");

  const valueFontSize = Math.max(15, Math.round(size * 0.16));

  const tickFill = isHighAlert
    ? "rgba(255,64,64,0.24)"
    : isAlert
      ? "rgba(255,154,60,0.24)"
      : isGreenPeak
        ? "rgba(0,255,136,0.24)"
        : isGreen
          ? "rgba(0,232,118,0.2)"
          : `rgba(${modeRgb},0.2)`;

  const ticks = 12;
  const outerScale = shape === "hex" ? 1.045 : 1.05;
  const showDust = !isLocked && !soft;

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
      <svg width={size} height={size} style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={ringMid} />
            <stop offset="55%" stopColor={ringMid} />
            <stop offset="100%" stopColor={ringCore} />
          </linearGradient>
          <radialGradient id={vignetteId} cx="48%" cy="42%" r="58%">
            <stop offset="0%" stopColor="rgba(0,0,0,0.5)" />
            <stop offset="55%" stopColor="rgba(0,0,0,0.18)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
          <clipPath id={clipId}>
            <path d={d} />
          </clipPath>
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={soft ? 1.6 : 4} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ambient — same role as EnergyRing */}
        <circle
          cx={center}
          cy={center}
          r={soft ? radius + 10 : radius + 18}
          fill={ringHalo}
          style={{ opacity: soft ? 0.2 : 0.32 }}
        />

        {/* Inner well (clipped vignette) */}
        <circle cx={center} cy={center} r={radius + strokeMain} fill={`url(#${vignetteId})`} clipPath={`url(#${clipId})`} />

        {/* Bezel fill */}
        <path
          d={d}
          fill="rgba(6,18,30,0.42)"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth={1}
          strokeLinejoin="round"
        />

        {/* Base track */}
        <path
          d={d}
          fill="none"
          stroke={ringTrack}
          strokeWidth={strokeTrack}
          strokeLinejoin="round"
          strokeLinecap="round"
          pathLength={100}
        />

        {/* Active arc glow (matches EnergyRing layer order) */}
        <path
          d={d}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeMain}
          strokeLinejoin="round"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${arcClamp} ${100 - arcClamp + 0.001}`}
          filter={`url(#${glowId})`}
          style={{
            transition: "stroke-dasharray 900ms cubic-bezier(0.4,0,0.2,1)",
            opacity: isLocked ? 0.6 : soft ? 0.82 : 1,
          }}
        />

        {/* Active arc core */}
        <path
          d={d}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeMain}
          strokeLinejoin="round"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${arcClamp} ${100 - arcClamp + 0.001}`}
          style={{
            transition: "stroke-dasharray 900ms cubic-bezier(0.4,0,0.2,1)",
            opacity: isLocked ? 0.55 : 1,
          }}
        />

        {/* Specular edge on lit segment */}
        <path
          d={d}
          fill="none"
          stroke="rgba(255,255,255,0.14)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${arcClamp} ${100 - arcClamp + 0.001}`}
          style={{
            transition: "stroke-dasharray 900ms cubic-bezier(0.4,0,0.2,1)",
            opacity: isLocked ? 0.35 : 0.9,
          }}
        />

        {/* Outer rim — scaled path, same dash phase as EnergyRing outer */}
        <g transform={`translate(${center},${center}) scale(${outerScale}) translate(${-center},${-center})`}>
          <path
            d={d}
            fill="none"
            stroke={ringHalo}
            strokeWidth={soft ? 1.2 : 2}
            strokeLinejoin="round"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={`${arcClamp} ${100 - arcClamp + 0.001}`}
            strokeDashoffset={-0.4}
            className={soft ? "" : styles.energyArcOuter}
          />
        </g>

        {/* Orbital ticks — identical placement to EnergyRing (not only polygon vertices) */}
        {Array.from({ length: ticks }).map((_, i) => {
          const angle = (i / ticks) * Math.PI * 2 - Math.PI / 2;
          const x = Math.round((center + Math.cos(angle) * (radius + 8)) * 100) / 100;
          const y = Math.round((center + Math.sin(angle) * (radius + 8)) * 100) / 100;
          return <circle key={`tick-${i}`} cx={x} cy={y} r={1.3} fill={tickFill} />;
        })}
      </svg>

      {showDust
        ? DUST.map((p, i) => (
            <span
              key={`dust-${i}`}
              className={styles.energyRingDust}
              style={{
                top: p.top,
                left: p.left,
                width: p.size,
                height: p.size,
                background: isHighAlert
                  ? "rgba(255,64,64,0.22)"
                  : isAlert
                    ? "rgba(255,154,60,0.2)"
                    : isGreenPeak
                      ? "rgba(0,255,136,0.24)"
                      : isGreen
                        ? "rgba(0,232,118,0.2)"
                        : "rgba(0,229,255,0.18)",
                boxShadow: isHighAlert
                  ? "0 0 8px rgba(255,64,64,0.6)"
                  : isAlert
                    ? "0 0 7px rgba(255,154,60,0.45)"
                    : isGreenPeak
                      ? "0 0 9px rgba(0,255,136,0.62)"
                      : isGreen
                        ? "0 0 8px rgba(0,232,118,0.5)"
                        : "0 0 7px rgba(0,229,255,0.35)",
                animationDelay: p.delay,
                animationDuration: p.duration,
              }}
            />
          ))
        : null}

      <div className={styles.energyRingCenter}>
        {label ? <div className={styles.energyRingLabel}>{label}</div> : null}
        <div className={styles.energyRingValue} style={{ fontSize: `${valueFontSize}px`, marginTop: label ? 4 : 0 }}>
          {value}
        </div>
      </div>
    </div>
  );
}
