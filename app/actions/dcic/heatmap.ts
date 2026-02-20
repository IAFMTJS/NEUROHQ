"use server";

import { createClient } from "@/lib/supabase/server";

export type HeatmapDay = "active" | "inactive";

/** Last 30 days: active = had at least one completion (mission or we could use tasks). */
export async function getHeatmapLast30Days(): Promise<{ date: string; status: HeatmapDay }[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 30);
  const startStr = start.toISOString().slice(0, 10);
  const endStr = today.toISOString().slice(0, 10);

  const { data: logs } = await supabase
    .from("behaviour_log")
    .select("date, mission_completed_at")
    .eq("user_id", user.id)
    .gte("date", startStr)
    .lte("date", endStr);

  const completedDays = new Set<string>();
  for (const row of (logs ?? []) as { date: string; mission_completed_at: string | null }[]) {
    if (row.mission_completed_at != null) completedDays.add(row.date);
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
