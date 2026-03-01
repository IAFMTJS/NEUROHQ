/**
 * Dark Commander Intelligence Core - Game State Server Actions
 * CRUD operations for gameState
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { GameState, Mission } from "@/lib/dcic/types";

/**
 * Gets current gameState from database
 */
export async function getGameState(): Promise<GameState | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Get XP and level from existing user_xp table
  const { data: xpData } = await supabase
    .from("user_xp")
    .select("total_xp")
    .eq("user_id", user.id)
    .single();

  const totalXP = (xpData?.total_xp as number) ?? 0;
  const level = calculateLevelFromXP(totalXP);

  // Get missions from missions table
  const { data: missionsData } = await supabase
    .from("missions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const missions: Mission[] = (missionsData || []).map((m: Record<string, unknown>) => ({
    id: m.id as string,
    name: m.name as string,
    xpReward: (m.xp_reward as number) ?? 100,
    energyCost: (m.energy_cost as number) ?? 15,
    completed: (m.completed as boolean) ?? false,
    active: (m.active as boolean) ?? false,
    startedAt: m.started_at as string | null,
    completedAt: m.completed_at as string | null,
    difficultyLevel: parseFloat((m.difficulty_level as string) ?? "0.5") || 0.5,
    focusRequirement: (m.focus_requirement as number | null) ?? null,
    socialIntensity: (m.social_intensity as number | null) ?? null,
    missionType: m.mission_type as Mission["missionType"],
    category: m.category as Mission["category"],
    skillLink: m.skill_link as Mission["skillLink"],
    recurrenceType: m.recurrence_type as Mission["recurrenceType"],
    streakEligible: m.streak_eligible as boolean | undefined,
    missionIntent: (m.mission_intent as Mission["missionIntent"]) ?? "normal",
    expiresAt: m.expires_at as string | null ?? null,
  }));

  // Get streak from user_streak table
  const { data: streakData } = await supabase
    .from("user_streak")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const streak = {
    current: streakData?.current_streak ?? 0,
    longest: streakData?.longest_streak ?? 0,
    lastCompletionDate: streakData?.last_completion_date ?? null,
  };

  // Get achievements
  const { data: achievementsData } = await supabase
    .from("achievements")
    .select("achievement_key")
    .eq("user_id", user.id);

  const achievements: Record<string, boolean> = {};
  (achievementsData || []).forEach((a) => {
    achievements[a.achievement_key] = true;
  });

  // Get skills
  const { data: skillsData } = await supabase
    .from("user_skills")
    .select("skill_key")
    .eq("user_id", user.id);

  const skills: Record<string, boolean> = {};
  (skillsData || []).forEach((s) => {
    skills[s.skill_key] = true;
  });

  // Get daily state for stats
  const today = new Date().toISOString().split("T")[0];
  const { data: dailyState } = await supabase
    .from("daily_state")
    .select("energy, focus, sensory_load")
    .eq("user_id", user.id)
    .eq("date", today)
    .single();

  // Get finance state
  const { getFinanceState } = await import("./finance-state");
  const financeState = await getFinanceState();

  const gameState: GameState = {
    level,
    currentXP: totalXP,
    xpToNextLevel: calculateXPForLevel(level),
    stats: {
      energy: (dailyState?.energy as number) ?? 50,
      focus: (dailyState?.focus as number) ?? 50,
      load: (dailyState?.sensory_load as number) ?? 30,
    },
    missions,
    skills,
    streak,
    rank: calculateRank(level),
    achievements,
    finance: financeState || undefined,
  };

  return gameState;
}

/**
 * Saves gameState to database
 */
export async function saveGameState(gameState: GameState): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  try {
    // Update XP
    await supabase
      .from("user_xp")
      .upsert({
        user_id: user.id,
        total_xp: gameState.currentXP,
      })
      .eq("user_id", user.id);

    // Update missions
    for (const mission of gameState.missions) {
      await supabase
        .from("missions")
        .update({
          active: mission.active,
          completed: mission.completed,
          started_at: mission.startedAt,
          completed_at: mission.completedAt,
          updated_at: new Date().toISOString(),
        })
        .eq("id", mission.id);
    }

    // Update streak (handled by trigger, but ensure record exists)
    await supabase
      .from("user_streak")
      .upsert({
        user_id: user.id,
        current_streak: gameState.streak.current,
        longest_streak: gameState.streak.longest,
        last_completion_date: gameState.streak.lastCompletionDate,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    // Update daily state stats
    const today = new Date().toISOString().split("T")[0];
    await supabase.from("daily_state").upsert({
      user_id: user.id,
      date: today,
      energy: gameState.stats.energy,
      focus: gameState.stats.focus,
      sensory_load: gameState.stats.load,
    });

    revalidatePath("/dashboard");
    revalidatePath("/tasks");
    return true;
  } catch (error) {
    console.error("Error saving gameState:", error);
    return false;
  }
}

/**
 * Calculates level from total XP
 */
function calculateLevelFromXP(totalXP: number): number {
  let level = 1;
  let xpRequired = 1000;
  let xpAccumulated = totalXP;

  while (xpAccumulated >= xpRequired && level < 100) {
    xpAccumulated -= xpRequired;
    level++;
    xpRequired = calculateXPForLevel(level);
  }

  return level;
}

/**
 * Calculates XP required for a specific level
 */
function calculateXPForLevel(level: number): number {
  if (level <= 4) {
    return 1000;
  }
  return Math.floor(1000 * Math.pow(1.15, level - 4));
}

/**
 * Calculates rank based on level
 */
function calculateRank(level: number): string {
  if (level < 5) return "Recruit";
  if (level < 10) return "Operator";
  if (level < 15) return "Specialist";
  if (level < 20) return "Veteran";
  if (level < 25) return "Elite";
  if (level < 30) return "Master";
  return "Legend";
}
