"use client";

import React from "react";
import { ProgressRing } from "./ProgressRing";
import styles from "./hud.module.css";
import { EnergyRing } from "./EnergyRing";

type Common = {
  value: number;
  label?: string;
  className?: string;
};

export function PrimaryRing({ value, label = "Budget", className = "" }: Common) {
  return (
    <div className={className}>
      <ProgressRing progress={value} size={176} thickness={10} label={label} valueText={`${value}%`} />
    </div>
  );
}

export function MiniRing({ value, label = "Focus", className = "" }: Common) {
  return (
    <div className={`${styles.miniRingWrap} ${className}`.trim()}>
      <ProgressRing progress={value} size={96} thickness={6} label={label} valueText={`${value}%`} />
    </div>
  );
}

export function DoubleRing({
  outerValue,
  innerValue,
  label = "Dual",
  className = "",
}: {
  outerValue: number;
  innerValue: number;
  label?: string;
  className?: string;
}) {
  const outerSize = 140;
  const innerSize = 104;
  return (
    <div className={`relative inline-flex h-[140px] w-[140px] items-center justify-center ${className}`.trim()}>
      <ProgressRing progress={outerValue} size={outerSize} thickness={8} label={label} valueText={`${outerValue}%`} />
      <div className="absolute">
        <ProgressRing progress={innerValue} size={innerSize} thickness={4} label="Load" valueText={`${innerValue}%`} />
      </div>
    </div>
  );
}

export function SegmentedTacticalRing({
  value,
  size = 132,
  thickness = 8,
  label = "Tactical",
  className = "",
}: Common & { size?: number; thickness?: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference / 20;
  const gap = dash * 0.45;
  const activeLength = (clamped / 100) * circumference;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`.trim()}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(0,200,255,0.12)"
          strokeWidth={thickness}
          fill="transparent"
          strokeDasharray={`${dash - gap} ${gap}`}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#seg-ring)"
          strokeWidth={thickness}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={`${dash - gap} ${gap}`}
          strokeDashoffset={circumference - activeLength}
          style={{ transition: "stroke-dashoffset 600ms var(--transition-ease)" }}
        />
        <defs>
          <linearGradient id="seg-ring" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--cyan-mid)" />
            <stop offset="100%" stopColor="var(--primary-cyan)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute text-center">
        <p className="text-[10px] uppercase tracking-[0.12em] text-[#9befff]">{label}</p>
        <p className="text-xl font-bold text-[var(--peak-white)]">{clamped}%</p>
      </div>
    </div>
  );
}

export function AlertRing({
  value,
  label = "Alert",
  className = "",
}: Common) {
  return (
    <div className={className}>
      <ProgressRing
        progress={value}
        size={132}
        thickness={8}
        label={label}
        valueText={`${value}%`}
        tone="orange"
      />
    </div>
  );
}

export function LockedRing({
  value,
  label = "Locked",
  className = "",
}: Common) {
  return (
    <div className={`${styles.stateLocked} ${className}`.trim()}>
      <ProgressRing
        progress={value}
        size={132}
        thickness={8}
        label={label}
        valueText={`${value}%`}
        animated={false}
      />
    </div>
  );
}

export function HighAlertRing({
  value,
  label = "High Alert",
  className = "",
}: Common) {
  const clamped = Math.max(0, Math.min(100, value));
  const mode = clamped < 20 ? "high-alert" : "alert";
  return (
    <div className={className}>
      <EnergyRing
        progress={clamped}
        label={label}
        value={`${clamped}%`}
        mode={mode}
      />
    </div>
  );
}

export function AdaptiveStatusRing({
  value,
  label = "Status",
  className = "",
}: Common) {
  const clamped = Math.max(0, Math.min(100, value));
  let mode: "default" | "green" | "green-peak" | "high-alert" = "default";

  if (clamped < 20) mode = "high-alert";
  else if (clamped >= 80) mode = "green-peak";
  else if (clamped >= 60) mode = "green";

  return (
    <div className={className}>
      <EnergyRing
        progress={clamped}
        label={label}
        value={`${clamped}%`}
        mode={mode}
      />
    </div>
  );
}

