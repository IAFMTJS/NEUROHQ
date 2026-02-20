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
  }
}

/** Call when user completes a task. */
export async function awardXPForTaskComplete() {
  await addXP(XP_TASK_COMPLETE);
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
  }
}
