"use server";

import { createClient } from "@/lib/supabase/server";
import {
  compute7DayPerformanceIndex,
  getAdaptiveModifiers,
  rankToNumeric,
  type Fase7PatternType,
} from "@/lib/weekly-performance";
import type { PerformanceRank } from "@/lib/performance-rank";

export interface WeeklyPerformanceSnapshot {
  performanceIndex: number;
  avgRankNumeric: number | null;
  consistencyDays: number;
  completionRate: number;
  difficultyMultiplier: number;
  rewardMultiplier: number;
  recoveryEmphasis: boolean;
  patterns: { type: Fase7PatternType; suggestion: string }[];
  weekStart: string;
  weekEnd: string;
}

/** Get week boundaries (Monday = start). */
function getWeekBounds(date: Date): { weekStart: string; weekEnd: string } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    weekStart: monday.toISOString().slice(0, 10),
    weekEnd: sunday.toISOString().slice(0, 10),
  };
}

/** Last 7 days: completion rate, avg rank (S=4..C=1), consistency (days with >=1 completion). */
export async function getWeeklyPerformanceSnapshot(): Promise<WeeklyPerformanceSnapshot | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const today = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const startStr = sevenDaysAgo.toISOString().slice(0, 10);

  const { data: taskEvents } = await supabase
    .from("task_events")
    .select("event_type, occurred_at, performance_rank")
    .eq("user_id", user.id)
    .gte("occurred_at", startStr + "T00:00:00Z");

  const { data: behaviourLog } = await supabase
    .from("behaviour_log")
    .select("date, mission_started_at, mission_completed_at, performance_rank")
    .eq("user_id", user.id)
    .gte("date", startStr)
    .lte("date", today);

  let started = 0;
  let completed = 0;
  const rankSums: number[] = [];
  const completionDates = new Set<string>();

  for (const row of taskEvents ?? []) {
    const r = row as { event_type: string; occurred_at?: string; performance_rank?: string | null };
    if (r.event_type === "start") started++;
    if (r.event_type === "complete") {
      completed++;
      if (r.occurred_at) completionDates.add(r.occurred_at.slice(0, 10));
      const num = rankToNumeric((r.performance_rank as PerformanceRank) ?? undefined);
      if (num != null) rankSums.push(num);
    }
  }

  for (const row of behaviourLog ?? []) {
    const r = row as {
      date: string;
      mission_started_at?: string | null;
      mission_completed_at?: string | null;
      performance_rank?: string | null;
    };
    if (r.mission_started_at != null) started++;
    if (r.mission_completed_at != null) {
      completed++;
      completionDates.add(r.date);
      const num = rankToNumeric((r.performance_rank as PerformanceRank) ?? undefined);
      if (num != null) rankSums.push(num);
    }
  }

  const completionRate = started > 0 ? completed / started : 0;
  const avgRankNumeric =
    rankSums.length > 0 ? rankSums.reduce((a, b) => a + b, 0) / rankSums.length : null;
  const consistencyDays = completionDates.size;

  const performanceIndex = compute7DayPerformanceIndex(
    completionRate,
    avgRankNumeric,
    consistencyDays
  );
  const modifiers = getAdaptiveModifiers(performanceIndex);

  const { weekStart, weekEnd } = getWeekBounds(new Date());

  await supabase.from("weekly_reports").upsert(
    {
      user_id: user.id,
      week_start: weekStart,
      week_end: weekEnd,
      missions_completed: completed,
      performance_index: performanceIndex,
      avg_rank_numeric: avgRankNumeric != null ? Math.round(avgRankNumeric * 100) / 100 : null,
      consistency_days: consistencyDays,
    } as import("@/types/database.types").TablesInsert<"weekly_reports">,
    { onConflict: "user_id,week_start" }
  );

  const patterns = await detectPatterns(supabase, user.id, startStr, today);
  for (const p of patterns) {
    await supabase.from("behavior_patterns").insert({
      user_id: user.id,
      pattern_type: p.type,
      suggestion: p.suggestion,
    });
  }

  return {
    performanceIndex,
    avgRankNumeric,
    consistencyDays,
    completionRate,
    ...modifiers,
    patterns,
    weekStart,
    weekEnd,
  };
}

async function detectPatterns(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  startStr: string,
  endStr: string
): Promise<{ type: Fase7PatternType; suggestion: string }[]> {
  const out: { type: Fase7PatternType; suggestion: string }[] = [];

  const { data: taskEvents } = await supabase
    .from("task_events")
    .select("event_type, occurred_at")
    .eq("user_id", userId)
    .gte("occurred_at", startStr + "T00:00:00Z")
    .lte("occurred_at", endStr + "T23:59:59Z");

  const mondayCompletions: number[] = [];
  const abandonCount = { count: 0 };

  for (const row of taskEvents ?? []) {
    const r = row as { event_type: string; occurred_at?: string };
    const dateStr = r.occurred_at?.slice(0, 10);
    if (dateStr) {
      const d = new Date(dateStr + "Z");
      if (d.getUTCDay() === 1 && r.event_type === "complete") mondayCompletions.push(1);
    }
    if (r.event_type === "abandon") abandonCount.count++;
  }

  if (mondayCompletions.length === 0) {
    const mondaysInRange = countMondays(startStr, endStr);
    if (mondaysInRange >= 2) {
      out.push({
        type: "monday_avoidance",
        suggestion: "Try one small win on Monday to break the week in gently.",
      });
    }
  }

  if (abandonCount.count >= 5) {
    out.push({
      type: "cancels_above_threshold",
      suggestion: "You have more cancels than usual. Pick fewer, higher-priority missions.",
    });
  }

  return out;
}

function countMondays(startStr: string, endStr: string): number {
  let count = 0;
  const start = new Date(startStr + "Z");
  const end = new Date(endStr + "Z");
  const d = new Date(start);
  while (d <= end) {
    if (d.getUTCDay() === 1) count++;
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return count;
}

/** For use in XP/difficulty: get current 7-day modifiers without writing. */
export async function getAdaptiveModifiersForUser(): Promise<{
  difficultyMultiplier: number;
  rewardMultiplier: number;
  recoveryEmphasis: boolean;
}> {
  const snap = await getWeeklyPerformanceSnapshot();
  if (!snap) return { difficultyMultiplier: 1, rewardMultiplier: 1, recoveryEmphasis: false };
  return {
    difficultyMultiplier: snap.difficultyMultiplier,
    rewardMultiplier: snap.rewardMultiplier,
    recoveryEmphasis: snap.recoveryEmphasis,
  };
}
