"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { todayDateString } from "@/lib/utils/timezone";
import { levelFromTotalXP, xpToNextLevel, rankFromLevel, nextUnlockPreview } from "@/lib/xp";
import {
  getBrainState,
  getBrainStateMultiplier,
  getEffectiveBehavioralStats,
  normalizeBehavioralStats,
  resolveMentalLoad1To10,
} from "@/lib/behavioral-engine";

/** Default base XP when task has no base_xp (normaal niveau). */
const XP_TASK_COMPLETE = 50;
const XP_BRAIN_STATUS = 5;
const XP_LEARNING_SESSION = 8;
const XP_WEEKLY_LEARNING_TARGET = 25;
const XP_STREAK_DAY = 5;

async function getXPByUserId(userId: string): Promise<{ total_xp: number; level: number }> {
  const admin = createServiceRoleClient();
  if (admin) {
    const { data } = await admin.from("user_xp").select("total_xp").eq("user_id", userId).maybeSingle();
    const total = (data?.total_xp as number | undefined) ?? 0;
    return { total_xp: total, level: levelFromTotalXP(total) };
  }
  const supabase = await createClient();
  const { data } = await supabase.from("user_xp").select("total_xp").eq("user_id", userId).maybeSingle();
  const total = (data?.total_xp as number | undefined) ?? 0;
  return { total_xp: total, level: levelFromTotalXP(total) };
}

export async function getXP(userId?: string): Promise<{ total_xp: number; level: number }> {
  if (userId) return getXPByUserId(userId);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { total_xp: 0, level: 1 };
  return getXPByUserId(user.id);
}

