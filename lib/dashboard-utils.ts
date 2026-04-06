/** Shared helpers for dashboard (API + server page). */

/** Subset van EnergyRing-mode waarden voor brain stats (geen client-import: dashboard-utils wordt ook server-side geladen). */
export type BrainStatusStatRingMode = "default" | "high-alert" | "green" | "green-peak";

/** Ringkleuren voor energy/focus/load: zelfde bands als Brain Status-kaart, modal en check-in feedback. */
export function brainStatusRingModeFromPct(value: number): BrainStatusStatRingMode {
  if (value <= 20) return "high-alert";
  if (value >= 90) return "green-peak";
  if (value >= 70) return "green";
  return "default";
}

export function scale1To10ToPct(value: number | null): number {
  if (value == null) return 50;
  return Math.round((value / 10) * 100);
}

/** True after the user has saved a brain check-in with energy + focus (1–10). */
export function hasCommittedBrainCheckIn(
  daily: { energy?: number | null; focus?: number | null } | null | undefined
): boolean {
  return daily != null && daily.energy != null && daily.focus != null;
}

/** Energy / focus / load ring percentages: neutral 50% until a check-in is committed. */
export function brainCirclePcts(
  daily: { energy?: number | null; focus?: number | null; sensory_load?: number | null } | null | undefined
): { energyPct: number; focusPct: number; loadPct: number } {
  if (!hasCommittedBrainCheckIn(daily)) {
    return { energyPct: 50, focusPct: 50, loadPct: 50 };
  }
  return {
    energyPct: scale1To10ToPct(daily?.energy ?? null),
    focusPct: scale1To10ToPct(daily?.focus ?? null),
    loadPct: scale1To10ToPct(daily?.sensory_load ?? null),
  };
}

export function defaultTimeWindow(): { window: string; isActive: boolean } {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const mins = h * 60 + m;
  if (h < 12) {
    const start = 9 * 60;
    const end = 11 * 60 + 30;
    return { window: "09:00–11:30", isActive: mins >= start && mins <= end };
  }
  if (h < 17) {
    const start = 14 * 60;
    const end = 16 * 60 + 30;
    return { window: "14:00–16:30", isActive: mins >= start && mins <= end };
  }
  const start = 17 * 60 + 45;
  const end = 19 * 60 + 15;
  return { window: "17:45–19:15", isActive: mins >= start && mins <= end };
}

export function defaultInsight(energy: number, focus: number, load: number): string {
  const hour = new Date().getHours();
  if (load >= 70 && energy < 50)
    return "High load with lower energy. Single priority task recommended.";
  if (focus >= 70) return "Focus peak. Schedule deep work or complex tasks now.";
  if (energy >= 70 && focus < 40)
    return "Energy up, focus lower. Optimal for admin or lighter tasks.";
  if (hour >= 16) return "Focus tends to decrease after 16:00. Schedule lighter tasks.";
  return "Stable baseline. Schedule your most important mission in the next 2 hours.";
}

export function defaultSuggestion(
  energy: number,
  focus: number,
  load: number
): string | null {
  if (load >= 70 && energy < 50)
    return "Pick one task. Reschedule the rest to reduce overwhelm.";
  if (focus >= 70) return "Use Focus block on Missions to lock in. 25 min is ideal.";
  if (energy >= 70 && focus < 40)
    return "Batch emails, admin, or routine items now.";
  if (new Date().getHours() >= 16)
    return "Wind-down tasks: light admin, reading, or planning tomorrow.";
  return "Check your first incomplete mission and start there.";
}
