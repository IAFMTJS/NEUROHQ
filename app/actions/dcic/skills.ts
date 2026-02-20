/**
 * Dark Commander Intelligence Core - Skills System
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

import type { SkillKey } from "@/lib/dcic/skill-utils";

const SKILL_KEYS: SkillKey[] = [
  "focus1",
  "focus2",
  "deepFocus",
  "energyManagement",
  "streakMaster",
  "missionMaster",
];

/**
 * Unlocks a skill for user
 */
export async function unlockSkill(skillKey: SkillKey): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  // Check if already unlocked
  const { data: existing } = await supabase
    .from("user_skills")
    .select("skill_key")
    .eq("user_id", user.id)
    .eq("skill_key", skillKey)
    .single();

  if (existing) return true; // Already unlocked

  // Unlock skill
  const { error } = await supabase.from("user_skills").insert({
    user_id: user.id,
    skill_key: skillKey,
  });

  if (error) {
    console.error("Error unlocking skill:", error);
    return false;
  }

  revalidatePath("/dashboard");
  return true;
}

/**
 * Gets all unlocked skills for user
 */
export async function getSkills(): Promise<Record<string, boolean>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return {};

  const { data } = await supabase
    .from("user_skills")
    .select("skill_key")
    .eq("user_id", user.id);

  const skills: Record<string, boolean> = {};
  (data || []).forEach((s) => {
    skills[s.skill_key] = true;
  });

  return skills;
}

/**
 * Checks and unlocks skills based on game state
 */
export async function checkAndUnlockSkills(params: {
  level: number;
  streak: number;
  missionsCompleted: number;
}): Promise<string[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const unlocked: string[] = [];

  // Get existing skills
  const { data: existing } = await supabase
    .from("user_skills")
    .select("skill_key")
    .eq("user_id", user.id);

  const existingKeys = new Set(existing?.map((s) => s.skill_key) || []);

  // Check each skill
  const checks: Array<{ key: SkillKey; condition: boolean }> = [
    { key: "focus1", condition: params.level >= 3 },
    { key: "focus2", condition: params.level >= 5 },
    { key: "deepFocus", condition: params.level >= 10 },
    { key: "energyManagement", condition: params.missionsCompleted >= 10 },
    { key: "streakMaster", condition: params.streak >= 7 },
    { key: "missionMaster", condition: params.missionsCompleted >= 50 },
  ];

  for (const check of checks) {
    if (check.condition && !existingKeys.has(check.key)) {
      await unlockSkill(check.key);
      unlocked.push(check.key);
    }
  }

  return unlocked;
}

// Skill display name utility moved to lib/dcic/skill-utils.ts
