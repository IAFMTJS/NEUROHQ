"use server";

import { createClient } from "@/lib/supabase/server";
import {
  getCognitiveLoadForecast,
  type CognitiveLoadForecast,
  type LoadForecastInputs,
} from "@/lib/cognitive-load-forecast";

/** Get cognitive load forecast for today (load trend 3d, energy decline, failure increase). */
export async function getLoadForecast(dateStr: string): Promise<CognitiveLoadForecast | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const threeDaysAgo = new Date(dateStr);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const startStr = threeDaysAgo.toISOString().slice(0, 10);

  const { data: dailyRows } = await supabase
    .from("daily_state")
    .select("date, load, energy")
    .eq("user_id", user.id)
    .gte("date", startStr)
    .lte("date", dateStr)
    .order("date", { ascending: true });

  const rows = (dailyRows ?? []) as { date: string; load?: number | null; energy?: number | null }[];
  const loadValues = rows.map((r) => (r.load ?? 0) / 10).filter((_, i) => rows[i]?.date <= dateStr);
  const energyValues = rows.map((r) => (r.energy ?? 5) / 10).filter((_, i) => rows[i]?.date <= dateStr);

  let loadTrend3d = 0;
  if (loadValues.length >= 2) {
    const recent = loadValues.slice(-3);
    loadTrend3d = (recent[recent.length - 1] ?? 0) - (recent[0] ?? 0);
    loadTrend3d = Math.max(-1, Math.min(1, loadTrend3d / 10));
  }

  let energyDecline = 0;
  if (energyValues.length >= 2) {
    const first = energyValues[0] ?? 0.5;
    const last = energyValues[energyValues.length - 1] ?? 0.5;
    energyDecline = Math.max(0, (first - last) / 2);
  }

  const { data: behaviourLog } = await supabase
    .from("behaviour_log")
    .select("date, mission_completed_at")
    .eq("user_id", user.id)
    .gte("date", startStr)
    .lte("date", dateStr);
  const completedByDay = new Map<string, number>();
  for (const row of behaviourLog ?? []) {
    const d = (row as { date: string }).date;
    const completed = (row as { mission_completed_at?: string | null }).mission_completed_at != null ? 1 : 0;
    completedByDay.set(d, (completedByDay.get(d) ?? 0) + completed);
  }
  const daysList = Array.from({ length: 4 }, (_, i) => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() - (3 - i));
    return d.toISOString().slice(0, 10);
  });
  const recentCompletions = daysList.map((d) => completedByDay.get(d) ?? 0);
  const failureIncrease =
    recentCompletions.length >= 2 && recentCompletions[0] > 0
      ? Math.max(0, 1 - (recentCompletions[recentCompletions.length - 1] ?? 0) / recentCompletions[0])
      : 0;

  const inputs: LoadForecastInputs = {
    loadTrend3d,
    energyDecline,
    failureIncrease,
  };
  return getCognitiveLoadForecast(inputs);
}
