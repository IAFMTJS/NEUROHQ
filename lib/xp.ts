/** XP per level (cumulative). Level 1 = 0-99, Level 2 = 100-249, etc. */
const XP_PER_LEVEL = [0, 100, 250, 500, 850, 1300, 1900, 2650, 3600, 4800];

export function levelFromTotalXP(totalXP: number): number {
  for (let i = XP_PER_LEVEL.length - 1; i >= 0; i--) {
    if (totalXP >= XP_PER_LEVEL[i]) return i + 1;
  }
  return 1;
}
