/**
 * Dark Commander Intelligence Core - Achievement Utilities
 * Pure utility functions (not server actions)
 */

export type AchievementKey =
  | "firstMission"
  | "streak7"
  | "streak30"
  | "level10"
  | "level25"
  | "level50"
  | "missions100"
  | "perfectWeek";

/**
 * Gets achievement display name
 */
export function getAchievementName(key: AchievementKey): string {
  const names: Record<AchievementKey, string> = {
    firstMission: "First Mission",
    streak7: "7 Day Streak",
    streak30: "30 Day Streak",
    level10: "Level 10",
    level25: "Level 25",
    level50: "Level 50",
    missions100: "100 Missions",
    perfectWeek: "Perfect Week",
  };
  return names[key] || key;
}
