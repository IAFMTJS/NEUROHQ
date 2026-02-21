"use server";

import { createClient } from "@/lib/supabase/server";
import {
  calculateMomentum,
  calculateStreakRisk,
  detectTrend,
  generateCoachRecommendations,
  projectLevelDays,
  type CoachRecommendation,
  type StreakRiskLevel,
  type TrendDirection,
} from "@/lib/insight-engine";
import { xpToNextLevel } from "@/lib/xp";

export interface InsightGraphDay {
  date: string;
  name: string;
  xp: number;
  energy: number | null;
  focus: number | null;
}

export interface InsightEngineState {
  momentum: { score: number; band: "low" | "medium" | "high" };
  trend: { direction: TrendDirection; changePct: number; microcopy: string };
  streakRisk: { score: number; level: StreakRiskLevel };
  coachRecommendations: CoachRecommendation[];
  levelProjectionDays: number | null;
  /** XP last 7 + previous 7 for UI. */
  xpLast7: number;
  xpPrevious7: number;
  completionRateLast7: number | null;
  /** Last 14 days for multi-layer graph. */
  graphData: InsightGraphDay[];
  /** Best day of week 0–6 (Sunday=0) for behavior copy. */
  bestDayOfWeek: number | null;
}

function momentumBand(score: number): "low" | "medium" | "high" {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

/** Load 14 days of daily data: prefer user_analytics_daily, fallback to behaviour_log + daily_state. */
async function loadDailyMetrics(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  endDate: string,
  days: number
) {
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - days);
  const startStr = startDate.toISOString().slice(0, 10);

  type DailyRow = {
    date: string;
    xp_earned?: number;
    missions_completed?: number;
    energy_avg?: number | null;
    focus_avg?: number | null;
  };

  const { data: analytics } = await supabase
    .from("user_analytics_daily")
    .select("date, xp_earned, missions_completed, energy_avg, focus_avg")
    .eq("user_id", userId)
    .gte("date", startStr)
    .lte("date", endDate)
    .order("date", { ascending: true });

  const { data: behaviour } = await supabase
    .from("behaviour_log")
    .select("date, xp_gained, mission_started_at, mission_completed_at")
    .eq("user_id", userId)
    .gte("date", startStr)
    .lte("date", endDate);

  const { data: dailyState } = await supabase
    .from("daily_state")
    .select("date, energy, focus")
    .eq("user_id", userId)
    .gte("date", startStr)
    .lte("date", endDate);

  const byDate = new Map<
    string,
    { xp: number; missionsCompleted: number; energySum: number; energyN: number; focusSum: number; focusN: number }
  >();

  for (const row of analytics ?? []) {
    const r = row as DailyRow;
    const xp = r.xp_earned ?? 0;
    const mc = r.missions_completed ?? 0;
    const e = r.energy_avg != null ? Number(r.energy_avg) : 0;
    const f = r.focus_avg != null ? Number(r.focus_avg) : 0;
    byDate.set(r.date, {
      xp,
      missionsCompleted: mc,
      energySum: e,
      energyN: e ? 1 : 0,
      focusSum: f,
      focusN: f ? 1 : 0,
    });
  }

  for (const row of behaviour ?? []) {
    const d = (row as { date: string; xp_gained?: number | null; mission_completed_at?: string | null }).date;
    const entry = byDate.get(d) ?? {
      xp: 0,
      missionsCompleted: 0,
      energySum: 0,
      energyN: 0,
      focusSum: 0,
      focusN: 0,
    };
    entry.xp += (row as { xp_gained?: number | null }).xp_gained ?? 0;
    if ((row as { mission_completed_at?: string | null }).mission_completed_at != null) {
      entry.missionsCompleted += 1;
    }
    byDate.set(d, entry);
  }

  for (const row of dailyState ?? []) {
    const r = row as { date: string; energy?: number | null; focus?: number | null };
    const entry = byDate.get(r.date) ?? {
      xp: 0,
      missionsCompleted: 0,
      energySum: 0,
      energyN: 0,
      focusSum: 0,
      focusN: 0,
    };
    if (r.energy != null) {
      entry.energySum += r.energy;
      entry.energyN += 1;
    }
    if (r.focus != null) {
      entry.focusSum += r.focus;
      entry.focusN += 1;
    }
    byDate.set(r.date, entry);
  }

  return byDate;
}

/** Completion rate = completed / started (last 7 days). From behaviour_log or mission_events. */
async function getCompletionRateLast7(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<number | null> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const startStr = sevenDaysAgo.toISOString().slice(0, 10);

  const { data: log } = await supabase
    .from("behaviour_log")
    .select("mission_started_at, mission_completed_at")
    .eq("user_id", userId)
    .gte("date", startStr);

  let started = 0;
  let completed = 0;
  for (const row of log ?? []) {
    if ((row as { mission_started_at?: string | null }).mission_started_at != null) started++;
    if ((row as { mission_completed_at?: string | null }).mission_completed_at != null) completed++;
  }
  if (started === 0) return null;
  return completed / started;
}

/** Best day of week 0–6 by total XP over last 14 days. */
function bestDayOfWeek(
  byDate: Map<string, { xp: number; missionsCompleted: number; energySum: number; energyN: number; focusSum: number; focusN: number }>
): number | undefined {
  const byDow = [0, 0, 0, 0, 0, 0, 0];
  for (const [dateStr, entry] of byDate) {
    const d = new Date(dateStr + "Z");
    const dow = d.getUTCDay();
    byDow[dow] += entry.xp;
  }
  let best = 0;
  let bestVal = 0;
  for (let i = 0; i < 7; i++) {
    if (byDow[i] > bestVal) {
      bestVal = byDow[i];
      best = i;
    }
  }
  return bestVal > 0 ? best : undefined;
}

