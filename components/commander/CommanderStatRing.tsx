"use client";

import { EnergyRing, type EnergyRingMode } from "@/components/hud-test/EnergyRing";

type Variant = "energy" | "focus" | "load";

const LOW_VALUE_HINT: Record<Variant, string> = {
  energy: "Slaap of rust eerst",
  focus: "Neem een korte pauze",
  load: "Verlaag je planning vandaag",
};

type Props = {
  value: number;
  variant: Variant;
};

export function CommanderStatRing({ value, variant }: Props) {
  const pct = Math.min(100, Math.max(0, value));
  const absolute = (pct / 10).toFixed(1);
  const isLow = pct <= 20;
  const lowHint = LOW_VALUE_HINT[variant];
  const label = variant === "energy" ? "Energy" : variant === "focus" ? "Focus" : "Load";
  // Threshold mapping:
  // <=20 red, 21-69 default, 70-89 green, >=90 peak green
  let mode: EnergyRingMode = "default";
  if (pct <= 20) mode = "high-alert";
  else if (pct >= 90) mode = "green-peak";
  else if (pct >= 70) mode = "green";

  return (
    <div className="flex flex-col items-center gap-1">
      <EnergyRing progress={pct} size={102} label={label} value={`${pct}%`} mode={mode} softGlow />
      <span className="text-[10px] tabular-nums text-[var(--text-muted)]" aria-hidden>
        {absolute}/10
      </span>
      {isLow && lowHint && (
        <span className="text-[10px] text-red-300/90 text-center max-w-[4rem]" role="status">
          {lowHint}
        </span>
      )}
    </div>
  );
}
