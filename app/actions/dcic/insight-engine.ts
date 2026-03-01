"use server";

import { createClient } from "@/lib/supabase/server";
import {
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
  /** Consecutive days with completion ending on this day (for streak layer). */
  streak: number;
  /** True wanneer deze dag deel uitmaakt van een actieve streak (ten minste één completion). */
  streakActive?: boolean;
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

/** Normaliseer datum uit Supabase naar YYYY-MM-DD (Postgres date kan "2025-02-22" of "2025-02-22T00:00:00.000Z" zijn). */
function toDateKey(val: string | Date | null | undefined): string | null {
  if (val == null) return null;
  const s = typeof val === "string" ? val : (val as Date).toISOString?.() ?? String(val);
  const match = s.slice(0, 10).match(/^\d{4}-\d{2}-\d{2}$/);
  return match ? match[0] : null;
}

/** Load N days of daily data including endDate (today). Range = [endDate - (days-1), endDate]. */
async function loadDailyMetrics(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  endDate: string,
  days: number
) {
  const end = new Date(endDate + "T12:00:00Z");
  const startDate = new Date(end);
  startDate.setUTCDate(startDate.getUTCDate() - (days - 1));
  const startStr = startDate.toISOString().slice(0, 10);

  type DailyRow = {
    date: string | Date;
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
    const dateKey = toDateKey(r.date);
    if (!dateKey || dateKey < startStr || dateKey > endDate) continue;
    const xp = r.xp_earned ?? 0;
    const mc = r.missions_completed ?? 0;
    const e = r.energy_avg != null ? Number(r.energy_avg) : 0;
    const f = r.focus_avg != null ? Number(r.focus_avg) : 0;
    byDate.set(dateKey, {
      xp,
      missionsCompleted: mc,
      energySum: e,
      energyN: e ? 1 : 0,
      focusSum: f,
      focusN: f ? 1 : 0,
    });
  }

  for (const row of behaviour ?? []) {
    const rawDate = (row as { date: string | Date; xp_gained?: number | null; mission_completed_at?: string | null }).date;
    const d = toDateKey(rawDate);
    if (!d || d < startStr || d > endDate) continue;
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
    const r = row as { date: string | Date; energy?: number | null; focus?: number | null };
    const dateKey = toDateKey(r.date);
    if (!dateKey || dateKey < startStr || dateKey > endDate) continue;
    const entry = byDate.get(dateKey) ?? {
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
    byDate.set(dateKey, entry);
  }

  const empty = () => ({ xp: 0, missionsCompleted: 0, energySum: 0, energyN: 0, focusSum: 0, focusN: 0 });
  const startUtcDate = startDate.getUTCDate();
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setUTCDate(startUtcDate + i);
    const dateStr = d.toISOString().slice(0, 10);
    if (!byDate.has(dateStr)) byDate.set(dateStr, empty());
  }

  // XP voor grafiek: primair uit xp_events (laatste 14 dagen) zodat grafiek altijd klopt
  try {
    const { data: xpEvents } = await supabase
      .from("xp_events")
      .select("amount, created_at")
      .eq("user_id", userId)
      .gte("created_at", startStr + "T00:00:00Z")
      .lte("created_at", endDate + "T23:59:59.999Z");
    if (xpEvents?.length) {
      const xpByDate = new Map<string, number>();
      for (const row of xpEvents) {
        const d = (row as { created_at: string }).created_at.slice(0, 10);
        if (d >= startStr && d <= endDate) {
          xpByDate.set(d, (xpByDate.get(d) ?? 0) + ((row as { amount: number }).amount ?? 0));
        }
      }
      for (const [d, xp] of xpByDate) {
        const entry = byDate.get(d);
        if (entry) entry.xp = xp;
        else byDate.set(d, { ...empty(), xp });
      }
    }
  } catch {
    // xp_events table may not exist
  }

  // Fallback: Supabase tasks table (completed_at, base_xp) — vul alleen dagen zonder data uit andere bronnen
  try {
    const { data: completedTasks } = await supabase
      .from("tasks")
      .select("completed_at, base_xp")
      .eq("user_id", userId)
      .eq("completed", true)
      .is("deleted_at", null)
      .not("completed_at", "is", null)
      .gte("completed_at", startStr + "T00:00:00Z")
      .lte("completed_at", endDate + "T23:59:59.999Z");
    if (completedTasks?.length) {
      const byDateFromTasks = new Map<string, { xp: number; missions: number }>();
      for (const row of completedTasks as { completed_at: string; base_xp?: number | null }[]) {
        const dateKey = row.completed_at?.slice(0, 10);
        if (!dateKey || dateKey < startStr || dateKey > endDate) continue;
        const xp = row.base_xp ?? 50;
        const cur = byDateFromTasks.get(dateKey) ?? { xp: 0, missions: 0 };
        cur.xp += xp;
        cur.missions += 1;
        byDateFromTasks.set(dateKey, cur);
      }
      for (const [dateKey, v] of byDateFromTasks) {
        const entry = byDate.get(dateKey);
        if (entry && (entry.xp > 0 || entry.missionsCompleted > 0)) continue;
        if (entry) {
          entry.xp = v.xp;
          entry.missionsCompleted = v.missions;
        } else {
          byDate.set(dateKey, { ...empty(), xp: v.xp, missionsCompleted: v.missions });
        }
      }
    }
  } catch {
    // tasks table fallback failed
  }

  return byDate;
}

/** Completion rate = completed / started (last 7 days). Uses task_events first (task completion flow), then behaviour_log (DCIC). */
async function getCompletionRateLast7(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<number | null> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const startStr = sevenDaysAgo.toISOString().slice(0, 10);

  const { data: taskEvents } = await supabase
    .from("task_events")
    .select("event_type")
    .eq("user_id", userId)
    .in("event_type", ["start", "complete"])
    .gte("occurred_at", startStr);

  let started = 0;
  let completed = 0;
  for (const row of taskEvents ?? []) {
    const t = (row as { event_type: string }).event_type;
    if (t === "start") started++;
    if (t === "complete") completed++;
  }
  if (started > 0) return completed / started;

  const { data: log } = await supabase
    .from("behaviour_log")
    .select("mission_started_at, mission_completed_at")
    .eq("user_id", userId)
    .gte("date", startStr);

  started = 0;
  completed = 0;
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

  const trend = detectTrend({ xpLast7, xpPrevious7: xpPrevious7 || 0 });

  // Use same momentum as dashboard (getMomentum) so Insights and Dashboard show the same score/band
  const { getMomentum } = await import("./momentum");
  const momentumResult = await getMomentum();
  const momentumScore = momentumResult.score;

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

  const graphData = buildGraphDataFromByDate(byDate, dates);

  return {
    momentum: { score: momentumScore, band: momentumResult.band },
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

export type XPBySourceItem = { source_type: string; total: number; count: number };

/** XP per source (laatste 7 dagen) voor Commander XP-pagina. */
export async function getXPBySourceLast7(): Promise<XPBySourceItem[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const since = new Date();
  since.setDate(since.getDate() - 7);
  const sinceStr = since.toISOString();
  const { data: rows } = await supabase
    .from("xp_events")
    .select("amount, source_type")
    .eq("user_id", user.id)
    .gte("created_at", sinceStr);
  const bySource = new Map<string, { total: number; count: number }>();
  for (const row of rows ?? []) {
    const r = row as { amount: number; source_type: string };
    const st = r.source_type ?? "other";
    const prev = bySource.get(st) ?? { total: 0, count: 0 };
    prev.total += r.amount ?? 0;
    prev.count += 1;
    bySource.set(st, prev);
  }
  return Array.from(bySource.entries())
    .map(([source_type, { total, count }]) => ({ source_type, total, count }))
    .sort((a, b) => b.total - a.total);
}

/** XP per source (laatste 30 dagen) voor Insights-pagina. */
export async function getXPBySourceLast30(): Promise<XPBySourceItem[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceStr = since.toISOString();
  const { data: rows } = await supabase
    .from("xp_events")
    .select("amount, source_type")
    .eq("user_id", user.id)
    .gte("created_at", sinceStr);
  const bySource = new Map<string, { total: number; count: number }>();
  for (const row of rows ?? []) {
    const r = row as { amount: number; source_type: string };
    const st = r.source_type ?? "other";
    const prev = bySource.get(st) ?? { total: 0, count: 0 };
    prev.total += r.amount ?? 0;
    prev.count += 1;
    bySource.set(st, prev);
  }
  return Array.from(bySource.entries())
    .map(([source_type, { total, count }]) => ({ source_type, total, count }))
    .sort((a, b) => b.total - a.total);
}

const dayNamesShort = ["Zo", "Ma", "Di", "Wo", "Do", "Vr", "Za"];

function buildGraphDataFromByDate(
  byDate: Map<string, { xp: number; missionsCompleted: number; energySum: number; energyN: number; focusSum: number; focusN: number }>,
  dates: string[]
): InsightGraphDay[] {
  return dates.map((dateStr, i) => {
    const e = byDate.get(dateStr);
    const d = new Date(dateStr + "Z");
    const name = `${dayNamesShort[d.getUTCDay()]} ${dateStr.slice(8)}`;
    let streak = 0;
    for (let j = i; j >= 0; j--) {
      if ((byDate.get(dates[j])?.xp ?? 0) > 0) streak++;
      else break;
    }
    return {
      date: dateStr,
      name,
      xp: e?.xp ?? 0,
      energy: e && e.energyN > 0 ? e.energySum / e.energyN : null,
      focus: e && e.focusN > 0 ? e.focusSum / e.focusN : null,
      streak,
      streakActive: streak > 0,
    };
  });
}

/** Laatste 30 dagen: grafiekdata + totalen voor Insights. */
export async function getGraphData30Days(): Promise<{
  graphData30: InsightGraphDay[];
  xpLast30: number;
  missionsLast7: number;
  missionsLast30: number;
  weeklyTotals: { weekLabel: string; xp: number; missions: number }[];
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const empty = {
    graphData30: [],
    xpLast30: 0,
    missionsLast7: 0,
    missionsLast30: 0,
    weeklyTotals: [],
  };
  if (!user) return empty;
  const today = new Date().toISOString().slice(0, 10);
  const byDate = await loadDailyMetrics(supabase, user.id, today, 30);
  const dates = Array.from(byDate.keys()).sort();
  const graphData30 = buildGraphDataFromByDate(byDate, dates);
  let xpLast30 = 0;
  let missionsLast30 = 0;
  let missionsLast7 = 0;
  for (const d of dates) {
    const e = byDate.get(d);
    xpLast30 += e?.xp ?? 0;
    missionsLast30 += (e?.missionsCompleted ?? 0);
  }
  const last7 = dates.slice(-7);
  for (const d of last7) {
    missionsLast7 += byDate.get(d)?.missionsCompleted ?? 0;
  }
  const weekStarts = new Map<string, { xp: number; missions: number }>();
  for (const dateStr of dates) {
    const d = new Date(dateStr + "Z");
    const ms = d.getTime() - d.getUTCDay() * 24 * 60 * 60 * 1000;
    const weekStart = new Date(ms).toISOString().slice(0, 10);
    const cur = weekStarts.get(weekStart) ?? { xp: 0, missions: 0 };
    const e = byDate.get(dateStr);
    cur.xp += e?.xp ?? 0;
    cur.missions += e?.missionsCompleted ?? 0;
    weekStarts.set(weekStart, cur);
  }
  const weeklyTotals = Array.from(weekStarts.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-4)
    .map(([weekStart, v]) => ({
      weekLabel: `${weekStart.slice(8)}/${weekStart.slice(5, 7)}`,
      xp: v.xp,
      missions: v.missions,
    }));
  return { graphData30, xpLast30, missionsLast7, missionsLast30, weeklyTotals };
}

/** Best time of day (heatmap per hour): completions per hour 0–23 (last 30 days). */
export async function getBestHourHeatmap(): Promise<{ hour: number; count: number }[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceStr = since.toISOString().slice(0, 10);
  const { data: events } = await supabase
    .from("task_events")
    .select("occurred_at")
    .eq("user_id", user.id)
    .eq("event_type", "complete")
    .gte("occurred_at", sinceStr);
  const byHour = new Array(24).fill(0);
  for (const e of events ?? []) {
    const at = (e as { occurred_at: string }).occurred_at;
    const h = new Date(at).getUTCHours();
    if (h >= 0 && h < 24) byHour[h]++;
  }
  return byHour.map((count, hour) => ({ hour, count }));
}

/** Consistency map: last 30 days with execution score 0–100 (green/yellow/red). Uses user_analytics_daily + task completions so actieve dagen altijd een score hebben. */
export async function getConsistencyMap(): Promise<{ date: string; score: number }[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  const startStr = start.toISOString().slice(0, 10);
  const endStr = end.toISOString().slice(0, 10);

  const [analyticsRes, tasksRes] = await Promise.all([
    supabase
      .from("user_analytics_daily")
      .select("date, xp_earned, missions_completed")
      .eq("user_id", user.id)
      .gte("date", startStr)
      .lte("date", endStr)
      .order("date", { ascending: true }),
    supabase
      .from("tasks")
      .select("completed_at")
      .eq("user_id", user.id)
      .eq("completed", true)
      .not("completed_at", "is", null)
      .gte("completed_at", startStr + "T00:00:00")
      .lte("completed_at", endStr + "T23:59:59.999"),
  ]);

  const byDate = new Map<string, number>();
  for (let d = new Date(startStr); d <= new Date(endStr); d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().slice(0, 10);
    byDate.set(dateStr, 0);
  }
  for (const r of analyticsRes.data ?? []) {
    const rawDate = (r as { date: string }).date;
    const dateKey = rawDate ? String(rawDate).slice(0, 10) : null;
    if (!dateKey || !byDate.has(dateKey)) continue;
    const xp = (r as { xp_earned?: number }).xp_earned ?? 0;
    const missions = (r as { missions_completed?: number }).missions_completed ?? 0;
    const score = Math.min(100, Math.round((xp / 20) * 30 + missions * 20));
    byDate.set(dateKey, Math.min(100, (byDate.get(dateKey) ?? 0) + score));
  }
  for (const r of (tasksRes.data ?? []) as { completed_at: string }[]) {
    if (r.completed_at) {
      const date = r.completed_at.slice(0, 10);
      const current = byDate.get(date) ?? 0;
      if (current < 30) byDate.set(date, 30);
    }
  }
  return Array.from(byDate.entries()).map(([date, score]) => ({ date, score: Math.min(100, score) }));
}

/** Drop-off pattern: wanneer afhaken (dag 3 streak, moeilijke missies, etc.). */
export async function getDropOffPattern(): Promise<{
  message: string | null;
  dropAtStreakDay: number | null;
  difficultMissionDropRate: number | null;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const empty = { message: null, dropAtStreakDay: null, difficultMissionDropRate: null };
  if (!user) return empty;
  const since = new Date();
  since.setDate(since.getDate() - 60);
  const sinceStr = since.toISOString().slice(0, 10);

  const { data: events } = await supabase
    .from("task_events")
    .select("task_id, event_type, occurred_at")
    .eq("user_id", user.id)
    .in("event_type", ["start", "complete", "abandon"])
    .gte("occurred_at", sinceStr)
    .order("occurred_at", { ascending: true });
  if (!events?.length) return empty;

  const taskIds = [...new Set((events as { task_id: string }[]).map((e) => e.task_id))];
  const { data: tasks } = taskIds.length
    ? await supabase.from("tasks").select("id, cognitive_load, energy_required").in("id", taskIds)
    : { data: [] };
  const taskMap = new Map((tasks ?? []).map((t: { id: string; cognitive_load?: number | null; energy_required?: number | null }) => [t.id, t]));
  const difficult = (t: { cognitive_load?: number | null; energy_required?: number | null } | undefined) =>
    (t?.cognitive_load ?? 0.5) >= 0.7 || (t?.energy_required ?? 5) >= 7;

  const byStreakDay: Record<number, { start: number; complete: number }> = {};
  const difficultStarts: number[] = [];
  const difficultCompletes: number[] = [];
  let streak = 0;
  let lastDate = "";
  for (const e of events as { task_id: string; event_type: string; occurred_at: string }[]) {
    const date = e.occurred_at.slice(0, 10);
    if (date !== lastDate) {
      lastDate = date;
      streak++;
    }
    if (!byStreakDay[streak]) byStreakDay[streak] = { start: 0, complete: 0 };
    const t = taskMap.get(e.task_id);
    if (e.event_type === "start") {
      byStreakDay[streak].start++;
      if (difficult(t)) difficultStarts.push(1);
    }
    if (e.event_type === "complete") {
      byStreakDay[streak].complete++;
      if (difficult(t)) difficultCompletes.push(1);
    }
  }
  let dropAtStreakDay: number | null = null;
  for (let day = 1; day <= 7; day++) {
    const d = byStreakDay[day];
    if (d && d.start > 0 && d.complete / d.start < 0.5) {
      dropAtStreakDay = day;
      break;
    }
  }
  const difficultTotal = difficultStarts.length;
  const difficultDone = difficultCompletes.length;
  const difficultMissionDropRate = difficultTotal > 0 ? 1 - difficultDone / difficultTotal : null;
  let message: string | null = null;
  if (dropAtStreakDay != null) message = `Je haakt vaak af rond dag ${dropAtStreakDay} van een streak.`;
  else if (difficultMissionDropRate != null && difficultMissionDropRate >= 0.4)
    message = `Moeilijke missies worden ${Math.round(difficultMissionDropRate * 100)}% vaker niet afgerond.`;
  return { message, dropAtStreakDay, difficultMissionDropRate };
}

/** Correlation Insight Engine: "Wanneer energie <40, productiviteit -27%". */
export async function getCorrelationInsights(): Promise<{ sentence: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { sentence: null };
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceStr = since.toISOString().slice(0, 10);

  const { data: daily } = await supabase
    .from("daily_state")
    .select("date, energy")
    .eq("user_id", user.id)
    .gte("date", sinceStr);
  const { data: events } = await supabase
    .from("task_events")
    .select("occurred_at, event_type")
    .eq("user_id", user.id)
    .in("event_type", ["complete", "start"])
    .gte("occurred_at", sinceStr);
  const energyByDate = new Map<string, number>();
  for (const r of daily ?? []) {
    const e = (r as { energy?: number | null }).energy;
    if (e != null) energyByDate.set((r as { date: string }).date, Number(e));
  }
  const lowEnergyDates = new Set<string>();
  const highEnergyDates = new Set<string>();
  for (const [date, e] of energyByDate) {
    if (e < 4) lowEnergyDates.add(date);
    if (e >= 6) highEnergyDates.add(date);
  }
  let lowCompletes = 0;
  let lowStarts = 0;
  let highCompletes = 0;
  let highStarts = 0;
  for (const e of events as { occurred_at: string; event_type: string }[]) {
    const date = e.occurred_at.slice(0, 10);
    if (lowEnergyDates.has(date)) {
      if (e.event_type === "start") lowStarts++;
      if (e.event_type === "complete") lowCompletes++;
    }
    if (highEnergyDates.has(date)) {
      if (e.event_type === "start") highStarts++;
      if (e.event_type === "complete") highCompletes++;
    }
  }
  const lowRate = lowStarts > 0 ? lowCompletes / lowStarts : 0.5;
  const highRate = highStarts > 0 ? highCompletes / highStarts : 0.5;
  const pctDiff = highRate > 0 ? Math.round(((lowRate - highRate) / highRate) * 100) : 0;
  const sentence =
    pctDiff < -15
      ? `Wanneer energie laag is (&lt;4), productiviteit ${Math.abs(pctDiff)}% lager.`
      : pctDiff > 15
        ? `Bij hoge energie presteer je ${pctDiff}% beter.`
        : null;
  return { sentence };
}

/** Strength vs Weakness per domain (for radar). 4 domains: discipline, health, learning, business. */
export async function getStrengthWeaknessRadar(): Promise<{ domain: string; score: number }[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const domains = ["discipline", "health", "learning", "business"];
  if (!user) return domains.map((d) => ({ domain: d, score: 50 }));

  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceStr = since.toISOString().slice(0, 10);
  const { data: events } = await supabase
    .from("task_events")
    .select("task_id, event_type")
    .eq("user_id", user.id)
    .in("event_type", ["start", "complete"])
    .gte("occurred_at", sinceStr);
  const taskIds = [...new Set((events ?? []).map((e: { task_id: string }) => e.task_id))];
  const { data: tasks } = taskIds.length
    ? await supabase.from("tasks").select("id, domain").in("id", taskIds)
    : { data: [] };
  const domainByTask = new Map((tasks ?? []).map((t: { id: string; domain?: string | null }) => [t.id, t.domain ?? "other"]));
  const byDomain: Record<string, { start: number; complete: number }> = {};
  for (const d of domains) byDomain[d] = { start: 0, complete: 0 };
  for (const e of events as { task_id: string; event_type: string }[]) {
    const d = domainByTask.get(e.task_id) ?? "other";
    if (domains.includes(d)) {
      if (e.event_type === "start") byDomain[d].start++;
      if (e.event_type === "complete") byDomain[d].complete++;
    }
  }
  return domains.map((domain) => {
    const x = byDomain[domain];
    const rate = x.start > 0 ? x.complete / x.start : 0.5;
    return { domain, score: Math.round(rate * 100) };
  });
}

/** Comparative Intelligence: "14% consistenter dan vorige maand". */
export async function getComparativeIntelligence(): Promise<{ sentence: string | null }> {
  const consistency = await getConsistencyMap();
  if (consistency.length < 14) return { sentence: null };
  const thisMonth = consistency.slice(-14);
  const prevMonth = consistency.slice(-28, -14);
  const thisAvg = thisMonth.reduce((s, d) => s + d.score, 0) / thisMonth.length;
  const prevAvg = prevMonth.reduce((s, d) => s + d.score, 0) / prevMonth.length;
  if (prevAvg === 0) return { sentence: null };
  const pct = Math.round(((thisAvg - prevAvg) / prevAvg) * 100);
  const sentence = pct >= 5 ? `${pct}% consistenter dan vorige periode.` : pct <= -5 ? `${Math.abs(pct)}% minder consistent.` : null;
  return { sentence };
}

/** Friction: "Je aarzelt 40% langer bij moeilijke missies" (view→start time). */
export async function getFriction40Insight(): Promise<{ sentence: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { sentence: null };
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceStr = since.toISOString().slice(0, 10);

  const { data: events } = await supabase
    .from("task_events")
    .select("task_id, event_type, occurred_at")
    .eq("user_id", user.id)
    .in("event_type", ["view", "start"])
    .gte("occurred_at", sinceStr)
    .order("occurred_at", { ascending: true });
  const taskIds = [...new Set((events ?? []).map((e: { task_id: string }) => e.task_id))];
  const { data: tasks } = taskIds.length
    ? await supabase.from("tasks").select("id, cognitive_load, emotional_resistance").in("id", taskIds)
    : { data: [] };
  const taskMap = new Map((tasks ?? []).map((t: { id: string; cognitive_load?: number | null; emotional_resistance?: number | null }) => [t.id, t]));
  const difficult = (t: { cognitive_load?: number | null; emotional_resistance?: number | null } | undefined) =>
    (t?.cognitive_load ?? 0.5) >= 0.7 || (t?.emotional_resistance ?? 0.5) >= 0.6;

  const viewByTask = new Map<string, string>();
  const delays: { easy: number[]; hard: number[] } = { easy: [], hard: [] };
  for (const e of events as { task_id: string; event_type: string; occurred_at: string }[]) {
    if (e.event_type === "view") viewByTask.set(e.task_id, e.occurred_at);
    if (e.event_type === "start") {
      const viewAt = viewByTask.get(e.task_id);
      if (viewAt) {
        const sec = (new Date(e.occurred_at).getTime() - new Date(viewAt).getTime()) / 1000;
        const t = taskMap.get(e.task_id);
        if (difficult(t)) delays.hard.push(sec);
        else delays.easy.push(sec);
      }
    }
  }
  const avgEasy = delays.easy.length ? delays.easy.reduce((a, b) => a + b, 0) / delays.easy.length : 0;
  const avgHard = delays.hard.length ? delays.hard.reduce((a, b) => a + b, 0) / delays.hard.length : 0;
  if (avgEasy === 0 || avgHard < avgEasy * 1.2) return { sentence: null };
  const pct = Math.round(((avgHard - avgEasy) / avgEasy) * 100);
  return { sentence: `Je aarzelt ${Math.min(99, pct)}% langer bij moeilijke missies.` };
}

/** Fase 3: recente voltooiingen met performance rank voor rapport/geschiedenis. */
export type RecentCompletionWithRank = {
  label: string;
  date: string;
  occurredAt: string;
  rank: "S" | "A" | "B" | "C" | null;
  score: number | null;
  type: "task" | "mission";
};

export async function getRecentCompletionsWithRank(limit = 20): Promise<RecentCompletionWithRank[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceStr = since.toISOString().slice(0, 10);

  const { data: taskEvents } = await supabase
    .from("task_events")
    .select("task_id, occurred_at, performance_rank, performance_score")
    .eq("user_id", user.id)
    .eq("event_type", "complete")
    .gte("occurred_at", sinceStr)
    .order("occurred_at", { ascending: false })
    .limit(limit);

  const taskIds = [...new Set((taskEvents ?? []).map((e: { task_id: string }) => e.task_id))];
  const { data: tasks } = taskIds.length
    ? await supabase.from("tasks").select("id, title").in("id", taskIds)
    : { data: [] };
  const taskTitles = new Map((tasks ?? []).map((t: { id: string; title?: string | null }) => [t.id, t.title ?? "Taak"]));

  const { data: behaviourRows } = await supabase
    .from("behaviour_log")
    .select("date, mission_completed_at, performance_rank, performance_score")
    .eq("user_id", user.id)
    .not("performance_rank", "is", null)
    .gte("date", sinceStr)
    .order("date", { ascending: false })
    .limit(10);

  const out: RecentCompletionWithRank[] = [];

  for (const e of taskEvents ?? []) {
    const ev = e as { task_id: string; occurred_at: string; performance_rank?: string | null; performance_score?: number | null };
    out.push({
      label: taskTitles.get(ev.task_id) ?? "Taak",
      date: ev.occurred_at.slice(0, 10),
      occurredAt: ev.occurred_at,
      rank: (ev.performance_rank === "S" || ev.performance_rank === "A" || ev.performance_rank === "B" || ev.performance_rank === "C" ? ev.performance_rank : null) as "S" | "A" | "B" | "C" | null,
      score: ev.performance_score ?? null,
      type: "task",
    });
  }
  for (const row of behaviourRows ?? []) {
    const r = row as { date: string; mission_completed_at: string | null; performance_rank?: string | null; performance_score?: number | null };
    out.push({
      label: "DCIC-missie",
      date: r.date,
      occurredAt: r.mission_completed_at ?? r.date + "T12:00:00",
      rank: (r.performance_rank === "S" || r.performance_rank === "A" || r.performance_rank === "B" || r.performance_rank === "C" ? r.performance_rank : null) as "S" | "A" | "B" | "C" | null,
      score: r.performance_score ?? null,
      type: "mission",
    });
  }

  out.sort((a, b) => (b.occurredAt < a.occurredAt ? -1 : b.occurredAt > a.occurredAt ? 1 : 0));
  return out.slice(0, limit);
}
