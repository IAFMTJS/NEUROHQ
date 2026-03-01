"use server";

import { createClient } from "@/lib/supabase/server";
import {
  getUnlockCriteriaForNextRank,
  getXpMultiplierForProgressionRank,
  getEnergyImpactMultiplier,
  getPenaltyVarianceMultiplier,
  nextRank,
  type ProgressionRank,
} from "@/lib/progression-rank";

export interface ProgressionRankState {
  rank: ProgressionRank;
  nextRank: ProgressionRank | null;
  criteria: {
    minTotalXp: number;
    minStreak: number;
    minCompletionRate7d: number;
    minWeeklyPerformanceIndex?: number;
  } | null;
  progress: { totalXp: number; streak: number; completionRate7d: number; performanceIndex: number };
  xpMultiplier: number;
  energyImpactMultiplier: number;
  penaltyVarianceMultiplier: number;
}

export async function getProgressionRankState(): Promise<ProgressionRankState | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: gamification } = await supabase
    .from("user_gamification")
    .select("progression_rank")
    .eq("user_id", user.id)
    .single();

  const rank = (gamification?.progression_rank as ProgressionRank) ?? "recruit";
  const nextR = nextRank(rank);
  const criteria = getUnlockCriteriaForNextRank(rank);

  const [xpRow, streakRow, weeklyRow] = await Promise.all([
    supabase.from("user_xp").select("total_xp").eq("user_id", user.id).single(),
    supabase.from("user_streak").select("current_streak").eq("user_id", user.id).single(),
    supabase
      .from("weekly_reports")
      .select("performance_index")
      .eq("user_id", user.id)
      .order("week_start", { ascending: false })
      .limit(1)
      .single(),
  ]);

  const totalXp = (xpRow.data as { total_xp?: number } | null)?.total_xp ?? 0;
  const streak = (streakRow.data as { current_streak?: number } | null)?.current_streak ?? 0;
  const performanceIndex = (weeklyRow.data as { performance_index?: number } | null)?.performance_index ?? 0;

  let completionRate7d = 0;
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const startStr = sevenDaysAgo.toISOString().slice(0, 10);
  const { data: events } = await supabase
    .from("task_events")
    .select("event_type")
    .eq("user_id", user.id)
    .in("event_type", ["start", "complete"])
    .gte("occurred_at", startStr);
  let started = 0;
  let completed = 0;
  for (const row of events ?? []) {
    const t = (row as { event_type: string }).event_type;
    if (t === "start") started++;
    if (t === "complete") completed++;
  }
  if (started > 0) completionRate7d = completed / started;

  return {
    rank,
    nextRank: nextR,
    criteria: criteria ?? null,
    progress: { totalXp, streak, completionRate7d, performanceIndex },
    xpMultiplier: getXpMultiplierForProgressionRank(rank),
    energyImpactMultiplier: getEnergyImpactMultiplier(rank),
    penaltyVarianceMultiplier: getPenaltyVarianceMultiplier(rank),
  };
}

/** Evaluate and optionally promote user to next progression rank. Call after weekly snapshot. */
export async function evaluateProgressionRankUp(): Promise<{ promoted: boolean; newRank?: ProgressionRank }> {
  const state = await getProgressionRankState();
  if (!state || !state.nextRank || !state.criteria) return { promoted: false };

  const { criteria, progress } = state;
  const meetsXp = progress.totalXp >= criteria.minTotalXp;
  const meetsStreak = progress.streak >= criteria.minStreak;
  const meetsCompletion = progress.completionRate7d >= criteria.minCompletionRate7d;
  const meetsIndex =
    criteria.minWeeklyPerformanceIndex == null ||
    progress.performanceIndex >= criteria.minWeeklyPerformanceIndex;

  if (!meetsXp || !meetsStreak || !meetsCompletion || !meetsIndex) return { promoted: false };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { promoted: false };

  const { error } = await supabase
    .from("user_gamification")
    .update({
      progression_rank: state.nextRank,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) return { promoted: false };
  return { promoted: true, newRank: state.nextRank };
}
