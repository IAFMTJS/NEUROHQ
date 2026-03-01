"use server";

import { createClient } from "@/lib/supabase/server";
import {
  computeIdentityIndices,
  deriveIdentityType,
  getModifiersForType,
  type IdentityDriftType,
  type IdentityScore,
  type IdentityDriftModifiers,
} from "@/lib/identity-drift";

const PERIOD_DAYS = 30;

export interface IdentityDriftState {
  type: IdentityDriftType;
  score: IdentityScore;
  modifiers: IdentityDriftModifiers;
  periodEnd: string;
}

/** Get or compute identity drift for user; returns type + modifiers. */
export async function getIdentityDrift(): Promise<IdentityDriftState | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const today = new Date().toISOString().slice(0, 10);
  const periodStart = new Date(Date.now() - PERIOD_DAYS * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { data: snapshot } = await supabase
    .from("identity_drift_snapshot")
    .select("period_end, discipline_index, volatility_index, avoidance_index, recovery_dependency_index, social_intensity_index, derived_type")
    .eq("user_id", user.id)
    .lte("period_end", today)
    .order("period_end", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (snapshot) {
    const score: IdentityScore = {
      disciplineIndex: (snapshot as { discipline_index: number }).discipline_index,
      volatilityIndex: (snapshot as { volatility_index: number }).volatility_index,
      avoidanceIndex: (snapshot as { avoidance_index: number }).avoidance_index,
      recoveryDependencyIndex: (snapshot as { recovery_dependency_index: number }).recovery_dependency_index,
      socialIntensityIndex: (snapshot as { social_intensity_index: number }).social_intensity_index,
    };
    const type = (snapshot as { derived_type: string }).derived_type as IdentityDriftType;
    return {
      type,
      score,
      modifiers: getModifiersForType(type),
      periodEnd: (snapshot as { period_end: string }).period_end,
    };
  }

  const state = await computeAndUpsertIdentityDrift(supabase, user.id, periodStart, today);
  return state;
}

export async function computeAndUpsertIdentityDrift(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  periodStart: string,
  periodEnd: string
): Promise<IdentityDriftState | null> {
  const { data: logs } = await supabase
    .from("behaviour_log")
    .select("date, mission_id, mission_completed_at, performance_rank, performance_score")
    .eq("user_id", userId)
    .gte("date", periodStart)
    .lte("date", periodEnd);

  const completed = (logs ?? []).filter((l: { mission_completed_at?: string | null }) => l.mission_completed_at != null);
  const started = (logs ?? []).filter((l: { mission_id?: string | null }) => l.mission_id != null);
  const completionRate = started.length > 0 ? completed.length / started.length : 0.5;
  const rankScores = completed
    .map((l: { performance_rank?: string | null }) => (l as { performance_rank: string }).performance_rank)
    .filter(Boolean);
  const rankNumeric = (r: string) => (r === "S" ? 4 : r === "A" ? 3 : r === "B" ? 2 : 1);
  const avgRankScore =
    rankScores.length > 0
      ? rankScores.reduce((a: number, r: string) => a + rankNumeric(r), 0) / rankScores.length
      : 2;
  const variance =
    rankScores.length > 1
      ? rankScores.reduce((s: number, r: string) => s + Math.pow(rankNumeric(r) - avgRankScore, 2), 0) / rankScores.length
      : 0;
  const rankVariance = Math.min(1, Math.sqrt(variance) / 2);

  const { data: taskEvents } = await supabase
    .from("task_events")
    .select("event_type")
    .eq("user_id", userId)
    .gte("occurred_at", periodStart + "T00:00:00Z")
    .lte("occurred_at", periodEnd + "T23:59:59Z");
  const abandons = (taskEvents ?? []).filter((e: { event_type: string }) => e.event_type === "abandon").length;
  const completes = (taskEvents ?? []).filter((e: { event_type: string }) => e.event_type === "complete").length;
  const totalStarts = abandons + completes;
  const cancelRatio = totalStarts > 0 ? abandons / totalStarts : 0;

  const missionIds = [...new Set(completed.map((l: { mission_id?: string | null }) => l.mission_id).filter((id): id is string => id != null))];
  let socialCount = 0;
  let recoveryCount = 0;
  if (missionIds.length > 0) {
    const ids = missionIds.slice(0, 50);
    const { data: missions } = await supabase
      .from("missions")
      .select("mission_intent, social_intensity")
      .in("id", ids);
    for (const m of missions ?? []) {
      const intent = (m as { mission_intent?: string | null }).mission_intent;
      const si = (m as { social_intensity?: number | null }).social_intensity ?? 0;
      if (intent === "recovery") recoveryCount++;
      if (si >= 5) socialCount++;
    }
  }
  const socialRatio = completed.length > 0 ? socialCount / completed.length : 0;
  const recoveryRatio = completed.length > 0 ? recoveryCount / completed.length : 0;
  const activeDays = new Set(completed.map((l: { date: string }) => (l as { date: string }).date)).size;
  const activeDaysRatio = Math.min(1, activeDays / PERIOD_DAYS);

  const score = computeIdentityIndices({
    completionRate,
    avgRankScore: avgRankScore / 4,
    cancelRatio,
    socialRatio,
    recoveryRatio,
    rankVariance,
    activeDaysRatio,
  });
  const type = deriveIdentityType(score);

  await supabase.from("identity_drift_snapshot").upsert(
    {
      user_id: userId,
      period_end: periodEnd,
      discipline_index: score.disciplineIndex,
      volatility_index: score.volatilityIndex,
      avoidance_index: score.avoidanceIndex,
      recovery_dependency_index: score.recoveryDependencyIndex,
      social_intensity_index: score.socialIntensityIndex,
      derived_type: type,
    },
    { onConflict: "user_id,period_end" }
  );

  return {
    type,
    score,
    modifiers: getModifiersForType(type),
    periodEnd,
  };
}
