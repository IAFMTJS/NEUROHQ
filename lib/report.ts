import type { SupabaseClient } from "@supabase/supabase-js";

export type RealityReportPayload = {
  weekStart: string;
  weekEnd: string;
  tasksCompleted: number;
  tasksPlanned: number;
  learningMinutes: number;
  learningTarget: number;
  savingsProgress: { name: string; current: number; target: number; pct: number }[];
  avgEnergy: number | null;
  avgFocus: number | null;
  carryOverCount: number;
};

/**
 * Compute reality report for a user using admin client (for cron).
 */
export async function getRealityReportForUser(
  supabase: SupabaseClient,
  userId: string,
  weekStart: string,
  weekEnd: string
): Promise<RealityReportPayload> {
  const { data: tasks } = await supabase
    .from("tasks")
    .select("completed, due_date")
    .eq("user_id", userId)
    .gte("due_date", weekStart)
    .lte("due_date", weekEnd);
  const tasksCompleted = tasks?.filter((t) => t.completed).length ?? 0;
  const tasksPlanned = tasks?.length ?? 0;

  const { data: sessions } = await supabase
    .from("learning_sessions")
    .select("minutes")
    .eq("user_id", userId)
    .gte("date", weekStart)
    .lte("date", weekEnd);
  const learningMinutes = (sessions ?? []).reduce((sum, s) => sum + (s.minutes ?? 0), 0);

  const { data: goals } = await supabase
    .from("savings_goals")
    .select("name, current_cents, target_cents")
    .eq("user_id", userId);
  const savingsProgress = (goals ?? []).map((g) => ({
    name: g.name,
    current: g.current_cents ?? 0,
    target: g.target_cents ?? 1,
    pct: Math.min(100, Math.round(((g.current_cents ?? 0) / (g.target_cents || 1)) * 100)),
  }));

  const { data: states } = await supabase
    .from("daily_state")
    .select("energy, focus")
    .eq("user_id", userId)
    .gte("date", weekStart)
    .lte("date", weekEnd);
  const withEnergy = (states ?? []).filter((s) => s.energy != null);
  const withFocus = (states ?? []).filter((s) => s.focus != null);
  const avgEnergy = withEnergy.length ? withEnergy.reduce((a, s) => a + (s.energy ?? 0), 0) / withEnergy.length : null;
  const avgFocus = withFocus.length ? withFocus.reduce((a, s) => a + (s.focus ?? 0), 0) / withFocus.length : null;

  const { data: lastDayTasks } = await supabase
    .from("tasks")
    .select("carry_over_count")
    .eq("user_id", userId)
    .eq("due_date", weekEnd)
    .eq("completed", false);
  const carryOverCount = Math.max(0, ...(lastDayTasks ?? []).map((t) => t.carry_over_count ?? 0));

  return {
    weekStart,
    weekEnd,
    tasksCompleted,
    tasksPlanned,
    learningMinutes,
    learningTarget: 60,
    savingsProgress,
    avgEnergy: avgEnergy != null ? Math.round(avgEnergy * 10) / 10 : null,
    avgFocus: avgFocus != null ? Math.round(avgFocus * 10) / 10 : null,
    carryOverCount,
  };
}
