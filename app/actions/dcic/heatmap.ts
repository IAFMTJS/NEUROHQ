"use server";

import { createClient } from "@/lib/supabase/server";

export type HeatmapDay = "active" | "inactive";

/** Last 30 days: active = had at least one completion (mission from behaviour_log or task from tasks). */
export async function getHeatmapLast30Days(): Promise<{ date: string; status: HeatmapDay }[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 30);
  const startStr = start.toISOString().slice(0, 10);
  const endStr = today.toISOString().slice(0, 10);

  const [logsRes, tasksRes] = await Promise.all([
    supabase
      .from("behaviour_log")
      .select("date, mission_completed_at")
      .eq("user_id", user.id)
      .gte("date", startStr)
      .lte("date", endStr),
    supabase
      .from("tasks")
      .select("completed_at")
      .eq("user_id", user.id)
      .eq("completed", true)
      .not("completed_at", "is", null)
      .gte("completed_at", startStr + "T00:00:00")
      .lte("completed_at", endStr + "T23:59:59.999"),
  ]);

  const completedDays = new Set<string>();
  for (const row of (logsRes.data ?? []) as { date: string; mission_completed_at: string | null }[]) {
    if (row.mission_completed_at != null) completedDays.add(row.date);
  }
  for (const row of (tasksRes.data ?? []) as { completed_at: string }[]) {
    if (row.completed_at) completedDays.add(row.completed_at.slice(0, 10));
  }

  const out: { date: string; status: HeatmapDay }[] = [];
  const d = new Date(start);
  while (d <= today) {
    const dateStr = d.toISOString().slice(0, 10);
    out.push({ date: dateStr, status: completedDays.has(dateStr) ? "active" : "inactive" });
    d.setDate(d.getDate() + 1);
  }
  return out;
}
