"use client";

import { useEffect, useId, useState } from "react";

const SIZE = 104;
const STROKE = 8;
const R = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;

type GlowVariant = "focus" | "energy" | "warning";

const glowColors: Record<GlowVariant, string> = {
  energy: "rgba(0, 255, 200, 0.4)",
  focus: "rgba(0, 200, 255, 0.5)",
  warning: "rgba(255, 140, 0, 0.5)",
};

type Props = {
  value: number;
  label: string;
  description: string;
  variant: GlowVariant;
  delay?: number;
};

export function RadialMeter({ value, label, description, variant, delay = 0 }: Props) {
  const [mounted, setMounted] = useState(false);
  const id = useId().replace(/:/g, "");
  const gradId = `grad-${variant}-${id}`;
  const filterId = `glow-${variant}-${id}`;

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80 + delay);
    return () => clearTimeout(t);
  }, [delay]);

  const clamped = Math.min(100, Math.max(0, value));
  const offset = CIRCUMFERENCE * (1 - clamped / 100);

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative"
        style={{ width: SIZE, height: SIZE }}
        aria-hidden
      >
        <svg
          width={SIZE}
          height={SIZE}
          className="-rotate-90"
          aria-hidden
        >
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={variant === "energy" ? "#0D9488" : variant === "focus" ? "#00C8FF" : "#EA580C"} />
              <stop offset="100%" stopColor={variant === "energy" ? "#00FFC6" : variant === "focus" ? "#7DD3FC" : "#FBBF24"} />
            </linearGradient>
            <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feFlood floodColor={glowColors[variant]} floodOpacity="1" />
              <feComposite in2="blur" operator="in" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke="var(--accent-neutral)"
            strokeWidth={STROKE}
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={mounted ? offset : CIRCUMFERENCE}
            filter={`url(#${filterId})`}
            style={{
              transition: "stroke-dashoffset 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            }}
          />
        </svg>
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)" }}
        >
          {Math.round(clamped)}%
        </div>
      </div>
      <span className="hq-label">{label}</span>
      <span className="hq-body text-center text-sm max-w-[120px] leading-relaxed">{description}</span>
    </div>
  );
}
