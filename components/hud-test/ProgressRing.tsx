"use client";

import React from "react";
import styles from "./hud.module.css";

export type ProgressRingProps = {
  size?: number;
  progress: number;
  ticks?: number;
  thickness?: number;
  label?: string;
  valueText?: string;
  tone?: "cyan" | "orange";
  animated?: boolean;
};

/**
 * SVG progress ring with strict HUD layer order:
 * base circle, active arc, ticks, center value.
 */
export function ProgressRing({
  size = 176,
  progress,
  ticks = 10,
  thickness = 10,
  label = "Budget",
  valueText = "€2,430",
  tone = "cyan",
  animated = true,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, progress));
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - clamped / 100);
  const center = size / 2;
  const gradientId = React.useId();
  const dust = [
    { top: "18%", left: "62%" },
    { top: "26%", left: "78%" },
    { top: "68%", left: "24%" },
    { top: "74%", left: "66%" },
  ];
  const glowStroke =
    tone === "orange" ? "rgba(255,154,60,0.28)" : "rgba(0,229,255,0.22)";
  const startColor = tone === "orange" ? "#ffb066" : "var(--cyan-mid)";
  const endColor = tone === "orange" ? "#ff9a3c" : "var(--primary-cyan)";
  const tickColor =
    tone === "orange" ? "rgba(255,154,60,0.24)" : "rgba(0, 200, 255, 0.18)";

  return (
    <div className={styles.ringWrapper} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="rgba(0, 200, 255, 0.12)"
          strokeWidth={thickness}
          fill="transparent"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={thickness}
          strokeLinecap="round"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{
            transition: `stroke-dashoffset 600ms var(--transition-ease)`,
          }}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={glowStroke}
          strokeWidth={Math.max(2, thickness - 2)}
          strokeLinecap="round"
          fill="transparent"
          className={animated ? styles.ringArcGlow : ""}
        />

        {Array.from({ length: ticks }).map((_, i) => {
          const angle = (i / ticks) * Math.PI * 2 - Math.PI / 2;
          const tx = center + Math.cos(angle) * (radius + thickness * 0.9);
          const ty = center + Math.sin(angle) * (radius + thickness * 0.9);
          return (
            <circle
              key={`tick-${i}`}
              cx={tx}
              cy={ty}
              r={1.4}
              fill={tickColor}
            />
          );
        })}

        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={startColor} />
            <stop offset="100%" stopColor={endColor} />
          </linearGradient>
        </defs>
      </svg>
      {size >= 120 && animated
        ? dust.map((point, index) => (
            <span
              key={`dust-${index}`}
              className={styles.ringDust}
              style={point}
            />
          ))
        : null}
      <div className={styles.ringCenter}>
        <span className={styles.ringMeta}>{label}</span>
        <span
          className={styles.ringValue}
          style={{ fontSize: `${Math.max(24, size * 0.16)}px` }}
        >
          {valueText}
        </span>
      </div>
    </div>
  );
}

