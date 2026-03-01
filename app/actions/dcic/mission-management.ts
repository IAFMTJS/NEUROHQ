/**
 * Dark Commander Intelligence Core - Mission Management
 * CRUD operations for missions
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Mission } from "@/lib/dcic/types";

/**
 * Creates a new mission from a task
 */
export async function createMissionFromTask(
  taskId: string,
  xpReward?: number,
  energyCost?: number
): Promise<{ success: boolean; missionId?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get task
  const { data: task } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .eq("user_id", user.id)
    .single();

  if (!task) {
    return { success: false, error: "Task not found" };
  }

  // Calculate XP reward based on task properties
  const calculatedXP = xpReward || calculateXPReward(task);
  const calculatedEnergy = energyCost || calculateEnergyCost(task);
  let difficulty = calculateDifficulty(task);
  try {
    const { getAdaptiveModifiersForUser } = await import("@/app/actions/weekly-performance");
    const mod = await getAdaptiveModifiersForUser();
    difficulty = Math.max(0.1, Math.min(1, difficulty * mod.difficultyMultiplier));
  } catch {
    // non-critical
  }

  const focusReq = task.focus_required ?? null;
  const socialInt = task.social_load ?? null;

  const { data: mission, error } = await supabase
    .from("missions")
    .insert({
      user_id: user.id,
      name: task.title,
      xp_reward: calculatedXP,
      energy_cost: calculatedEnergy,
      difficulty_level: difficulty,
      focus_requirement: focusReq,
      social_intensity: socialInt,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/tasks");
  return { success: true, missionId: mission.id };
}

/**
 * Creates a new mission directly
 */
export async function createMission(params: {
  name: string;
  xpReward?: number;
  energyCost?: number;
  difficultyLevel?: number;
  focusRequirement?: number | null;
  socialIntensity?: number | null;
}): Promise<{ success: boolean; missionId?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: mission, error } = await supabase
    .from("missions")
    .insert({
      user_id: user.id,
      name: params.name,
      xp_reward: params.xpReward || 100,
      energy_cost: params.energyCost || 15,
      difficulty_level: params.difficultyLevel || 0.5,
      focus_requirement: params.focusRequirement ?? null,
      social_intensity: params.socialIntensity ?? null,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/tasks");
  return { success: true, missionId: mission.id };
}

/**
 * Gets all missions for user
 */
export async function getMissions(): Promise<Mission[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("missions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (!data) return [];

  return data.map((m) => ({
    id: m.id,
    name: m.name,
    xpReward: m.xp_reward,
    energyCost: m.energy_cost,
    completed: m.completed ?? false,
    active: m.active ?? false,
    startedAt: m.started_at,
    completedAt: m.completed_at,
    difficultyLevel: Number(m.difficulty_level) || 0.5,
    focusRequirement: (m as { focus_requirement?: number | null }).focus_requirement ?? null,
    socialIntensity: (m as { social_intensity?: number | null }).social_intensity ?? null,
  }));
}

/**
 * Gets active mission for user
 */
export async function getActiveMission(): Promise<Mission | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: missionState } = await supabase
    .from("mission_state")
    .select("active_mission_id")
    .eq("user_id", user.id)
    .single();

  if (!missionState?.active_mission_id) return null;

  const { data: mission } = await supabase
    .from("missions")
    .select("*")
    .eq("id", missionState.active_mission_id)
    .single();

  if (!mission) return null;

  return {
    id: mission.id,
    name: mission.name,
    xpReward: mission.xp_reward,
    energyCost: mission.energy_cost,
    completed: mission.completed ?? false,
    active: mission.active ?? false,
    startedAt: mission.started_at,
    completedAt: mission.completed_at,
    difficultyLevel: Number(mission.difficulty_level) || 0.5,
    focusRequirement: (mission as { focus_requirement?: number | null }).focus_requirement ?? null,
    socialIntensity: (mission as { social_intensity?: number | null }).social_intensity ?? null,
  };
}

/**
 * Calculates XP reward based on task properties
 */
function calculateXPReward(task: any): number {
  let baseXP = 100;

  // Add XP based on priority
  if (task.priority) {
    baseXP += task.priority * 20;
  }

  // Add XP based on energy required (higher energy = more XP)
  if (task.energy_required) {
    baseXP += task.energy_required * 10;
  }

  return baseXP;
}

/**
 * Calculates energy cost based on task properties
 */
function calculateEnergyCost(task: any): number {
  // Use task.energy_required if available, otherwise default
  if (task.energy_required) {
    return task.energy_required * 10; // Convert 1-10 scale to 10-100
  }
  return 15; // Default
}

/**
 * Calculates difficulty level based on task properties
 */
function calculateDifficulty(task: any): number {
  let difficulty = 0.5; // Base difficulty

  // Higher priority = higher difficulty
  if (task.priority) {
    difficulty += (task.priority / 5) * 0.3;
  }

  // Higher energy required = higher difficulty
  if (task.energy_required) {
    difficulty += (task.energy_required / 10) * 0.2;
  }

  // Clamp between 0.1 and 1.0
  return Math.max(0.1, Math.min(1.0, difficulty));
}
