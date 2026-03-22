"use client";

import { weeklyDifficultyFromBrain } from "@/lib/growth/adaptive-engine";

/** Lightweight D.3 indicator: suggested difficulty from brain aggregates (stub). */
export function GrowthAdaptiveHint(props: {
  energyAvg: number | null;
  focusAvg: number | null;
  brainLogged: boolean;
}) {
  const { tier, lockedPhase } = weeklyDifficultyFromBrain(props);
  return (
    <p className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-elevated)]/80 px-3 py-2 text-xs text-[var(--text-muted)]">
      <span className="font-medium text-[var(--text-secondary)]">Adaptive (preview):</span> suggestie{" "}
      <strong className="text-[var(--semantic-accent)]">{tier}</strong> · fase {lockedPhase}. Volledige weekly lock
      volgt in engine-fase 2.
    </p>
  );
}
