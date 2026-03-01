"use server";

import { createClient } from "@/lib/supabase/server";
import { computeMomentumScore, momentumBand, type MomentumBand } from "@/lib/momentum";

export interface MomentumResult {
  score: number;
  band: MomentumBand;
  activeDaysLast7: number;
  completionsLast7: number;
  missedYesterday: boolean;
  currentStreak: number;
}

/** Get momentum score 0–100 and band (low/medium/high) for dashboard. */
export async function getMomentum(): Promise<MomentumResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      score: 50,
      band: "medium",
      activeDaysLast7: 0,
      completionsLast7: 0,
      missedYesterday: true,
      currentStreak: 0,
    };
  }

  const today = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [behaviourRes, tasksRes, streakRes] = await Promise.all([
    supabase
      .from("behaviour_log")
      .select("date, mission_completed_at")
      .eq("user_id", user.id)
      .gte("date", sevenDaysAgo)
      .lte("date", today),
    supabase
      .from("tasks")
      .select("completed_at")
      .eq("user_id", user.id)
      .eq("completed", true)
      .not("completed_at", "is", null)
      .gte("completed_at", sevenDaysAgo + "T00:00:00")
      .lte("completed_at", today + "T23:59:59.999"),
    supabase.from("user_streak").select("current_streak, last_completion_date").eq("user_id", user.id).single(),
  ]);

  const completedByDay = new Set<string>();
  let completionsLast7 = 0;
  for (const row of (behaviourRes.data ?? []) as { date: string; mission_completed_at: string | null }[]) {
    if (row.mission_completed_at != null) {
      completedByDay.add(row.date);
      completionsLast7++;
    }
  }
  for (const row of (tasksRes.data ?? []) as { completed_at: string }[]) {
    if (row.completed_at) {
      const d = row.completed_at.slice(0, 10);
      completedByDay.add(d);
      completionsLast7++;
    }
  }
  const activeDaysLast7 = completedByDay.size;

  const lastCompletionDate = (streakRes.data as { last_completion_date?: string | null } | null)?.last_completion_date ?? null;
  const currentStreak = (streakRes.data as { current_streak?: number } | null)?.current_streak ?? 0;
  const missedYesterday = lastCompletionDate !== yesterday && lastCompletionDate !== today;

  const score = computeMomentumScore({
    activeDaysLast7,
    completionsLast7,
    targetCompletionsLast7: 7,
    missedYesterday,
    currentStreak,
  });

  return {
    score,
    band: momentumBand(score),
    activeDaysLast7,
    completionsLast7,
    missedYesterday,
    currentStreak,
  };
}
