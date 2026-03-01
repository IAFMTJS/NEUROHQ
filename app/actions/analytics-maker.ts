"use server";

import { createClient } from "@/lib/supabase/server";

export type MakerWeeklyStats = {
  weekStart: string;
  weekEnd: string;
  xpAvg: number;
  missionsAvg: number;
  energyAvg: number | null;
  focusAvg: number | null;
  forcedConfrontations: number;
  minimalIntegrityMissions: number;
};

function startOfWeekUtc(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay(); // 0 (Sun) – 6 (Sat)
  const diffToMonday = (day + 6) % 7; // Monday = 0
  d.setUTCDate(d.getUTCDate() - diffToMonday);
  return d.toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

type AnalyticsDailyRow = {
  date: string;
  xp_earned?: number | null;
  missions_completed?: number | null;
  energy_avg?: number | null;
  focus_avg?: number | null;
};

type MakerWeekBucket = {
  xpTotal: number;
  xpCount: number;
  missionsTotal: number;
  missionsCount: number;
  energySum: number;
  energyCount: number;
  focusSum: number;
  focusCount: number;
  forced: number;
  minimal: number;
};

function createEmptyBucket(): MakerWeekBucket {
  return {
    xpTotal: 0,
    xpCount: 0,
    missionsTotal: 0,
    missionsCount: 0,
    energySum: 0,
    energyCount: 0,
    focusSum: 0,
    focusCount: 0,
    forced: 0,
    minimal: 0,
  };
}

/**
 * Admin-only weekly maker stats:
 * - Averages per week: xp_earned, missions_completed, energy_avg, focus_avg.
 * - Counts per week: forced confrontations, Minimal Integrity missions.
 */
export async function getMakerWeeklyStats(weeks: number = 8): Promise<MakerWeeklyStats[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: userRow } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = (userRow as { role?: string | null } | null)?.role ?? "user";
  if (role !== "admin") {
    return [];
  }

  const today = new Date();
  const since = new Date(today);
  since.setUTCDate(since.getUTCDate() - weeks * 7);
  const sinceDate = since.toISOString().slice(0, 10);
  const sinceDateTime = since.toISOString();

  const [analyticsRows, eventRows] = await Promise.all([
    supabase
      .from("user_analytics_daily")
      .select("date, xp_earned, missions_completed, energy_avg, focus_avg")
      .gte("date", sinceDate),
    supabase
      .from("analytics_events")
      .select("event_name, created_at")
      .in("event_name", ["forced_confrontation", "minimal_integrity_created"])
      .gte("created_at", sinceDateTime),
  ]);

  const byWeek = new Map<string, MakerWeekBucket>();

  for (const row of (analyticsRows.data ?? []) as AnalyticsDailyRow[]) {
    const date = new Date(row.date + "T00:00:00Z");
    const weekStart = startOfWeekUtc(date);
    const bucket = byWeek.get(weekStart) ?? createEmptyBucket();

    if (typeof row.xp_earned === "number") {
      bucket.xpTotal += row.xp_earned;
      bucket.xpCount += 1;
    }
    if (typeof row.missions_completed === "number") {
      bucket.missionsTotal += row.missions_completed;
      bucket.missionsCount += 1;
    }
    if (typeof row.energy_avg === "number") {
      bucket.energySum += row.energy_avg;
      bucket.energyCount += 1;
    }
    if (typeof row.focus_avg === "number") {
      bucket.focusSum += row.focus_avg;
      bucket.focusCount += 1;
    }

    byWeek.set(weekStart, bucket);
  }

  for (const ev of (eventRows.data ?? []) as { event_name: string; created_at: string }[]) {
    const eventDate = new Date(ev.created_at);
    const weekStart = startOfWeekUtc(eventDate);
    const bucket = byWeek.get(weekStart) ?? createEmptyBucket();

    if (ev.event_name === "forced_confrontation") {
      bucket.forced += 1;
    } else if (ev.event_name === "minimal_integrity_created") {
      bucket.minimal += 1;
    }

    byWeek.set(weekStart, bucket);
  }

  const weeksSorted = Array.from(byWeek.keys()).sort();

  return weeksSorted.map((weekStart) => {
    const bucket = byWeek.get(weekStart) ?? createEmptyBucket();

    const xpAvg =
      bucket.xpCount > 0 ? Math.round((bucket.xpTotal / bucket.xpCount) * 10) / 10 : 0;
    const missionsAvg =
      bucket.missionsCount > 0
        ? Math.round((bucket.missionsTotal / bucket.missionsCount) * 10) / 10
        : 0;
    const energyAvg =
      bucket.energyCount > 0
        ? Math.round((bucket.energySum / bucket.energyCount) * 10) / 10
        : null;
    const focusAvg =
      bucket.focusCount > 0
        ? Math.round((bucket.focusSum / bucket.focusCount) * 10) / 10
        : null;

    return {
      weekStart,
      weekEnd: addDays(weekStart, 6),
      xpAvg,
      missionsAvg,
      energyAvg,
      focusAvg,
      forcedConfrontations: bucket.forced,
      minimalIntegrityMissions: bucket.minimal,
    };
  });
}

