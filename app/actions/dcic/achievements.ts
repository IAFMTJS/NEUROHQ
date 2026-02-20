/**
 * Dark Commander Intelligence Core - Achievements System
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

import type { AchievementKey } from "@/lib/dcic/achievement-utils";

const ACHIEVEMENT_KEYS: AchievementKey[] = [
  "firstMission",
  "streak7",
  "streak30",
  "level10",
  "level25",
  "level50",
  "missions100",
  "perfectWeek",
];

/**
 * Checks and unlocks achievements based on game state
 */
export async function checkAndUnlockAchievements(params: {
  level: number;
  streak: number;
  missionsCompleted: number;
  perfectWeek?: boolean;
}): Promise<string[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const unlocked: string[] = [];

  // Get existing achievements
  const { data: existing } = await supabase
    .from("achievements")
    .select("achievement_key")
    .eq("user_id", user.id);

  const existingKeys = new Set(existing?.map((a) => a.achievement_key) || []);

  // Check each achievement
  const checks: Array<{ key: AchievementKey; condition: boolean }> = [
    { key: "firstMission", condition: params.missionsCompleted >= 1 },
    { key: "streak7", condition: params.streak >= 7 },
    { key: "streak30", condition: params.streak >= 30 },
    { key: "level10", condition: params.level >= 10 },
    { key: "level25", condition: params.level >= 25 },
    { key: "level50", condition: params.level >= 50 },
    { key: "missions100", condition: params.missionsCompleted >= 100 },
    { key: "perfectWeek", condition: params.perfectWeek === true },
  ];

  for (const check of checks) {
    if (check.condition && !existingKeys.has(check.key)) {
      // Unlock achievement
      await supabase.from("achievements").insert({
        user_id: user.id,
        achievement_key: check.key,
      });
      unlocked.push(check.key);
    }
  }

  if (unlocked.length > 0) {
    revalidatePath("/dashboard");
  }

  return unlocked;
}

/**
 * Gets all unlocked achievements for user
 */
export async function getAchievements(): Promise<Record<string, boolean>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return {};

  const { data } = await supabase
    .from("achievements")
    .select("achievement_key")
    .eq("user_id", user.id);

  const achievements: Record<string, boolean> = {};
  (data || []).forEach((a) => {
    achievements[a.achievement_key] = true;
  });

  return achievements;
}

// Achievement display name utility moved to lib/dcic/achievement-utils.ts
