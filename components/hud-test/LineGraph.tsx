"use client";

import React from "react";
import styles from "./hud.module.css";

export type LineGraphProps = {
  data: number[];
  width?: number;
  height?: number;
};

/**
 * HUD trend graph:
 * - 1px grid overlay
 * - 2px gradient line
 * - glow halo
 * - endpoint highlight + vertical line
 */
export function LineGraph({ data, width = 480, height = 160 }: LineGraphProps) {
  const gradientId = React.useId();
  const blurId = React.useId();
  const padding = 18;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return { x, y, value };
  });

  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const endpoint = points.at(-1);

  if (!endpoint) return null;

  return (
    <div className={styles.lineGraphCard}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        {[0.2, 0.4, 0.6, 0.8].map((y) => (
          <line
            key={`h-${y}`}
            x1={padding}
            y1={padding + (height - padding * 2) * y}
            x2={width - padding}
            y2={padding + (height - padding * 2) * y}
            stroke="rgba(0,200,255,0.08)"
            strokeWidth="1"
          />
        ))}
        {Array.from({ length: 6 }).map((_, index) => {
          const x = padding + (index / 5) * (width - padding * 2);
          return (
            <line
              key={`v-${index}`}
              x1={x}
              y1={padding}
              x2={x}
              y2={height - padding}
              stroke="rgba(0,200,255,0.08)"
              strokeWidth="1"
            />
          );
        })}

        <line
          x1={endpoint.x}
          y1={padding}
          x2={endpoint.x}
          y2={height - padding}
          stroke="rgba(234,246,255,0.22)"
          strokeWidth="1"
        />

        <path
          d={path}
          fill="none"
          stroke="rgba(0, 200, 255, 0.16)"
          strokeWidth="10"
          filter={`url(#${blurId})`}
          className={styles.graphTrail}
        />
        <path
          d={path}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="2"
          strokeLinecap="round"
          className={styles.graphPrimary}
        />

        <circle cx={endpoint.x} cy={endpoint.y} r="4" fill="var(--peak-white)" />
        <circle cx={endpoint.x} cy={endpoint.y} r="8" fill="rgba(234,246,255,0.22)" />

        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--cyan-mid)" />
            <stop offset="100%" stopColor="var(--primary-cyan)" />
          </linearGradient>
          <filter id={blurId}>
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>
      </svg>
    </div>
  );
}

