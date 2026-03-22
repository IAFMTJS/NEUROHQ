/** Rij uit daily_state met velden voor brain composite (zelfde shape als brain-game-state). */
export type DailyRowForBrain = {
  energy?: number | null;
  focus?: number | null;
  sensory_load?: number | null;
  load?: number | null;
  mental_battery?: number | null;
  physical_health?: number | null;
  sleep_hours?: number | null;
};

function clamp110(n: number): number {
  if (!Number.isFinite(n)) return 5;
  return Math.max(1, Math.min(10, n));
}

/**
 * Single 0–100% score from today's brain check-in (1–10 scales).
 * Energy, focus, mental battery, physical health — equal weight.
 */
export function computeBrainStatusAveragePercent(daily: DailyRowForBrain): number | null {
  if (daily.energy == null || daily.focus == null) return null;
  const e = clamp110(Number(daily.energy));
  const f = clamp110(Number(daily.focus));
  const batt = daily.mental_battery != null ? clamp110(Number(daily.mental_battery)) : (e + f) / 2;
  const phys = daily.physical_health != null ? clamp110(Number(daily.physical_health)) : (e + f) / 2;
  const avg = (e + f + batt + phys) / 4;
  return Math.round((avg / 10) * 100);
}

/** Days in the window where brain composite ≥ 75% (war-tier), used for burnout / recovery guard. */
export function countWarTierDays(rows: DailyRowForBrain[]): number {
  let n = 0;
  for (const row of rows) {
    const p = computeBrainStatusAveragePercent(row);
    if (p != null && p > 75) n += 1;
  }
  return n;
}
