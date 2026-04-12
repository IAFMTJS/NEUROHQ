"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { computeBrainCompositePctFromDailyState } from "@/lib/user-analytics-brain-snapshot";

export type DailyAnalyticsRow = {
  date: string;
  active_seconds: number;
  tasks_completed: number;
  tasks_planned: number;
  learning_minutes: number;
  brain_status_logged: boolean;
  carry_over_count: number;
};

export type WeekSummary = {
  weekStart: string;
  weekEnd: string;
  daysWithCheckIn: number;
  daysWithTaskComplete: number;
  totalTasksCompleted: number;
  totalTasksPlanned: number;
  totalLearningMinutes: number;
  learningTargetMinutes: number;
  activeSeconds: number;
  avgEnergy: number | null;
  avgFocus: number | null;
  avgLoad: number | null;
};

/** Get or create user_analytics_daily row for a date and return it. */
async function getOrCreateDailyRow(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  date: string
): Promise<DailyAnalyticsRow | null> {
  const { data } = await supabase
    .from("user_analytics_daily")
    .select("date, active_seconds, tasks_completed, tasks_planned, learning_minutes, brain_status_logged, carry_over_count")
    .eq("user_id", userId)
    .eq("date", date)
    .single();
  if (data) return data as DailyAnalyticsRow;
  const { error } = await supabase.from("user_analytics_daily").insert({
    user_id: userId,
    date,
    active_seconds: 0,
    tasks_completed: 0,
    tasks_planned: 0,
    learning_minutes: 0,
    brain_status_logged: false,
    carry_over_count: 0,
  });
  return error ? null : { date, active_seconds: 0, tasks_completed: 0, tasks_planned: 0, learning_minutes: 0, brain_status_logged: false, carry_over_count: 0 };
}

/** Record XP and +1 mission completed for a date (called when user completes a task). Preserves existing xp_earned/missions_completed for that day. */
export async function recordDailyXPAndMissions(date: string, xpAmount: number): Promise<void> {
  if (xpAmount <= 0) return;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: existing } = await supabase
    .from("user_analytics_daily")
    .select("xp_earned, missions_completed")
    .eq("user_id", user.id)
    .eq("date", date)
    .single();

  const currentXp = (existing?.xp_earned as number | undefined) ?? 0;
  const currentMissions = (existing?.missions_completed as number | undefined) ?? 0;

  await supabase.from("user_analytics_daily").upsert(
    {
      user_id: user.id,
      date,
      xp_earned: currentXp + xpAmount,
      missions_completed: currentMissions + 1,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,date" }
  );
}

