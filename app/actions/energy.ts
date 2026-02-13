"use server";

import { createClient } from "@/lib/supabase/server";
import { splitTaskCost, taskCost, getSuggestedTaskCount } from "@/lib/utils/energy";

/** Default capacity when no brain status (daily_state) exists. */
const DEFAULT_CAPACITY = 100;

/** Calendar event cost. Kept moderate so a few events + tasks don't empty the budget. Social events add more load. */
function calendarCost(
  hours: number,
  isSocial: boolean
): { energy: number; focus: number; load: number } {
  const base = Math.round(hours * 6 * (isSocial ? 1.2 : 1));
  if (isSocial) {
    return { energy: Math.round(base * 0.3), focus: Math.round(base * 0.2), load: Math.round(base * 0.5) };
  }
  return { energy: Math.round(base * 0.4), focus: Math.round(base * 0.4), load: Math.round(base * 0.2) };
}

type DailyStateRow = {
  energy: number | null;
  focus: number | null;
  sensory_load: number | null;
  sleep_hours: number | null;
  social_load: number | null;
} | null;

export type PoolBudget = {
  capacity: number;
  used: number;
  remaining: number;
  planned: number;
};

/**
 * Per-task cost for an average task (energy_required=5). Used to scale capacity.
 * Multiplier 2.5 → avg task = 12.5 total. Split: 50% energy, 35% focus, 15% load.
 */
const AVG_TASK_ENERGY = 6;   // 5 * 2.5 * 0.5
const AVG_TASK_FOCUS = 4;    // 5 * 2.5 * 0.35
const AVG_TASK_LOAD = 2;     // 5 * 2.5 * 0.15
const CAPACITY_BUFFER = 2.0; // 2× headroom so 3–5 tasks leave budget clearly non-empty

/**
 * Advanced capacity model: capacities are derived from suggestedTaskCount so they
 * always align. suggestedTaskCount comes from brain status (energy, focus, load, sleep, social).
 */
function capacityFromDailyState(state: DailyStateRow): {
  energy: PoolBudget;
  focus: PoolBudget;
  load: PoolBudget;
  suggestedTaskCount: number;
  insight: string;
} {
  const defaults = {
    energy: { capacity: 36, used: 0, remaining: 36, planned: 0 },
    focus: { capacity: 24, used: 0, remaining: 24, planned: 0 },
    load: { capacity: 25, used: 0, remaining: 25, planned: 0 },
    suggestedTaskCount: 3,
    insight: "Add your check-in to personalize capacity.",
  };

  if (!state) return { ...defaults };

  const e = state.energy ?? 5;
  const f = state.focus ?? 5;
  const sensoryLoad = state.sensory_load ?? 5;
  const socialLoad = state.social_load ?? 5;
  const sleep = state.sleep_hours ?? 7;

  const suggestedTaskCount = getSuggestedTaskCount({
    energy: e,
    focus: f,
    sensory_load: sensoryLoad,
    social_load: socialLoad,
    sleep_hours: sleep,
  });

  // Capacity = suggestedTaskCount * cost per avg task * buffer. Ensures N tasks fit.
  const energyCapacity = Math.round(suggestedTaskCount * AVG_TASK_ENERGY * CAPACITY_BUFFER);
  const focusCapacity = Math.round(suggestedTaskCount * AVG_TASK_FOCUS * CAPACITY_BUFFER);
  const loadCapacity = Math.round(suggestedTaskCount * AVG_TASK_LOAD * CAPACITY_BUFFER);

  // Load pool gets extra headroom for calendar/social (often the stealth drain)
  const loadCapacityAdj = Math.max(loadCapacity, 25);

  let insight = "Capacity looks good.";
  if (suggestedTaskCount <= 2) insight = "Low capacity day. One or two meaningful tasks is enough.";
  else if (suggestedTaskCount <= 3) insight = "Steady day. Pace yourself with 2–3 priorities.";
  else if (suggestedTaskCount >= 6) insight = "High capacity. You can tackle several tasks today.";
  else if (sleep < 6) insight = "Sleep may limit you. Lighter tasks or earlier priorities.";
  else if (sensoryLoad >= 7) insight = "High load. Prioritize one deep task, keep the rest light.";

  return {
    energy: { capacity: energyCapacity, used: 0, remaining: energyCapacity, planned: 0 },
    focus: { capacity: focusCapacity, used: 0, remaining: focusCapacity, planned: 0 },
    load: { capacity: loadCapacityAdj, used: 0, remaining: loadCapacityAdj, planned: 0 },
    suggestedTaskCount,
    insight,
  };
}

