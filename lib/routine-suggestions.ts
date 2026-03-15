/**
 * Best-day suggestions for routine tasks (e.g. at least 1x per month).
 * Scores days by capacity and fit; returns top 2–3 dates for the current week.
 */

import type { DayPlannedLoad } from "@/app/actions/tasks";

const ENERGY_CAP = 10;
const MAX_SUGGESTIONS = 3;

/**
 * Score each day: lower load = better for adding a routine task.
 * Prefer days that are not overloaded and have room for one more task.
 */
export function suggestBestDaysForRoutine(
  weekLoad: DayPlannedLoad[],
  options?: { excludeOverload?: boolean; maxSuggestions?: number }
): string[] {
  const excludeOverload = options?.excludeOverload ?? true;
  const max = options?.maxSuggestions ?? MAX_SUGGESTIONS;

  const scored = weekLoad
    .filter((d) => !excludeOverload || !d.isOverload)
    .map((d) => ({
      date: d.date,
      score: Math.max(0, ENERGY_CAP - (d.totalEnergy ?? 0)) + (d.taskCount < 5 ? 2 : 0),
    }))
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, max).map((s) => s.date);
}