/** Recompute and upsert user_analytics_daily for a given date from tasks, learning_sessions, daily_state. Preserves xp_earned and missions_completed (set by recordDailyXPAndMissions); sets energy_avg/focus_avg from daily_state. */
export async function upsertDailyAnalytics(date: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const [tasksRes, learningRes, stateRes, existingRes] = await Promise.all([
    supabase.from("tasks").select("completed, completed_at, due_date").eq("user_id", user.id).eq("due_date", date).is("deleted_at", null),
    supabase.from("learning_sessions").select("minutes").eq("user_id", user.id).eq("date", date),
    supabase
      .from("daily_state")
      .select(
        "energy, focus, sensory_load, mental_battery, physical_health, load, sleep_hours, is_rest_day, emotional_state, dcic_overdrive_trigger_reason"
      )
      .eq("user_id", user.id)
      .eq("date", date)
      .single(),
    supabase
      .from("user_analytics_daily")
      .select("active_seconds, carry_over_count, xp_earned, missions_completed, dcic_overdrive_weekly_slot")
      .eq("user_id", user.id)
      .eq("date", date)
      .single(),
  ]);

  const tasks = (tasksRes.data ?? []) as { completed: boolean; completed_at: string | null; due_date: string }[];
  const completed = tasks.filter((t) => t.completed).length;
  const planned = tasks.length;
  const learningMinutes = (learningRes.data ?? []).reduce((sum: number, r: { minutes?: number }) => sum + (r.minutes ?? 0), 0);
  const state = stateRes.data as {
    energy?: number | null;
    focus?: number | null;
    sensory_load?: number | null;
    mental_battery?: number | null;
    physical_health?: number | null;
    load?: number | null;
    sleep_hours?: number | null;
    is_rest_day?: boolean | null;
    emotional_state?: string | null;
    dcic_overdrive_trigger_reason?: string | null;
  } | null;
  const brainStatusLogged = !!(state && state.energy != null);

  const existing = existingRes.data as {
    active_seconds?: number;
    carry_over_count?: number;
    xp_earned?: number;
    missions_completed?: number;
    dcic_overdrive_weekly_slot?: boolean | null;
  } | null;
  const carryOver = existing?.carry_over_count ?? 0;
  const activeSeconds = existing?.active_seconds ?? 0;
  const xpEarned = existing?.xp_earned ?? 0;
  const missionsCompleted = existing?.missions_completed ?? 0;

  const energyAvg = state?.energy != null ? Number(state.energy) : null;
  const focusAvg = state?.focus != null ? Number(state.focus) : null;
  const sensoryAvg = state?.sensory_load != null ? Number(state.sensory_load) : null;
  const mentalBatteryAvg = state?.mental_battery != null ? Number(state.mental_battery) : null;
  const physicalHealthAvg = state?.physical_health != null ? Number(state.physical_health) : null;
  const loadAvg = state?.load != null ? Number(state.load) : null;
  const sleepHoursAvg = state?.sleep_hours != null ? Number(state.sleep_hours) : null;
  const brainCompositePct =
    state != null
      ? computeBrainCompositePctFromDailyState({
          user_id: user.id,
          date,
          energy: state.energy,
          focus: state.focus,
          sensory_load: state.sensory_load,
          mental_battery: state.mental_battery,
          physical_health: state.physical_health,
          load: state.load,
          sleep_hours: state.sleep_hours,
        })
      : null;

  await supabase.from("user_analytics_daily").upsert(
    {
      user_id: user.id,
      date,
      active_seconds: activeSeconds,
      tasks_completed: completed,
      tasks_planned: planned,
      learning_minutes: learningMinutes,
      brain_status_logged: brainStatusLogged,
      carry_over_count: carryOver,
      xp_earned: xpEarned,
      missions_completed: missionsCompleted,
      energy_avg: energyAvg,
      focus_avg: focusAvg,
      sensory_load_avg: sensoryAvg,
      mental_battery_avg: mentalBatteryAvg,
      physical_health_avg: physicalHealthAvg,
      load_avg: loadAvg,
      sleep_hours_avg: sleepHoursAvg,
      is_rest_day: state?.is_rest_day ?? null,
      emotional_state: state?.emotional_state ?? null,
      dcic_overdrive_weekly_slot:
        state?.dcic_overdrive_trigger_reason === "weekly_slot" ||
        existing?.dcic_overdrive_weekly_slot === true,
      brain_composite_pct: brainCompositePct,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,date" }
  );
  // Do not call revalidatePath here: this function may be invoked during page render
  // (e.g. dashboard). Revalidation is done in recordActiveSeconds and other user-triggered actions.
}

/** Record active seconds for today (client can call periodically). */
export async function recordActiveSeconds(seconds: number) {
  if (seconds <= 0) return;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const date = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("user_analytics_daily")
    .select("active_seconds")
    .eq("user_id", user.id)
    .eq("date", date)
    .single();
  const current = (data?.active_seconds as number | undefined) ?? 0;
  await supabase.from("user_analytics_daily").upsert(
    {
      user_id: user.id,
      date,
      active_seconds: current + seconds,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,date" }
  );
  revalidatePath("/dashboard");
  revalidatePath("/analytics");
}

/** Get daily analytics rows for a date range. */
export async function getAnalyticsRange(dateFrom: string, dateTo: string): Promise<DailyAnalyticsRow[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("user_analytics_daily")
    .select("date, active_seconds, tasks_completed, tasks_planned, learning_minutes, brain_status_logged, carry_over_count")
    .eq("user_id", user.id)
    .gte("date", dateFrom)
    .lte("date", dateTo)
    .order("date", { ascending: true });
  return (data ?? []) as DailyAnalyticsRow[];
}

/** Get week summary for "Your week" widget and analytics page. */
export async function getWeekSummary(weekStart: string, weekEnd: string, learningTargetMinutes: number): Promise<WeekSummary | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: analyticsRows } = await supabase
    .from("user_analytics_daily")
    .select(
      "date, active_seconds, tasks_completed, tasks_planned, learning_minutes, brain_status_logged, energy_avg, focus_avg, sensory_load_avg"
    )
    .eq("user_id", user.id)
    .gte("date", weekStart)
    .lte("date", weekEnd)
    .order("date", { ascending: true });

  const rows = (analyticsRows ?? []) as (DailyAnalyticsRow & {
    energy_avg?: number | null;
    focus_avg?: number | null;
    sensory_load_avg?: number | null;
  })[];

  let daysWithCheckIn = 0;
  let daysWithTaskComplete = 0;
  let totalTasksCompleted = 0;
  let totalTasksPlanned = 0;
  let totalLearningMinutes = 0;
  let activeSeconds = 0;
  let energySum = 0;
  let energyCount = 0;
  let focusSum = 0;
  let focusCount = 0;
  let loadSum = 0;
  let loadCount = 0;

  for (const r of rows) {
    if (r.brain_status_logged) daysWithCheckIn++;
    if (r.tasks_completed > 0) daysWithTaskComplete++;
    totalTasksCompleted += r.tasks_completed;
    totalTasksPlanned += r.tasks_planned;
    totalLearningMinutes += r.learning_minutes;
    activeSeconds += r.active_seconds;
    if (r.energy_avg != null) {
      energySum += r.energy_avg;
      energyCount++;
    }
    if (r.focus_avg != null) {
      focusSum += r.focus_avg;
      focusCount++;
    }
    if (r.sensory_load_avg != null) {
      loadSum += r.sensory_load_avg;
      loadCount++;
    }
  }

  return {
    weekStart,
    weekEnd,
    daysWithCheckIn,
    daysWithTaskComplete,
    totalTasksCompleted,
    totalTasksPlanned,
    totalLearningMinutes,
    learningTargetMinutes,
    activeSeconds,
    avgEnergy: energyCount ? Math.round((energySum / energyCount) * 10) / 10 : null,
    avgFocus: focusCount ? Math.round((focusSum / focusCount) * 10) / 10 : null,
    avgLoad: loadCount ? Math.round((loadSum / loadCount) * 10) / 10 : null,
  };
}

/** Funnel counts from task_events: view → start → complete (last 7 days). */
export async function getFunnelCountsLast7(): Promise<{ view: number; start: number; complete: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { view: 0, start: 0, complete: 0 };
  const since = new Date();
  since.setDate(since.getDate() - 7);
  const sinceStr = since.toISOString().slice(0, 10);
  const { data: events } = await supabase
    .from("task_events")
    .select("event_type")
    .eq("user_id", user.id)
    .gte("occurred_at", sinceStr);
  let view = 0, start = 0, complete = 0;
  for (const e of events ?? []) {
    const t = (e as { event_type: string }).event_type;
    if (t === "view") view++;
    else if (t === "start") start++;
    else if (t === "complete") complete++;
  }
  return { view, start, complete };
}