/** Full insight engine state for Insights page. Max 3 heavy reads; rest from single queries. */
export async function getInsightEngineState(): Promise<InsightEngineState | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const today = new Date().toISOString().slice(0, 10);
  const byDate = await loadDailyMetrics(supabase, user.id, today, 14);

  const dates = Array.from(byDate.keys()).sort();
  const last7Dates = dates.slice(-7);
  const prev7Dates = dates.slice(-14, -7);

  let xpLast7 = 0;
  let xpPrevious7 = 0;
  for (const d of last7Dates) {
    xpLast7 += byDate.get(d)?.xp ?? 0;
  }
  for (const d of prev7Dates) {
    xpPrevious7 += byDate.get(d)?.xp ?? 0;
  }

  const [completionRate, streakRow, behaviorRow, xpRow, frictionCount] = await Promise.all([
    getCompletionRateLast7(supabase, user.id),
    supabase.from("user_streak").select("current_streak, longest_streak, last_completion_date").eq("user_id", user.id).single(),
    supabase.from("user_behavior").select("last_active_date").eq("user_id", user.id).single(),
    supabase.from("user_xp").select("total_xp").eq("user_id", user.id).single(),
    supabase
      .from("friction_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const currentStreak = (streakRow.data as { current_streak?: number } | null)?.current_streak ?? 0;
  const longestStreak = (streakRow.data as { longest_streak?: number } | null)?.longest_streak ?? 1;
  const lastCompletionDate = (streakRow.data as { last_completion_date?: string | null } | null)?.last_completion_date ?? null;
  const lastActive = (behaviorRow.data as { last_active_date?: string | null } | null)?.last_active_date ?? null;
  const totalXP = (xpRow.data as { total_xp?: number } | null)?.total_xp ?? 0;
  const frictionCount7 = frictionCount.count ?? 0;

  const streakStability = longestStreak > 0 ? Math.min(1, currentStreak / Math.max(7, longestStreak)) : 0;
  const momentumScore = calculateMomentum({
    xpLast7,
    xpPrevious7: xpPrevious7 || 1,
    completionRateLast7: completionRate ?? 0.5,
    streakStabilityScore: streakStability,
  });

  const trend = detectTrend({ xpLast7, xpPrevious7: xpPrevious7 || 0 });

  const daysSinceLastActive = lastActive
    ? Math.max(0, Math.floor((new Date().setHours(0, 0, 0, 0) - new Date(lastActive).setHours(0, 0, 0, 0)) / (24 * 60 * 60 * 1000)))
    : 7;
  const energyPrev7 = prev7Dates.length
    ? prev7Dates.reduce((s, d) => {
        const e = byDate.get(d);
        if (!e || e.energyN === 0) return s;
        return s + e.energySum / e.energyN;
      }, 0) / prev7Dates.filter((d) => (byDate.get(d)?.energyN ?? 0) > 0).length || 1
    : 5;
  const energyLast7 = last7Dates.length
    ? last7Dates.reduce((s, d) => {
        const e = byDate.get(d);
        if (!e || e.energyN === 0) return s;
        return s + e.energySum / e.energyN;
      }, 0) / last7Dates.filter((d) => (byDate.get(d)?.energyN ?? 0) > 0).length || 1
    : 5;
  const energyDropPct =
    energyPrev7 > 0 ? Math.max(0, ((energyPrev7 - energyLast7) / energyPrev7) * 100) : 0;
  const xpDeclinePct =
    xpPrevious7 > 0 ? Math.max(0, ((xpPrevious7 - xpLast7) / xpPrevious7) * 100) : 0;

  const streakRisk = calculateStreakRisk({
    daysSinceLastActive: Math.min(daysSinceLastActive, 3),
    energyDropPct,
    xpDeclinePct,
  });

  const xpPerDayLast14 = dates.length > 0 ? (xpLast7 + xpPrevious7) / 14 : 0;
  const levelProjectionDays = projectLevelDays({
    totalXP,
    xpPerDayLast14,
    xpToNextLevel: xpToNextLevel(totalXP),
  });

  const bestDow = bestDayOfWeek(byDate);
  const coachRecommendations = generateCoachRecommendations({
    lowCompletionRate: completionRate != null && completionRate < 0.6,
    highFriction: frictionCount7 >= 3,
    streakAtRisk: streakRisk.level === "high",
    momentumDown: trend.direction === "down",
    bestDayOfWeek: bestDow,
  });

  const dayNamesShort = ["Zo", "Ma", "Di", "Wo", "Do", "Vr", "Za"];
  const graphData: InsightGraphDay[] = dates.map((dateStr) => {
    const e = byDate.get(dateStr);
    const d = new Date(dateStr + "Z");
    const name = `${dayNamesShort[d.getUTCDay()]} ${dateStr.slice(8)}`;
    return {
      date: dateStr,
      name,
      xp: e?.xp ?? 0,
      energy: e && e.energyN > 0 ? e.energySum / e.energyN : null,
      focus: e && e.focusN > 0 ? e.focusSum / e.focusN : null,
    };
  });

  return {
    momentum: { score: momentumScore, band: momentumBand(momentumScore) },
    trend,
    streakRisk,
    coachRecommendations,
    levelProjectionDays,
    xpLast7,
    xpPrevious7,
    completionRateLast7: completionRate ?? null,
    graphData,
    bestDayOfWeek: bestDow ?? null,
  };
}
