"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Archetype, EvolutionPhase, ReputationScore } from "@/lib/identity-engine";
import { computeReputation } from "@/lib/identity-engine";

export interface IdentityEngineState {
  archetype: Archetype;
  evolutionPhase: EvolutionPhase;
  reputation: ReputationScore;
  activeCampaignId: string | null;
}

const defaultIdentityEngineState: IdentityEngineState = {
  archetype: "operator",
  evolutionPhase: "initiate",
  reputation: { discipline: 0, consistency: 0, impact: 0 },
  activeCampaignId: null,
};

/** Get full identity engine state (archetype, phase, reputation). */
export async function getIdentityEngine(): Promise<IdentityEngineState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return defaultIdentityEngineState;

  try {
  const [identityRow, reputationRow, streakRow] = await Promise.all([
    supabase.from("user_identity_engine").select("archetype, evolution_phase, active_campaign_id").eq("user_id", user.id).single(),
    supabase.from("user_reputation").select("discipline, consistency, impact, updated_at").eq("user_id", user.id).single(),
    supabase.from("user_streak").select("current_streak, longest_streak").eq("user_id", user.id).single(),
  ]);

  const archetype = (identityRow?.data?.archetype as Archetype) ?? "operator";
  const evolutionPhase = (identityRow?.data?.evolution_phase as EvolutionPhase) ?? "initiate";
  const activeCampaignId = identityRow?.data?.active_campaign_id as string | null ?? null;

  const today = new Date().toISOString().slice(0, 10);
  const repRow = reputationRow.data as { discipline?: number; consistency?: number; impact?: number; updated_at?: string } | null;
  const repUpdatedToday = repRow?.updated_at != null && repRow.updated_at.slice(0, 10) === today;
  const hasNonZeroReputation = repRow && ((repRow.discipline ?? 0) > 0 || (repRow.consistency ?? 0) > 0 || (repRow.impact ?? 0) > 0);

  let reputation: ReputationScore;
  if (repRow && repUpdatedToday && hasNonZeroReputation) {
    reputation = {
      discipline: repRow.discipline ?? 0,
      consistency: repRow.consistency ?? 0,
      impact: repRow.impact ?? 0,
    };
  } else {
    reputation = await computeAndUpsertReputation(supabase, user.id, streakRow.data);
  }

  return {
    archetype,
    evolutionPhase,
    reputation,
    activeCampaignId,
  };
  } catch {
    return defaultIdentityEngineState;
  }
}

async function computeAndUpsertReputation(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  streakData: { current_streak?: number; longest_streak?: number } | null
) {
  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { data: behaviourData } = await supabase
    .from("behaviour_log")
    .select("date, mission_completed_at, difficulty_level, xp_gained")
    .eq("user_id", userId)
    .gte("date", thirtyDaysAgo)
    .lte("date", today);

  const logs = (behaviourData ?? []) as { date: string; mission_completed_at: string | null; difficulty_level?: number; xp_gained?: number }[];
  const activeDaysLast30 = new Set(logs.filter((l) => l.mission_completed_at != null).map((l) => l.date)).size;
  const completionsLast30 = logs.filter((l) => l.mission_completed_at != null).length;
  const highDifficultyCompletionsLast30 = logs.filter(
    (l) => l.mission_completed_at != null && (Number(l.difficulty_level) >= 0.7 || (l.xp_gained ?? 0) >= 80)
  ).length;

  const currentStreak = (streakData?.current_streak as number) ?? 0;
  const longestStreak = (streakData?.longest_streak as number) ?? 0;

  const reputation = computeReputation({
    currentStreak,
    longestStreak,
    activeDaysLast30,
    completionsLast30,
    highDifficultyCompletionsLast30,
    totalCompletionsLast30: completionsLast30,
  });

  await supabase.from("user_reputation").upsert(
    {
      user_id: userId,
      discipline: reputation.discipline,
      consistency: reputation.consistency,
      impact: reputation.impact,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  return reputation;
}

/** Update user archetype. */
export async function updateArchetype(archetype: Archetype): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { error } = await supabase
    .from("user_identity_engine")
    .upsert(
      { user_id: user.id, archetype, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
  if (!error) revalidatePath("/dashboard");
  return !error;
}

/** Update evolution phase (e.g. when criteria met). */
export async function updateEvolutionPhase(phase: EvolutionPhase): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { error } = await supabase
    .from("user_identity_engine")
    .upsert(
      { user_id: user.id, evolution_phase: phase, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
  if (!error) revalidatePath("/dashboard");
  return !error;
}

/** Ensure identity_engine and reputation rows exist for user (call on first load). Pass userId when already available to avoid extra getUser(). */
export async function ensureIdentityEngineRows(userId?: string | null): Promise<void> {
  try {
    let uid = userId;
    if (uid == null) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      uid = user.id;
    }
    const supabase = await createClient();
    await supabase.from("user_identity_engine").upsert(
      { user_id: uid, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
    await supabase.from("user_reputation").upsert(
      { user_id: uid, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
  } catch {
    // Tables may not exist yet (migration 027 not run)
  }
}
