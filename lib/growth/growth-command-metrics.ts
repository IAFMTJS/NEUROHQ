import type { LearningState } from "@/app/actions/learning-state";
import type { EnergyRingMode } from "@/components/hud-test/EnergyRing";

export type GrowthCommandMetrics = {
  ringProgress: number;
  ringValue: string;
  ringLabel: string;
  ringMode: EnergyRingMode;
  /** Single-line status for the command header (Dutch). */
  statusLine: string;
};

/**
 * Weekly session pace vs target drives the header ring (same 0–100 semantics as other hub rings).
 */
export function computeGrowthCommandMetrics(learning: LearningState): GrowthCommandMetrics {
  const { sessionsThisWeek, weeklyTargetSessions } = learning.consistency;
  const target = Math.max(1, weeklyTargetSessions);
  const pacePct = Math.min(100, Math.round((sessionsThisWeek / target) * 100));
  const deltaPct = Math.round((sessionsThisWeek / target - 1) * 100);

  let ringMode: EnergyRingMode = "default";
  if (pacePct >= 100) ringMode = "green-peak";
  else if (pacePct >= 70) ringMode = "green";
  else if (pacePct >= 40) ringMode = "alert";
  else ringMode = "high-alert";

  let tempo: string;
  if (pacePct >= 100) tempo = "op tempo";
  else if (pacePct >= 70) tempo = "bijna op tempo";
  else if (pacePct >= 40) tempo = "onder tempo";
  else tempo = "achter op schema";

  const deltaStr = deltaPct > 0 ? `+${deltaPct}%` : deltaPct < 0 ? `${deltaPct}%` : "0%";
  const statusLine = `${deltaStr} vs. weekdoel — ${tempo}`;

  return {
    ringProgress: pacePct,
    ringValue: `${pacePct}%`,
    ringLabel: "Week",
    ringMode,
    statusLine,
  };
}
