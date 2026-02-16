"use client";

import { useEffect, useId, useState } from "react";

const SIZE = 104;
const STROKE = 10;
/** Reference: progress ring 3–4px thickness on hero */
const STROKE_THIN = 4;
const SIZE_COMPACT = 72;
const R = (SIZE - STROKE) / 2;
const R_THIN = (SIZE_COMPACT - STROKE_THIN) / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;
const CIRCUMFERENCE_THIN = 2 * Math.PI * R_THIN;

type GlowVariant = "focus" | "energy" | "warning";

/** Design tokens: --ring-*-start, --ring-*-gradient, --ring-*-glow */
const gradientStops: Record<GlowVariant, [string, string]> = {
  energy: ["var(--ring-energy-start)", "var(--ring-energy-gradient)"],
  focus: ["var(--ring-focus-start)", "var(--ring-focus-gradient)"],
  warning: ["var(--ring-load-start)", "var(--ring-load-gradient)"],
};

const glowColors: Record<GlowVariant, string> = {
  energy: "var(--ring-energy-glow)",
  focus: "var(--ring-focus-glow)",
  warning: "var(--ring-load-glow)",
};

type Props = {
  value: number;
  label: string;
  description?: string;
  variant: GlowVariant;
  delay?: number;
  /** Hero variant: smaller circle, 3–4px stroke, no description (reference) */
  thin?: boolean;
};

export function RadialMeter({ value, label, description, variant, delay = 0, thin = false }: Props) {
  const [mounted, setMounted] = useState(false);
  const id = useId().replace(/:/g, "");
  const gradId = `grad-${variant}-${id}`;
  const filterId = `glow-${variant}-${id}`;

  const size = thin ? SIZE_COMPACT : SIZE;
  const stroke = thin ? STROKE_THIN : STROKE;
  const r = thin ? R_THIN : R;
  const circumference = thin ? CIRCUMFERENCE_THIN : CIRCUMFERENCE;

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80 + delay);
    return () => clearTimeout(t);
  }, [delay]);

  const clamped = Math.min(100, Math.max(0, value));
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative"
        style={{ width: size, height: size }}
        aria-hidden
      >
        <svg
          width={size}
          height={size}
          className="-rotate-90"
          aria-hidden
        >
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={gradientStops[variant][0]} />
              <stop offset="100%" stopColor={gradientStops[variant][1]} />
            </linearGradient>
            <filter id={filterId} x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation={thin ? "2" : "4"} result="blur" />
              <feFlood floodColor={glowColors[variant]} floodOpacity="1" />
              <feComposite in2="blur" operator="in" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(0, 229, 255, 0.12)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={mounted ? offset : circumference}
            filter={`url(#${filterId})`}
            style={{
              transition: "stroke-dashoffset 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            }}
          />
        </svg>
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-0 hq-percentage"
          style={{
            fontSize: thin ? "1rem" : "1.5rem",
            fontWeight: 700,
            color: "var(--text-primary)",
          }}
        >
          {Math.round(clamped)}%
        </div>
      </div>
      <span className="hq-label text-[var(--text-secondary)]">{label}</span>
      {description != null && !thin && (
        <span className="hq-body text-center text-sm max-w-[120px] leading-relaxed">{description}</span>
      )}
    </div>
  );
}
