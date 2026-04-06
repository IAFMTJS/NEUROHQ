"use client";

import { EnergyRing } from "@/components/hud-test/EnergyRing";
import { brainStatusRingModeFromPct } from "@/lib/dashboard-utils";

type Variant = "energy" | "focus" | "load";

const LOW_VALUE_HINT: Record<Variant, string> = {
  energy: "Slaap of rust eerst",
  focus: "Neem een korte pauze",
  load: "Verlaag je planning vandaag",
};

type Props = {
  value: number;
  variant: Variant;
  /** Default 102; bridge dashboard gebruikt grotere ringen. */
  size?: number;
};

export function CommanderStatRing({ value, variant, size = 102 }: Props) {
  const pct = Math.min(100, Math.max(0, value));
  const absolute = (pct / 10).toFixed(1);
  const isLow = variant === "load" ? pct >= 80 : pct <= 20;
  const lowHint = LOW_VALUE_HINT[variant];
  const label = variant === "energy" ? "Energy" : variant === "focus" ? "Focus" : "Load";
  const mode = brainStatusRingModeFromPct(pct);

  return (
    <div className="flex flex-col items-center gap-1">
      <EnergyRing progress={pct} size={size} label={label} value={`${pct}%`} mode={mode} softGlow />
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