/** Extended identity for dashboard: level, rank, streak, xp to next level, next unlock preview. */
async function getXPIdentityByUserId(userId: string): Promise<{
  total_xp: number;
  level: number;
  rank: string;
  xp_to_next_level: number;
  next_unlock: { level: number; rank: string; xpNeeded: number };
  streak: { current: number; longest: number; last_completion_date: string | null };
}> {
  const defaultStreak = { current: 0, longest: 0, last_completion_date: null as string | null };
  const admin = createServiceRoleClient();
  const client = admin ?? (await createClient());

  const [xpRes, streakRes] = await Promise.all([
    client.from("user_xp").select("total_xp").eq("user_id", userId).maybeSingle(),
    client
      .from("user_streak")
      .select("current_streak, longest_streak, last_completion_date")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);
  const total = (xpRes.data?.total_xp as number | undefined) ?? 0;
  const level = levelFromTotalXP(total);
  const streakData = streakRes.data as { current_streak?: number; longest_streak?: number; last_completion_date?: string | null } | null;
  return {
    total_xp: total,
    level,
    rank: rankFromLevel(level),
    xp_to_next_level: xpToNextLevel(total),
    next_unlock: nextUnlockPreview(total),
    streak: {
      current: streakData?.current_streak ?? 0,
      longest: streakData?.longest_streak ?? 0,
      last_completion_date: streakData?.last_completion_date ?? null,
    },
  };
}

export async function getXPIdentity(userId?: string): Promise<{
  total_xp: number;
  level: number;
  rank: string;
  xp_to_next_level: number;
  next_unlock: { level: number; rank: string; xpNeeded: number };
  streak: { current: number; longest: number; last_completion_date: string | null };
}> {
  if (userId) return getXPIdentityByUserId(userId);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const defaultStreak = { current: 0, longest: 0, last_completion_date: null as string | null };
  if (!user) {
    return {
      total_xp: 0,
      level: 1,
      rank: rankFromLevel(1),
      xp_to_next_level: 100,
      next_unlock: nextUnlockPreview(0),
      streak: defaultStreak,
    };
  }
  return getXPIdentityByUserId(user.id);
}

export type AddXPResult =
  | { levelUp: boolean; newLevel: number; pointsApplied: number }
  | undefined;

export async function addXP(
  points: number,
  options?: { source_type?: string; task_id?: string | null; skipRevalidate?: boolean }
): Promise<AddXPResult> {
  if (points <= 0) return undefined;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return undefined;

  const today = todayDateString();
  const { data: odRow } = await supabase
    .from("daily_state")
    .select("dcic_mode, dcic_locked_until, dcic_overdrive_session_start")
    .eq("user_id", user.id)
    .eq("date", today)
    .maybeSingle();
  let overdriveFactor = 1;
  if (
    odRow &&
    odRow.dcic_mode === "overdrive" &&
    (!odRow.dcic_locked_until || Date.parse(odRow.dcic_locked_until) > Date.now())
  ) {
    const { getOverdriveHeatEfficiency } = await import("@/lib/dcic/mode-engine");
    const heat = getOverdriveHeatEfficiency(
      odRow.dcic_overdrive_session_start ?? null,
      Date.now()
    );
    overdriveFactor = 2 * heat;
  }
  const adjustedPoints = Math.max(1, Math.floor(points * overdriveFactor));

  const { data: existing } = await supabase
    .from("user_xp")
    .select("total_xp")
    .eq("user_id", user.id)
    .single();
  const current = (existing?.total_xp as number | undefined) ?? 0;
  const levelBefore = levelFromTotalXP(current);
  const newTotal = current + adjustedPoints;
  const { error } = await supabase
    .from("user_xp")
    .upsert(
      {
        user_id: user.id,
        total_xp: newTotal,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
  if (error) return undefined;
  if (options?.source_type) {
    await supabase.from("xp_events").insert({
      user_id: user.id,
      amount: adjustedPoints,
      source_type: options.source_type,
      task_id: options.task_id ?? null,
    });
  }
  if (!options?.skipRevalidate) {
    revalidatePath("/dashboard");
    revalidatePath("/settings");
    revalidatePath("/profile");
    revalidatePath("/tasks");
    revalidatePath("/learning");
    revalidatePath("/profile");
    revalidatePath("/strategy");
  }
  const levelAfter = levelFromTotalXP(newTotal);
  return {
    pointsApplied: adjustedPoints,
    levelUp: levelAfter > levelBefore,
    newLevel: levelAfter,
  };
}

/** Alignment <60% for 5 days → XP -10% (Performance Engine consequences). */
async function getAlignmentPenaltyMultiplier(): Promise<number> {
  const { getActiveStrategyFocus } = await import("./strategyFocus");
  const strategy = await getActiveStrategyFocus();
  if (!strategy) return 1;
  const { getAlignmentLog } = await import("./strategyFocus");
  const log = await getAlignmentLog(strategy.id, 5);
  if (log.length < 5) return 1;
  const avg = log.reduce((a, r) => a + r.alignment_score, 0) / log.length;
  return avg < 0.6 ? 0.9 : 1;
}

/** Anti-grind: XP diminishing returns when repeating same domain in one day (3+ → 0.9, 5+ → 0.8). */
async function getAntiGrindMultiplier(domain: string | null): Promise<number> {
  if (!domain) return 1;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 1;
  const today = new Date().toISOString().slice(0, 10);
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id")
    .eq("user_id", user.id)
    .eq("completed", true)
    .eq("domain", domain)
    .gte("completed_at", today + "T00:00:00Z")
    .lt("completed_at", today + "T23:59:59.999Z");
  const n = (tasks ?? []).length;
  if (n >= 5) return 0.8;
  if (n >= 3) return 0.9;
  return 1;
}

/** Call when user completes a task. Returns XP awarded and optional level-up info for UI (e.g. toast). */
export async function awardXPForTaskComplete(
  taskDomain?: string | null,
  taskId?: string | null,
  baseXp?: number | null,
  completionDate?: string | null,
  performanceRank?: "S" | "A" | "B" | "C" | null
): Promise<{ xpAwarded: number; levelUp?: boolean; newLevel?: number; lowSynergy?: boolean }> {
  const rankMult = performanceRank
    ? (await import("@/lib/performance-rank")).getXpMultiplierForRank(performanceRank)
    : 1;

  const [alignMult, antiGrindMult, adaptiveMod, primeMult, progressionMult, dangerousCtx] = await Promise.all([
    getAlignmentPenaltyMultiplier(),
    getAntiGrindMultiplier(taskDomain ?? null),
    import("./weekly-performance").then((m) => m.getAdaptiveModifiersForUser()),
    import("./prime-window").then((m) => m.isInsidePrimeWindow(completionDate ? new Date(completionDate) : undefined).then((inside) => (inside ? 1.1 : 1))),
    import("./progression-rank").then((m) => m.getProgressionRankState()).then((s) => (s ? s.xpMultiplier : 1)),
    completionDate ? import("./dangerous-modules-context").then((m) => m.getDangerousModulesContext(completionDate)) : Promise.resolve(null),
  ]);
  const dangerousMult = dangerousCtx ? dangerousCtx.xpMultiplier * dangerousCtx.regretXpModifier : 1;
  let energyMult = 1;
  let lowSynergy = false;
  let loadFailureMult = 1;
  let recoveryPenaltyMult = 1;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user && completionDate) {
      const { data: state } = await supabase
        .from("daily_state")
        .select("energy, focus, sensory_load, load, social_load, physical_health, sleep_hours, mental_battery")
        .eq("user_id", user.id)
        .eq("date", completionDate)
        .single();
      const energy = (state as { energy?: number | null } | null)?.energy ?? null;
      const sensoryLoad = (state as { sensory_load?: number | null } | null)?.sensory_load ?? null;
      const load = (state as { load?: number | null } | null)?.load ?? null;
      const energyPct = energy != null ? Math.round((energy / 10) * 100) : 50;
      if (energyPct > 75) energyMult = 1.15;
      else if (energyPct <= 10) {
        energyMult = 0.8; // Energy 0–1: XP -20% (Resource & Consequence Engine)
        lowSynergy = true;
      } else if (energyPct < 30) {
        energyMult = 0.75; // XP -25%
        lowSynergy = true;
      }
      const loadPct = load != null ? load : (sensoryLoad != null ? Math.round((sensoryLoad / 10) * 100) : 50);
      if (loadPct > 80) {
        const roll = Math.random();
        if (roll < 0.32) loadFailureMult = 0.5; // 25–40% failure chance → 50% XP (Fase 2)
      }
      const { getConsequenceState } = await import("./consequence-engine");
      const consequence = await getConsequenceState(completionDate);
      if (consequence.recoveryProtocol) recoveryPenaltyMult = 0.95; // Weekly performance penalty (Fase 2)

      const normalized = normalizeBehavioralStats({
        energy: energy ?? 5,
        focus: (state as { focus?: number | null } | null)?.focus ?? 5,
        mentalBattery: (state as { mental_battery?: number | null } | null)?.mental_battery ?? 5,
        mentalLoad: resolveMentalLoad1To10({
          systemLoad: load ?? null,
          sensoryLoad: sensoryLoad ?? null,
          fallback: 5,
        }),
        physicalHealth:
          (state as { physical_health?: number | null } | null)?.physical_health ??
          (state as { social_load?: number | null } | null)?.social_load ??
          5,
        sleepHours: (state as { sleep_hours?: number | null } | null)?.sleep_hours ?? 6,
      });
      const effective = getEffectiveBehavioralStats(normalized);
      const brainState = getBrainState(effective);
      energyMult *= getBrainStateMultiplier(brainState);
    }
  } catch {
    // Non-critical; keep multiplier = 1
  }

  const mult =
    alignMult * antiGrindMult * energyMult * loadFailureMult * recoveryPenaltyMult * rankMult
    * adaptiveMod.rewardMultiplier * primeMult * progressionMult * dangerousMult;
  const base = baseXp != null && baseXp > 0 ? baseXp : XP_TASK_COMPLETE;
  const points = Math.max(1, Math.floor(base * mult));
  const levelResult = await addXP(points, { source_type: "task_complete", task_id: taskId ?? null });
  return {
    xpAwarded: levelResult?.pointsApplied ?? points,
    ...(levelResult?.levelUp && { levelUp: levelResult.levelUp, newLevel: levelResult.newLevel }),
    ...(lowSynergy ? { lowSynergy: true } : {}),
  };
}

/** Call when user saves brain status (daily check-in). */
export async function awardXPForBrainStatus() {
  await addXP(XP_BRAIN_STATUS, { source_type: "brain_status" });
}

/** Call when user logs a learning session. */
export async function awardXPForLearningSession() {
  await addXP(XP_LEARNING_SESSION, { source_type: "learning_session" });
}

/** Call when user hits weekly learning target. */
export async function awardXPForWeeklyLearningTarget() {
  await addXP(XP_WEEKLY_LEARNING_TARGET, { source_type: "weekly_learning_target" });
}

/** Call for streak day (learning or task). */
export async function awardXPForStreakDay() {
  await addXP(XP_STREAK_DAY, { source_type: "streak_day" });
}

/** Deduct XP (for accountability penalties). */
export async function deductXP(points: number): Promise<void> {
  if (points <= 0) return;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data: existing } = await supabase
    .from("user_xp")
    .select("total_xp")
    .eq("user_id", user.id)
    .single();
  const current = (existing?.total_xp as number | undefined) ?? 0;
  const newTotal = Math.max(0, current - points);
  const { error } = await supabase
    .from("user_xp")
    .upsert(
      {
        user_id: user.id,
        total_xp: newTotal,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
  if (!error) {
    revalidatePath("/dashboard");
    revalidatePath("/learning");
    revalidatePath("/settings");
    revalidatePath("/profile");
    revalidatePath("/tasks");
    revalidatePath("/profile");
    revalidatePath("/strategy");
  }
}
