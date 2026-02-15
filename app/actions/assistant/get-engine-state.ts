"use server";

import { createClient } from "@/lib/supabase/server";
import type { EngineState } from "@/lib/assistant/types";

/** Build engine state from DB (daily_state, tasks, analytics, strategy, identity_events). MVP: simplified formulas. */
export async function getEngineState(userId: string): Promise<EngineState> {
  const supabase = await createClient();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const fromDate = thirtyDaysAgo.toISOString().slice(0, 10);

  const [
    { data: checkins },
    { data: tasks },
    { data: analytics },
    { data: strategy },
    { data: overrideEvents },
  ] = await Promise.all([
    supabase
      .from("daily_state")
      .select("energy, focus, sensory_load, sleep_hours, date")
      .eq("user_id", userId)
      .gte("date", fromDate)
      .order("date", { ascending: false })
      .limit(31),
    supabase
      .from("tasks")
      .select("completed, due_date, carry_over_count")
      .eq("user_id", userId)
      .gte("due_date", fromDate)
      .limit(200),
    supabase
      .from("user_analytics_daily")
      .select("date, tasks_completed, tasks_planned, carry_over_count, brain_status_logged")
      .eq("user_id", userId)
      .gte("date", fromDate)
      .order("date", { ascending: false })
      .limit(31),
    supabase
      .from("quarterly_strategy")
      .select("primary_theme, identity_statement")
      .eq("user_id", userId)
      .order("year", { ascending: false })
      .order("quarter", { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from("identity_events")
      .select("id")
      .eq("user_id", userId)
      .eq("type", "override")
      .gte("created_at", thirtyDaysAgo.toISOString()),
  ]);

  const checkinList = (checkins ?? []) as {
    energy?: number | null;
    focus?: number | null;
    sensory_load?: number | null;
    sleep_hours?: number | null;
    date: string;
  }[];
  const taskList = (tasks ?? []) as {
    completed: boolean;
    due_date: string | null;
    carry_over_count?: number;
  }[];
  const analyticsList = (analytics ?? []) as {
    date: string;
    tasks_completed: number;
    tasks_planned: number;
    carry_over_count: number;
    brain_status_logged: boolean;
  }[];

  const daysActive = analyticsList.filter(
    (a) => a.brain_status_logged || a.tasks_completed > 0 || a.tasks_planned > 0
  ).length;

  const totalPlanned = analyticsList.reduce((s, a) => s + a.tasks_planned, 0);
  const totalCompleted = analyticsList.reduce((s, a) => s + a.tasks_completed, 0);
  const completionRate =
    totalPlanned > 0 ? totalCompleted / totalPlanned : 1;
  const avoidanceTrend = Math.max(0, Math.min(1, 1 - completionRate));

  const avgCarryOver =
    analyticsList.length > 0
      ? analyticsList.reduce((s, a) => s + a.carry_over_count, 0) /
        analyticsList.length
      : 0;

  const energies = checkinList
    .map((c) => c.energy)
    .filter((e): e is number => typeof e === "number" && e >= 1 && e <= 10);
  const energy =
    energies.length > 0
      ? Math.round(
          energies.reduce((a, b) => a + b, 0) / energies.length
        )
      : 5;
  const focuses = checkinList
    .map((c) => c.focus)
    .filter((f): f is number => typeof f === "number" && f >= 1 && f <= 10);
  const focus =
    focuses.length > 0
      ? Math.round(focuses.reduce((a, b) => a + b, 0) / focuses.length)
      : 5;
  const loads = checkinList
    .map((c) => c.sensory_load)
    .filter((l): l is number => typeof l === "number" && l >= 1 && l <= 10);
  const sensoryLoad =
    loads.length > 0
      ? Math.round(loads.reduce((a, b) => a + b, 0) / loads.length)
      : 5;
  const sleeps = checkinList
    .map((c) => c.sleep_hours)
    .filter((s): s is number => typeof s === "number" && s >= 0 && s <= 24);
  const sleepHours =
    sleeps.length > 0
      ? Math.round((sleeps.reduce((a, b) => a + b, 0) / sleeps.length) * 10) / 10
      : 7;

  const overrideCount = (overrideEvents ?? []).length;
  const checkInConsistency =
    daysActive > 0 ? Math.min(100, (daysActive / 30) * 100) : 50;
  const stabilityIndex = Math.max(
    0,
    Math.min(100, checkInConsistency - overrideCount * 5)
  );

  const identityAlignmentScore = strategy
    ? Math.max(0, Math.min(100, 30 + completionRate * 40))
    : 50;

  return {
    energy,
    focus: focus,
    sensoryLoad,
    sleepHours,
    carryOverLevel: Math.round(avgCarryOver),
    avoidanceTrend: Math.round(avoidanceTrend * 100) / 100,
    identityAlignmentScore: Math.round(identityAlignmentScore),
    stabilityIndex: Math.round(stabilityIndex),
    courageGapScore: 0,
    defensiveIdentityProbability: 0,
    daysActive,
    crisis: false,
    progress: totalCompleted * 5,
    intensityTier: 1,
  };
}

/** Get assistant feature flags for user; create row with defaults if missing. */
export async function getAssistantFeatureFlags(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("assistant_feature_flags")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (data)
    return {
      confrontationLevel: (data as { confrontation_level: string })
        .confrontation_level,
      identityIntervention: (data as { identity_intervention: boolean })
        .identity_intervention,
      defensiveIdentityDetection: (data as { defensive_identity_detection: boolean })
        .defensive_identity_detection,
      courageAttribution: (data as { courage_attribution: boolean })
        .courage_attribution,
      energyFactCheck: (data as { energy_fact_check: boolean })
        .energy_fact_check,
    };

  return {
    confrontationLevel: "adaptive",
    identityIntervention: false,
    defensiveIdentityDetection: false,
    courageAttribution: false,
    energyFactCheck: true,
  };
}
