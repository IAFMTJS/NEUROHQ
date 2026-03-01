/**
 * Dark Commander Intelligence Core - Skill Utilities
 * Pure utility functions (not server actions)
 */

export type SkillKey =
  | "focus1"
  | "focus2"
  | "deepFocus"
  | "energyManagement"
  | "streakMaster"
  | "missionMaster";

/**
 * Gets skill display name
 */
export function getSkillName(key: SkillKey): string {
  const names: Record<SkillKey, string> = {
    focus1: "Focus I",
    focus2: "Focus II",
    deepFocus: "Deep Focus",
    energyManagement: "Energy Management",
    streakMaster: "Streak Master",
    missionMaster: "Mission Master",
  };
  return names[key] || key;
}
