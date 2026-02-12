"use server";

import { createClient } from "@/lib/supabase/server";

/** Default capacity when no brain status (daily_state) exists. */
const DEFAULT_CAPACITY = 100;
/** Cost per task = energy_required (1–10) × this. Average task (5) = 30 → 3 tasks = 90%, 10% buffer. */
const TASK_COST_MULTIPLIER = 6;
/** Energy units per "suggested task slot" so capacity = suggestedTaskCount * UNITS_PER_TASK (capped at 100). */
const UNITS_PER_TASK = 33;

type DailyStateRow = {
  energy: number | null;
  focus: number | null;
  sensory_load: number | null;
  sleep_hours: number | null;
  social_load: number | null;
} | null;

/**
 * Brain status (daily_state) suggests how many tasks you can do today.
 * That drives energy budget capacity. When brain status is updated and the page refreshes, capacity recalculates.
 */
function capacityFromDailyState(state: DailyStateRow): { capacity: number; suggestedTaskCount: number } {
  if (!state) {
    return { capacity: DEFAULT_CAPACITY, suggestedTaskCount: 3 };
  }
  const energy = state.energy ?? 5;
  const focus = state.focus ?? 5;
  const load = state.sensory_load ?? 5;
  const social = state.social_load ?? 5;
  const sleep = state.sleep_hours ?? 7;
  // Higher energy+focus → more tasks; higher load+social → fewer. Sleep: good = slight bonus, poor = slight penalty.
  const raw =
    (energy + focus - load - social * 0.5) / 10 * 2.5 +
    1 +
    (sleep >= 7 ? 0.3 : sleep < 5 ? -0.3 : 0);
  const suggestedTaskCount = Math.max(1, Math.min(5, Math.round(raw)));
  const capacity = Math.min(DEFAULT_CAPACITY, suggestedTaskCount * UNITS_PER_TASK);
  return { capacity, suggestedTaskCount };
}

export type EnergyBudget = {
  used: number;
  remaining: number;
  capacity: number;
  /** Suggested task count from brain status (drives capacity). */
  suggestedTaskCount: number;
  /** Energy spent by completed tasks today (checked tasks). */
  taskUsed: number;
  /** Number of completed (checked) tasks today. */
  completedTaskCount: number;
  /** Energy that incomplete tasks would use if all done. */
  taskPlanned: number;
  calendarCost: number;
};

export async function getEnergyBudget(date: string): Promise<EnergyBudget> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      used: 0,
      remaining: DEFAULT_CAPACITY,
      capacity: DEFAULT_CAPACITY,
      suggestedTaskCount: 3,
      taskUsed: 0,
      completedTaskCount: 0,
      taskPlanned: 0,
      calendarCost: 0,
    };
  }

  const [
    { data: dailyState },
    { data: completedTasks },
    { data: incompleteTasks },
    { data: events },
  ] = await Promise.all([
    supabase.from("daily_state").select("energy, focus, sensory_load, sleep_hours, social_load").eq("user_id", user.id).eq("date", date).single(),
    supabase.from("tasks").select("energy_required").eq("user_id", user.id).eq("due_date", date).eq("completed", true),
    supabase.from("tasks").select("energy_required").eq("user_id", user.id).eq("due_date", date).eq("completed", false),
    supabase.from("calendar_events").select("duration_hours, is_social").eq("user_id", user.id).gte("start_at", `${date}T00:00:00Z`).lt("start_at", `${date}T23:59:59Z`),
  ]);

  const { capacity, suggestedTaskCount } = capacityFromDailyState(dailyState as DailyStateRow);

  let taskUsed = 0;
  for (const t of completedTasks ?? []) {
    const e = (t as { energy_required?: number | null }).energy_required ?? 5;
    taskUsed += e * TASK_COST_MULTIPLIER;
  }

  let taskPlanned = 0;
  for (const t of incompleteTasks ?? []) {
    const e = (t as { energy_required?: number | null }).energy_required ?? 5;
    taskPlanned += e * TASK_COST_MULTIPLIER;
  }

  let calendarCost = 0;
  for (const ev of events ?? []) {
    const hours = Number((ev as { duration_hours?: number | null }).duration_hours ?? 0);
    const isSocial = (ev as { is_social?: boolean }).is_social ?? false;
    calendarCost += Math.round(hours * 10 * (isSocial ? 1.5 : 1));
  }

  const used = Math.min(capacity, taskUsed + calendarCost);
  const remaining = Math.max(0, capacity - used);
  const completedTaskCount = (completedTasks ?? []).length;
  return {
    used,
    remaining,
    capacity,
    suggestedTaskCount,
    taskUsed,
    completedTaskCount,
    taskPlanned,
    calendarCost,
  };
}
