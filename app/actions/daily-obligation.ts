"use server";

import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { yesterdayDate } from "@/lib/utils/timezone";

/**
 * Fase 4: Count completions for a date (tasks completed that day + DCIC missions completed that day).
 * "1 missie" = 1 completion (task or mission).
 */
export async function getCompletionsCountForDate(dateStr: string): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const dayStart = `${dateStr}T00:00:00`;
  const dayEnd = `${dateStr}T23:59:59.999`;

  const [tasksRes, behaviourRes] = await Promise.all([
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("completed", true)
      .gte("completed_at", dayStart)
      .lte("completed_at", dayEnd),
    supabase
      .from("behaviour_log")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .not("mission_completed_at", "is", null)
      .gte("mission_completed_at", dayStart)
      .lte("mission_completed_at", dayEnd),
  ]);

  const taskCount = tasksRes.count ?? 0;
  const behaviourCount = behaviourRes.count ?? 0;
  return taskCount + behaviourCount;
}

/**
 * Fase 4: Whether yesterday had zero completions (so today gets penalty).
 */
export async function hadZeroCompletionsYesterday(todayStr: string): Promise<boolean> {
  const yesterdayStr = yesterdayDate(todayStr);
  const count = await getCompletionsCountForDate(yesterdayStr);
  return count === 0;
}

/**
 * Fase 4: Apply zero-completion rollover for today.
 * If yesterday had 0 completions: add load +10, energy * 0.9 to today's daily_state (once per day).
 * Call from dashboard/today load so "rollover" runs on first visit.
 */
export async function applyZeroCompletionRollover(todayStr: string): Promise<{
  applied: boolean;
  loadBump?: number;
  energyPenalty?: number;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { applied: false };

  const yesterdayStr = yesterdayDate(todayStr);
  const count = await getCompletionsCountForDate(yesterdayStr);
  if (count > 0) return { applied: false };

  const { data: yesterdayRow } = await supabase
    .from("daily_state")
    .select("is_rest_day")
    .eq("user_id", user.id)
    .eq("date", yesterdayStr)
    .maybeSingle();
  const yesterdayWasRestDay = (yesterdayRow as { is_rest_day?: boolean | null } | null)?.is_rest_day === true;

  const { data: todayRow } = await supabase
    .from("daily_state")
    .select("id, load, energy, zero_completion_penalty_applied")
    .eq("user_id", user.id)
    .eq("date", todayStr)
    .maybeSingle();

  const row = todayRow as { id?: string; load?: number | null; energy?: number | null; zero_completion_penalty_applied?: boolean | null } | null;
  if (row?.zero_completion_penalty_applied) return { applied: false };

  const currentLoad = row?.load ?? 0;
  const currentEnergy = row?.energy ?? 5;
  const newLoad = Math.min(100, currentLoad + 10);
  const newEnergy = Math.max(1, Math.min(10, Math.round(currentEnergy * 0.9)));

  if (row?.id) {
    await supabase
      .from("daily_state")
      .update({
        load: newLoad,
        energy: newEnergy,
        zero_completion_penalty_applied: true,
      })
      .eq("user_id", user.id)
      .eq("date", todayStr);
  } else {
    await supabase.from("daily_state").insert({
      user_id: user.id,
      date: todayStr,
      load: newLoad,
      energy: newEnergy,
      zero_completion_penalty_applied: true,
    });
  }

  const { data: streakRow } = await supabase
    .from("user_streak")
    .select("current_streak")
    .eq("user_id", user.id)
    .single();
  const currentStreak = (streakRow as { current_streak?: number } | null)?.current_streak ?? 0;
  if (currentStreak > 0 && !yesterdayWasRestDay) {
    await supabase
      .from("user_streak")
      .update({
        current_streak: Math.max(0, currentStreak - 1),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);
  }

  revalidateTag(`daily-${user.id}-${todayStr}`, "max");
  revalidateTag(`energy-${user.id}-${todayStr}`, "max");

  return { applied: true, loadBump: 10, energyPenalty: newEnergy };
}
