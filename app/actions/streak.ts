"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Fase 2: When 5+ days no completion, set current_streak to 0 (streak decay).
 * Call from getConsequenceState so streak display updates when user returns.
 */
export async function applyStreakDecayIfInactive(asOfDate: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: row } = await supabase
    .from("user_streak")
    .select("current_streak, longest_streak, last_completion_date")
    .eq("user_id", user.id)
    .single();

  const lastCompletion = (row as { last_completion_date?: string | null } | null)?.last_completion_date ?? null;
  if (!lastCompletion) return;

  const last = new Date(lastCompletion);
  const ref = new Date(asOfDate);
  const diffDays = Math.round((ref.getTime() - last.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays < 5) return;

  const currentStreak = (row as { current_streak?: number } | null)?.current_streak ?? 0;
  if (currentStreak === 0) return;

  await supabase.from("user_streak").update({
    current_streak: 0,
    updated_at: new Date().toISOString(),
  }).eq("user_id", user.id);
}

/**
 * Update user_streak when a task is completed (Missions page).
 * The DB trigger only runs on missions table; we need to update streak from tasks completions too.
 */
export async function updateStreakOnTaskComplete(completionDateStr: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const completionDate = completionDateStr.slice(0, 10);

  const { data: row } = await supabase
    .from("user_streak")
    .select("current_streak, longest_streak, last_completion_date")
    .eq("user_id", user.id)
    .single();

  const lastCompletion = (row as { last_completion_date?: string | null } | null)?.last_completion_date ?? null;
  let currentStreak = (row as { current_streak?: number } | null)?.current_streak ?? 0;
  let longestStreak = (row as { longest_streak?: number } | null)?.longest_streak ?? 0;

  if (!lastCompletion) {
    currentStreak = 1;
  } else {
    const last = new Date(lastCompletion);
    const curr = new Date(completionDate);
    const diffDays = Math.round((curr.getTime() - last.getTime()) / (24 * 60 * 60 * 1000));
    if (diffDays === 1) {
      currentStreak += 1;
    } else if (diffDays > 1) {
      currentStreak = 1;
    }
    // diffDays === 0: same day, keep current_streak (no change)
  }

  if (currentStreak > longestStreak) longestStreak = currentStreak;

  await supabase.from("user_streak").upsert(
    {
      user_id: user.id,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_completion_date: completionDate,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
}
