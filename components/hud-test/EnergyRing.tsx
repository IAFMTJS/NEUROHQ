"use client";

import React from "react";
import styles from "./hud.module.css";

export type EnergyRingMode =
  | "default"
  | "alert"
  | "high-alert"
  | "green"
  | "green-peak"
  | "locked";

export type EnergyRingProps = {
  size?: number;
  progress: number;
  label?: string;
  value?: string;
  mode?: EnergyRingMode;
  /** Use toned-down glow for compact stat rings. */
  softGlow?: boolean;
};

/**
 * Primary Core Energy Ring v3 – Game Engine Level
 * Layer stack:
 * 1) Ambient radial light
 * 2) Base track
 * 3) Active arc core
 * 4) Active arc glow duplicate
 * 5) Micro tick marks
 * 6) Floating dust particles
 * 7) Inner core vignette
 * 8) Center value glow text
 */
export function EnergyRing({
  size = 260,
  progress,
  label = "BUDGET",
  value = "€2,430",
  mode = "default",
  softGlow = false,
}: EnergyRingProps) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, progress));
  const offset = circumference - (clamped / 100) * circumference;
  const center = size / 2;
  const valueFontSize = Math.max(15, Math.round(size * 0.16));
  const ticks = 12;
  const gradientId = React.useId();
  const glowId = React.useId();

  const isAlert = mode === "alert";
  const isHighAlert = mode === "high-alert";
  const isGreen = mode === "green";
  const isGreenPeak = mode === "green-peak";
  const isLocked = mode === "locked";
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
      : "rgba(0,200,255,0.12)";
  const ringHalo = isHighAlert
    ? softGlow
      ? "rgba(185,28,28,0.28)"
      : "rgba(185,28,28,0.42)"
    : isAlert
      ? softGlow
        ? "rgba(255,154,60,0.24)"
        : "rgba(255,154,60,0.45)"
      : isGreenPeak
        ? softGlow
          ? "rgba(0,255,136,0.34)"
          : "rgba(0,255,136,0.62)"
        : isGreen
          ? softGlow
            ? "rgba(0,232,118,0.26)"
            : "rgba(0,232,118,0.44)"
      : softGlow
        ? "rgba(0,229,255,0.24)"
        : "rgba(0,229,255,0.45)";

  const dust = [
    { top: "12%", left: "54%", size: 2, delay: "0s", duration: "7s" },
    { top: "24%", left: "78%", size: 1, delay: "1.3s", duration: "9s" },
    { top: "66%", left: "20%", size: 3, delay: "0.8s", duration: "11s" },
    { top: "76%", left: "64%", size: 2, delay: "2.1s", duration: "10s" },
    { top: "42%", left: "88%", size: 1, delay: "1.8s", duration: "8s" },
    { top: "32%", left: "14%", size: 2, delay: "0.4s", duration: "12s" },
  ];

  return (
    <div
      className={styles.energyRingWrapper}
      data-mode={mode}
      style={
        softGlow
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
            <stop offset="100%" stopColor={ringCore} />
          </linearGradient>

          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={softGlow ? 1.6 : 4} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ambient radial light */}
        <circle
          cx={center}
          cy={center}
          r={softGlow ? radius + 10 : radius + 18}
          fill={softGlow ? ringHalo.replace(/0\.\d+\)/, "0.08)") : ringHalo.replace("0.45", "0.1")}
        />

        {/* Base track */}
        <circle
          stroke={ringTrack}
          fill="transparent"
          strokeWidth={softGlow ? Math.max(4, strokeWidth - 3) : strokeWidth}
          r={radius}
          cx={center}
          cy={center}
        />

        {/* Active arc glow duplicate */}
        <circle
          stroke={`url(#${gradientId})`}
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={center}
          cy={center}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          filter={`url(#${glowId})`}
          className={!isLocked && !softGlow ? styles.energyArcGlow : ""}
          style={{
            transition: "stroke-dashoffset 900ms cubic-bezier(0.4,0,0.2,1)",
            opacity: isLocked ? 0.6 : softGlow ? 0.78 : 1,
          }}
        />

        {/* Active arc core */}
        <circle
          stroke={`url(#${gradientId})`}
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={center}
          cy={center}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: "stroke-dashoffset 900ms cubic-bezier(0.4,0,0.2,1)",
          }}
        />

        {/* Faint outer stroke for non-uniform rim density */}
        <circle
          stroke={ringHalo}
          fill="transparent"
          strokeWidth={softGlow ? 1.2 : 2}
          r={softGlow ? radius + 2 : radius + 3}
          cx={center}
          cy={center}
          strokeDasharray={circumference}
          strokeDashoffset={offset * 1.02}
          strokeLinecap="round"
          className={softGlow ? "" : styles.energyArcOuter}
        />

        {/* Micro tick marks – round cx/cy to avoid SSR/client float hydration mismatch */}
        {Array.from({ length: ticks }).map((_, i) => {
          const angle = (i / ticks) * Math.PI * 2 - Math.PI / 2;
          const x = Math.round((center + Math.cos(angle) * (radius + 8)) * 100) / 100;
          const y = Math.round((center + Math.sin(angle) * (radius + 8)) * 100) / 100;
          return <circle key={`tick-${i}`} cx={x} cy={y} r={1.3} fill={isAlert ? "rgba(255,154,60,0.24)" : "rgba(0,200,255,0.18)"} />;
        })}
      </svg>

      {/* Floating dust particles */}
      {!isLocked && !softGlow &&
        dust.map((p, i) => (
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
        ))}

      {/* Inner core vignette + value */}
      <div className={styles.energyRingCenter}>
        {label ? <div className={styles.energyRingLabel}>{label}</div> : null}
        <div
          className={styles.energyRingValue}
          style={{ fontSize: `${valueFontSize}px`, marginTop: label ? 4 : 0, lineHeight: 1 }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

