import { rankFromLevel } from "./rank-ladder";

/** XP thresholds (cumulative) for levels 1–100. Level 1 = 0–99, Level 2 = 100–249, … Level 10 = 3600–4799, then scaling to 100. */
function buildXPPerLevel(): number[] {
  const arr: number[] = [0, 100, 250, 500, 850, 1300, 1900, 2650, 3600, 4800];
  let prev = 4800;
  let increment = 1200;
  for (let l = 10; l < 100; l++) {
    prev += increment;
    arr.push(prev);
    increment = Math.min(6000, Math.round(increment * 1.04));
  }
  return arr;
}

const XP_PER_LEVEL = buildXPPerLevel();
const MAX_LEVEL = XP_PER_LEVEL.length;

export function levelFromTotalXP(totalXP: number): number {
  for (let i = XP_PER_LEVEL.length - 1; i >= 0; i--) {
    if (totalXP >= XP_PER_LEVEL[i]) return i + 1;
  }
  return 1;
}

/** XP needed for the next level (from current total). 0 if at max level. */
export function xpToNextLevel(totalXP: number): number {
  const level = levelFromTotalXP(totalXP);
  if (level >= MAX_LEVEL) return 0;
  return XP_PER_LEVEL[level] - totalXP;
}

/** XP progress within current level (0–1). */
export function xpProgressInLevel(totalXP: number): number {
  const level = levelFromTotalXP(totalXP);
  if (level >= MAX_LEVEL) return 1;
  const start = XP_PER_LEVEL[level - 1] ?? 0;
  const end = XP_PER_LEVEL[level];
  const range = end - start;
  const current = totalXP - start;
  return range <= 0 ? 1 : Math.min(1, current / range);
}

/** Total XP required to reach next level (range for progress bar). */
export function xpRangeForNextLevel(totalXP: number): { current: number; needed: number } {
  const level = levelFromTotalXP(totalXP);
  const start = XP_PER_LEVEL[level - 1] ?? 0;
  const end = level < MAX_LEVEL ? XP_PER_LEVEL[level] : start + 1000;
  return { current: totalXP - start, needed: end - start };
}

export { MAX_LEVEL };

/** Rank title by level (1–100 ladder). Re-exported from rank-ladder. */
export { rankFromLevel } from "./rank-ladder";

/** Next unlock preview text for dashboard (e.g. "Level 3" or "Elite rank"). */
export function nextUnlockPreview(totalXP: number): { level: number; rank: string; xpNeeded: number } {
  const level = levelFromTotalXP(totalXP);
  const xpNeeded = xpToNextLevel(totalXP);
  const nextLevel = level >= MAX_LEVEL ? level : level + 1;
  return {
    level: nextLevel,
    rank: rankFromLevel(nextLevel),
    xpNeeded,
  };
}