export type EnergyBudget = {
  /** Combined remaining (min of the 3 pools) for backward compat. */
  remaining: number;
  capacity: number;
  suggestedTaskCount: number;
  taskUsed: number;
  completedTaskCount: number;
  taskPlanned: number;
  calendarCost: number;
  /** Per-pool breakdown for advanced UI. */
  energy: PoolBudget;
  focus: PoolBudget;
  load: PoolBudget;
  insight: string;
  /** Segments for stacked bar: completed, planned, calendar (used in viz). */
  segments: { label: string; value: number; color: string }[];
};

export async function getEnergyBudget(date: string): Promise<EnergyBudget> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      remaining: DEFAULT_CAPACITY,
      capacity: DEFAULT_CAPACITY,
      suggestedTaskCount: 3,
      taskUsed: 0,
      completedTaskCount: 0,
      taskPlanned: 0,
      calendarCost: 0,
      energy: { capacity: 80, used: 0, remaining: 80, planned: 0 },
      focus: { capacity: 80, used: 0, remaining: 80, planned: 0 },
      load: { capacity: 80, used: 0, remaining: 80, planned: 0 },
      insight: "Sign in to see your energy budget.",
      segments: [],
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

  const base = capacityFromDailyState(dailyState as DailyStateRow);
  const energy = { ...base.energy };
  const focus = { ...base.focus };
  const load = { ...base.load };

  let taskUsedTotal = 0;
  for (const t of completedTasks ?? []) {
    const e = (t as { energy_required?: number | null }).energy_required ?? 5;
    const c = splitTaskCost(e);
    energy.used += c.energy;
    focus.used += c.focus;
    load.used += c.load;
    taskUsedTotal += taskCost(e);
  }

  let taskPlannedTotal = 0;
  for (const t of incompleteTasks ?? []) {
    const e = (t as { energy_required?: number | null }).energy_required ?? 5;
    const c = splitTaskCost(e);
    energy.planned += c.energy;
    focus.planned += c.focus;
    load.planned += c.load;
    taskPlannedTotal += taskCost(e);
  }

  let calendarTotal = 0;
  for (const ev of events ?? []) {
    const hours = Number((ev as { duration_hours?: number | null }).duration_hours ?? 0);
    const isSocial = (ev as { is_social?: boolean }).is_social ?? false;
    const c = calendarCost(hours, isSocial);
    energy.used += c.energy;
    focus.used += c.focus;
    load.used += c.load;
    calendarTotal += hours * 6 * (isSocial ? 1.2 : 1);
  }

  energy.remaining = Math.max(0, energy.capacity - energy.used - energy.planned);
  focus.remaining = Math.max(0, focus.capacity - focus.used - focus.planned);
  load.remaining = Math.max(0, load.capacity - load.used - load.planned);

  const minRemaining = Math.min(energy.remaining, focus.remaining, load.remaining);
  const totalCapacity = (energy.capacity + focus.capacity + load.capacity) / 3;
  const totalUsed = energy.used + focus.used + load.used;
  const totalPlanned = energy.planned + focus.planned + load.planned;

  const segments = [
    { label: "Tasks done", value: taskUsedTotal, color: "bg-emerald-500" },
    { label: "Planned", value: taskPlannedTotal, color: "bg-amber-500/80" },
    { label: "Calendar", value: Math.round(calendarTotal), color: "bg-blue-500/70" },
  ].filter((s) => s.value > 0);

  return {
    remaining: Math.round(minRemaining),
    capacity: Math.round(totalCapacity),
    suggestedTaskCount: base.suggestedTaskCount,
    taskUsed: taskUsedTotal,
    completedTaskCount: (completedTasks ?? []).length,
    taskPlanned: taskPlannedTotal,
    calendarCost: Math.round(calendarTotal),
    energy,
    focus,
    load,
    insight: base.insight,
    segments,
  };
}

