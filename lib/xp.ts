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

/** Rank title by level (identity / dopamine hub). */
const RANKS_BY_LEVEL: Record<number, string> = {
  1: "Recruit",
  2: "Recruit",
  3: "Operator",
  4: "Operator",
  5: "Specialist",
  6: "Specialist",
  7: "Veteran",
  8: "Veteran",
  9: "Elite",
  10: "Master",
};

export function rankFromLevel(level: number): string {
  if (level >= 10) return "Legend";
  return RANKS_BY_LEVEL[level] ?? "Recruit";
}

/** Next unlock preview text for dashboard (e.g. "Level 3" or "Elite rank"). */
export function nextUnlockPreview(totalXP: number): { level: number; rank: string; xpNeeded: number } {
  const level = levelFromTotalXP(totalXP);
  const xpNeeded = xpToNextLevel(totalXP);
  const nextLevel = level >= XP_PER_LEVEL.length ? level : level + 1;
  return {
    level: nextLevel,
    rank: rankFromLevel(nextLevel),
    xpNeeded,
  };
}
