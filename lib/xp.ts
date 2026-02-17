/** XP per level (cumulative). Level 1 = 0-99, Level 2 = 100-249, etc. */
const XP_PER_LEVEL = [0, 100, 250, 500, 850, 1300, 1900, 2650, 3600, 4800];

export function levelFromTotalXP(totalXP: number): number {
  for (let i = XP_PER_LEVEL.length - 1; i >= 0; i--) {
    if (totalXP >= XP_PER_LEVEL[i]) return i + 1;
  }
  return 1;
}

/** XP needed for the next level (from current total). */
export function xpToNextLevel(totalXP: number): number {
  const level = levelFromTotalXP(totalXP);
  if (level >= XP_PER_LEVEL.length) return 0;
  return XP_PER_LEVEL[level] - totalXP;
}

/** XP progress within current level (0–1). */
export function xpProgressInLevel(totalXP: number): number {
  const level = levelFromTotalXP(totalXP);
  if (level >= XP_PER_LEVEL.length) return 1;
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
  const end = level < XP_PER_LEVEL.length ? XP_PER_LEVEL[level] : start + 1000;
  return { current: totalXP - start, needed: end - start };
}
