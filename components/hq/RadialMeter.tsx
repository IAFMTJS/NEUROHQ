"use client";

import { useEffect, useState, useId } from "react";

const SIZE = 104;
const STROKE = 10;
/** Reference: thin glowing ring on hero – cinematic 3D */
const STROKE_THIN = 5;
const SIZE_COMPACT = 80;
const R = (SIZE - STROKE) / 2;
const R_THIN = (SIZE_COMPACT - STROKE_THIN) / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;
const CIRCUMFERENCE_THIN = 2 * Math.PI * R_THIN;

type GlowVariant = "focus" | "energy" | "warning";

const gradientStops: Record<GlowVariant, [string, string]> = {
  energy: ["#14B8A6", "#00E876"],
  focus: ["#38BDF8", "#A78BFA"],
  warning: ["#F97316", "#FBBF24"],
};

const glowColors: Record<GlowVariant, string> = {
  energy: "rgba(0, 232, 118, 0.7)",
  focus: "rgba(0, 229, 255, 0.65)",
  warning: "rgba(251, 191, 36, 0.6)",
};

const textGlowShadow: Record<GlowVariant, string> = {
  energy: "0 0 12px rgba(0, 232, 118, 0.5), 0 0 4px rgba(34, 211, 238, 0.3)",
  focus: "0 0 12px rgba(0, 229, 255, 0.5), 0 0 4px rgba(147, 197, 253, 0.3)",
  warning: "0 0 12px rgba(251, 191, 36, 0.4), 0 1px 2px rgba(0,0,0,0.3)",
};

type Props = {
  value: number;
  label: string;
  description?: string;
  variant: GlowVariant;
  delay?: number;
  thin?: boolean;
  /** Optional value for the text label; can be negative. */
  displayValue?: number;
};

export function RadialMeter({
  value,
  label,
  description,
  variant,
  delay = 0,
  thin = false,
  displayValue,
}: Props) {
  const [mounted, setMounted] = useState(false);
  // useId() generates stable IDs that match between server and client in React 18+
  const reactId = useId();
  // Remove colons and other special chars that might cause issues in SVG IDs
  const safeId = reactId.replace(/[:]/g, "-");
  const gradId = `grad-${variant}-${safeId}`;
  const filterId = `glow-${variant}-${safeId}`;

  const size = thin ? SIZE_COMPACT : SIZE;
  const stroke = thin ? STROKE_THIN : STROKE;
  const r = thin ? R_THIN : R;
  const circumference = thin ? CIRCUMFERENCE_THIN : CIRCUMFERENCE;

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80 + delay);
    return () => clearTimeout(t);
  }, [delay]);

  const clamped = Math.min(100, Math.max(0, value));
  const display = displayValue ?? clamped;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="radial-meter-3d relative"
        style={{ width: size, height: size }}
        aria-hidden
      >
        <svg
          width={size}
          height={size}
          className="-rotate-90"
          aria-hidden
          suppressHydrationWarning
        >
          <defs suppressHydrationWarning>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%" suppressHydrationWarning>
              <stop offset="0%" stopColor={gradientStops[variant][0]} />
              <stop offset="100%" stopColor={gradientStops[variant][1]} />
            </linearGradient>
            <filter id={filterId} x="-100%" y="-100%" width="300%" height="300%" suppressHydrationWarning>
              <feGaussianBlur stdDeviation={thin ? "4" : "6"} result="glowBlur" />
              <feFlood floodColor={glowColors[variant]} floodOpacity="1" result="glowColor" />
              <feComposite in="glowColor" in2="glowBlur" operator="in" result="softGlow" />
              <feMerge>
                <feMergeNode in="softGlow" />
                <feMergeNode in="softGlow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Recessed track – dark, inner feel */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(0, 0, 0, 0.4)"
            strokeWidth={stroke + 2}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(0, 229, 255, 0.08)"
            strokeWidth={stroke}
          />
          {/* Rim highlight – thin cyan/blue edge on track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(255, 255, 255, 0.06)"
            strokeWidth={1.5}
          />
          {/* Progress arc – bright gradient + strong glow (3D raised) */}
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
            suppressHydrationWarning
            style={{
              transition: "stroke-dashoffset 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            }}
          />
        </svg>
        {/* Soft inner gradient – cinematic depth inside ring */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none rounded-full"
          style={{
            background: "radial-gradient(ellipse 75% 75% at 50% 50%, rgba(15,22,35,0.5), transparent 70%)",
          }}
          aria-hidden
        />
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-0 radial-meter-value pointer-events-none"
          style={{
            fontSize: thin ? "1.05rem" : "1.5rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            textShadow: `${textGlowShadow[variant]}, 0 1px 2px rgba(0,0,0,0.35)`,
          }}
        >
          {Math.round(display)}%
        </div>
      </div>
      <span className="hq-label text-[var(--text-secondary)] text-xs font-medium">{label}</span>
      {description != null && !thin && (
        <span className="hq-body text-center text-sm max-w-[120px] leading-relaxed">{description}</span>
      )}
    </div>
  );
}
