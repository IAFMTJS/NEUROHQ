"use server";

import { createClient } from "@/lib/supabase/server";
import { getWeekBounds } from "@/lib/utils/learning";
import { getWeeklyMinutes } from "./learning";

export type RealityReport = {
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

export async function getRealityReport(weekStart: string, weekEnd: string): Promise<RealityReport> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      weekStart,
      weekEnd,
      tasksCompleted: 0,
      tasksPlanned: 0,
      learningMinutes: 0,
      learningTarget: 60,
      savingsProgress: [],
      avgEnergy: null,
      avgFocus: null,
      carryOverCount: 0,
    };
  }

  const { data: tasks } = await supabase
    .from("tasks")
    .select("completed, due_date")
    .eq("user_id", user.id)
    .gte("due_date", weekStart)
    .lte("due_date", weekEnd);
  const tasksCompleted = tasks?.filter((t) => t.completed).length ?? 0;
  const tasksPlanned = tasks?.length ?? 0;

  const learningMinutes = await getWeeklyMinutes(weekStart, weekEnd);

  const { data: goals } = await supabase
    .from("savings_goals")
    .select("name, current_cents, target_cents")
    .eq("user_id", user.id);
  const savingsProgress = (goals ?? []).map((g) => ({
    name: g.name,
    current: g.current_cents ?? 0,
    target: g.target_cents ?? 1,
    pct: Math.min(100, Math.round(((g.current_cents ?? 0) / (g.target_cents || 1)) * 100)),
  }));

  const { data: states } = await supabase
    .from("daily_state")
    .select("energy, focus")
    .eq("user_id", user.id)
    .gte("date", weekStart)
    .lte("date", weekEnd);
  const withEnergy = (states ?? []).filter((s) => s.energy != null);
  const withFocus = (states ?? []).filter((s) => s.focus != null);
  const avgEnergy = withEnergy.length ? withEnergy.reduce((a, s) => a + (s.energy ?? 0), 0) / withEnergy.length : null;
  const avgFocus = withFocus.length ? withFocus.reduce((a, s) => a + (s.focus ?? 0), 0) / withFocus.length : null;

  const { data: lastDayTasks } = await supabase
    .from("tasks")
    .select("carry_over_count")
    .eq("user_id", user.id)
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

export type StoredReportMeta = { week_start: string; week_end: string };

export async function getStoredReportWeeks(): Promise<StoredReportMeta[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("reality_reports")
    .select("week_start, week_end")
    .eq("user_id", user.id)
    .order("week_start", { ascending: false })
    .limit(12);
  return (data ?? []).map((r) => ({ week_start: r.week_start, week_end: r.week_end }));
}

export async function getStoredReport(weekStart: string): Promise<RealityReport | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("reality_reports")
    .select("payload")
    .eq("user_id", user.id)
    .eq("week_start", weekStart)
    .maybeSingle();
  return (data?.payload as RealityReport) ?? null;
}
