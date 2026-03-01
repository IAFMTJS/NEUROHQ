/**
 * Dark Commander Intelligence Core - Behaviour Log Server Actions
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import type { BehaviourLogEntry } from "@/lib/dcic/types";

/**
 * Logs a behaviour entry
 */
export async function logBehaviourEntry(entry: BehaviourLogEntry & { missionId?: string }): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  try {
    await supabase.from("behaviour_log").insert({
      user_id: user.id,
      date: entry.date,
      mission_id: entry.missionId || null,
      mission_started_at: entry.missionStartedAt,
      mission_completed_at: entry.missionCompletedAt,
      energy_before: entry.energyBefore,
      energy_after: entry.energyAfter,
      resisted_before_start: entry.resistedBeforeStart,
      difficulty_level: entry.difficultyLevel,
      xp_gained: entry.xpGained || null,
      performance_score: entry.performanceScore ?? null,
      performance_rank: entry.performanceRank ?? null,
      mission_intent: (entry as { missionIntent?: string | null }).missionIntent ?? null,
    });

    return true;
  } catch (error) {
    console.error("Error logging behaviour entry:", error);
    return false;
  }
}

/**
 * Gets behaviour log entries for a date range
 */
export async function getBehaviourLog(
  startDate: string,
  endDate: string
): Promise<BehaviourLogEntry[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("behaviour_log")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: false });

  if (!data) return [];

  const validRanks = ["S", "A", "B", "C"] as const;
  type Rank = (typeof validRanks)[number];

  return data.map((entry) => {
    const rawRank = (entry as { performance_rank?: string | null }).performance_rank;
    const performanceRank: Rank | undefined =
      rawRank && validRanks.includes(rawRank as Rank) ? (rawRank as Rank) : undefined;
    return {
      date: entry.date,
      missionStartedAt: entry.mission_started_at,
      missionCompletedAt: entry.mission_completed_at,
      energyBefore: entry.energy_before || 0,
      energyAfter: entry.energy_after || 0,
      resistedBeforeStart: entry.resisted_before_start || false,
      difficultyLevel: entry.difficulty_level || 0.5,
      xpGained: entry.xp_gained ?? undefined,
      performanceScore: (entry as { performance_score?: number | null }).performance_score ?? undefined,
      performanceRank: performanceRank ?? undefined,
    };
  });
}
