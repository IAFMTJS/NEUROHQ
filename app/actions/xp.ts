"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { levelFromTotalXP, xpToNextLevel, rankFromLevel, nextUnlockPreview } from "@/lib/xp";

const XP_TASK_COMPLETE = 10;
const XP_BRAIN_STATUS = 5;
const XP_LEARNING_SESSION = 8;
const XP_WEEKLY_LEARNING_TARGET = 25;
const XP_STREAK_DAY = 5;

export async function getXP(): Promise<{ total_xp: number; level: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { total_xp: 0, level: 1 };
  const { data } = await supabase
    .from("user_xp")
    .select("total_xp")
    .eq("user_id", user.id)
    .single();
  const total = (data?.total_xp as number | undefined) ?? 0;
  return { total_xp: total, level: levelFromTotalXP(total) };
}

/** Extended identity for dashboard: level, rank, streak, xp to next level, next unlock preview. */
export async function getXPIdentity(): Promise<{
  total_xp: number;
  level: number;
  rank: string;
  xp_to_next_level: number;
  next_unlock: { level: number; rank: string; xpNeeded: number };
  streak: { current: number; longest: number; last_completion_date: string | null };
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
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
  const [xpRes, streakRes] = await Promise.all([
    supabase.from("user_xp").select("total_xp").eq("user_id", user.id).single(),
    supabase.from("user_streak").select("current_streak, longest_streak, last_completion_date").eq("user_id", user.id).single(),
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

export async function addXP(points: number): Promise<void> {
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
  const { error } = await supabase
    .from("user_xp")
    .upsert(
      {
        user_id: user.id,
        total_xp: current + points,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
  if (!error) {
    revalidatePath("/dashboard");
    revalidatePath("/settings");
    revalidatePath("/tasks");
    revalidatePath("/learning");
    revalidatePath("/xp");
  }
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

/** Call when user completes a task. Pass task domain for anti-grind. */
export async function awardXPForTaskComplete(taskDomain?: string | null) {
  const [alignMult, antiGrindMult] = await Promise.all([
    getAlignmentPenaltyMultiplier(),
    getAntiGrindMultiplier(taskDomain ?? null),
  ]);
  const mult = alignMult * antiGrindMult;
  await addXP(Math.max(1, Math.floor(XP_TASK_COMPLETE * mult)));
}

/** Call when user saves brain status (daily check-in). */
export async function awardXPForBrainStatus() {
  await addXP(XP_BRAIN_STATUS);
}

/** Call when user logs a learning session. */
export async function awardXPForLearningSession() {
  await addXP(XP_LEARNING_SESSION);
}

/** Call when user hits weekly learning target. */
export async function awardXPForWeeklyLearningTarget() {
  await addXP(XP_WEEKLY_LEARNING_TARGET);
}

/** Call for streak day (learning or task). */
export async function awardXPForStreakDay() {
  await addXP(XP_STREAK_DAY);
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
    revalidatePath("/tasks");
    revalidatePath("/xp");
  }
}
