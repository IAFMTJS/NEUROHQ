"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { levelFromTotalXP } from "@/lib/xp";

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

async function addXP(points: number): Promise<void> {
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
