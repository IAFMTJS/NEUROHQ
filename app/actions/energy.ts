"use server";

import { createClient, createClientWithToken } from "@/lib/supabase/server";
import { unstable_cache } from "next/cache";
import { splitTaskCost, taskCost, getSuggestedTaskCount } from "@/lib/utils/energy";
import { computeBrainMode, getFocusSlots, getMaxSlotsWithLoadRule, type BrainMode } from "@/lib/brain-mode";

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
  mental_battery: number | null;
  load: number | null;
  /** Fase 5: focus consumed when starting heavy missions (1–10 scale). */
  focus_consumed?: number | null;
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
  const focusConsumed = state.focus_consumed ?? 0;
  const f = Math.max(1, (state.focus ?? 5) - focusConsumed);
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

export type ConsequenceStateBudget = {
  energyDepleted: boolean;
  loadOver80: boolean;
  recoveryOnly: boolean;
  nextMissionCostMultiplier: number;
};

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
  brainMode: BrainMode;
  /** Segments for stacked bar: completed, planned, calendar (used in viz). */
  segments: { label: string; value: number; color: string }[];
  /** Hard guardrails derived from brain mode (e.g. high load blocks adding missions). */
  hardLimit?: {
    addBlocked: boolean;
  };
  /** Resource & Consequence Engine: for UI messages (next mission +15%, recovery-only). */
  consequence?: ConsequenceStateBudget;
  /** Fase 5: active started count and max slots — when activeStartedCount > maxSlots show "Load stijgt" warning. */
  activeStartedCount?: number;
  maxSlots?: number;
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
      brainMode: computeBrainMode({ energy: null, focus: null, sensory_load: null, headroom: DEFAULT_CAPACITY }),
      segments: [],
      hardLimit: { addBlocked: false },
      consequence: { energyDepleted: false, loadOver80: false, recoveryOnly: false, nextMissionCostMultiplier: 1 },
    };
  }
  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token ?? "";

  return unstable_cache(
    async (userId: string, dateKey: string, token: string) => {
      const client = createClientWithToken(token);
      const [
        { data: dailyState },
        { data: completedTasks },
        { data: incompleteTasks },
        { data: events },
      ] = await Promise.all([
        client.from("daily_state").select("energy, focus, sensory_load, sleep_hours, social_load, mental_battery, load, focus_consumed").eq("user_id", userId).eq("date", dateKey).single(),
        client.from("tasks").select("energy_required").eq("user_id", userId).eq("due_date", dateKey).eq("completed", true),
        client.from("tasks").select("energy_required").eq("user_id", userId).eq("due_date", dateKey).eq("completed", false),
        client
          .from("calendar_events")
          .select("start_at, end_at, duration_hours, is_social, source")
          .eq("user_id", userId)
          .gte("start_at", `${dateKey}T00:00:00Z`)
          .lt("start_at", `${dateKey}T23:59:59Z`),
      ]);

  const base = capacityFromDailyState(dailyState as DailyStateRow);
  const energy = { ...base.energy };
  const focus = { ...base.focus };
  const load = { ...base.load };

  const stateEnergy = (dailyState as DailyStateRow | null)?.energy;
  const energyDepleted = stateEnergy != null && stateEnergy <= 1;
  let nextMissionCostMultiplier = energyDepleted ? 1.15 : 1;
  const { data: gamification } = await client.from("user_gamification").select("progression_rank, prime_window_start, prime_window_end").eq("user_id", userId).single();
  const rank = (gamification as { progression_rank?: string } | null)?.progression_rank ?? "recruit";
  const { getEnergyImpactMultiplier } = await import("@/lib/progression-rank");
  nextMissionCostMultiplier *= getEnergyImpactMultiplier(rank as "recruit" | "operator" | "specialist" | "commander");
  const today = new Date().toISOString().slice(0, 10);
  if (dateKey === today && gamification) {
    const g = gamification as { prime_window_start?: string | null; prime_window_end?: string | null };
    const [sh, sm] = (g.prime_window_start ?? "09:00").split(":").map(Number);
    const [eh, em] = (g.prime_window_end ?? "11:00").split(":").map(Number);
    const start = (sh ?? 0) + (sm ?? 0) / 60;
    const end = (eh ?? 0) + (em ?? 0) / 60;
    const now = new Date();
    const hour = now.getUTCHours() + now.getUTCMinutes() / 60;
    const inside = start <= end ? (hour >= start && hour < end) : (hour >= start || hour < end);
    if (!inside) nextMissionCostMultiplier *= 1.1;
  }

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
    energy.planned += Math.round(c.energy * nextMissionCostMultiplier);
    focus.planned += Math.round(c.focus * nextMissionCostMultiplier);
    load.planned += Math.round(c.load * nextMissionCostMultiplier);
    taskPlannedTotal += Math.round(taskCost(e) * nextMissionCostMultiplier);
  }

      let calendarTotal = 0;
      const calendarEvents = (events ?? []) as {
        start_at?: string | null;
        end_at?: string | null;
        duration_hours?: number | null;
        is_social?: boolean | null;
        source?: string | null;
      }[];
      const googleSlots = calendarEvents
        .filter((ev) => ev.source === "google" && ev.start_at && ev.end_at)
        .map((ev) => {
          const start = new Date(ev.start_at as string).getTime();
          const end = new Date(ev.end_at as string).getTime();
          return { start, end };
        });

      function overlapsGoogle(startMs: number, endMs: number): boolean {
        if (googleSlots.length === 0) return false;
        return googleSlots.some((g) => startMs < g.end && endMs > g.start);
      }

      for (const ev of calendarEvents) {
        const hours = Number(ev.duration_hours ?? 0);
        if (!hours) continue;
        const isSocial = ev.is_social ?? false;
        const startAt = ev.start_at ? new Date(ev.start_at).getTime() : NaN;
        const endAt = ev.end_at ? new Date(ev.end_at).getTime() : NaN;

        // External calendar priority: if an internal event overlaps a Google event, only count the Google slot.
        if (ev.source !== "google" && Number.isFinite(startAt) && Number.isFinite(endAt) && overlapsGoogle(startAt, endAt)) {
          continue;
        }

        const c = calendarCost(hours, isSocial);
        energy.used += c.energy;
        focus.used += c.focus;
        load.used += c.load;
        calendarTotal += hours * 6 * (isSocial ? 1.2 : 1);
      }

  const dayStart = `${dateKey}T00:00:00`;
  const dayEnd = `${dateKey}T23:59:59.999`;
  const [{ data: startEvents }, { data: completeEvents }] = await Promise.all([
    client.from("task_events").select("task_id").eq("user_id", userId).eq("event_type", "start").gte("occurred_at", dayStart).lte("occurred_at", dayEnd),
    client.from("task_events").select("task_id").eq("user_id", userId).eq("event_type", "complete").gte("occurred_at", dayStart).lte("occurred_at", dayEnd),
  ]);
  const startedIds = new Set((startEvents ?? []).map((e: { task_id: string }) => e.task_id));
  const completedIds = new Set((completeEvents ?? []).map((e: { task_id: string }) => e.task_id));
  let activeStartedCount = 0;
  for (const id of startedIds) if (!completedIds.has(id)) activeStartedCount++;
  const focusSlots = getFocusSlots((dailyState as DailyStateRow | null)?.focus ?? null);
  const sensory = (dailyState as DailyStateRow | null)?.sensory_load ?? 5;
  const loadPct = (dailyState as DailyStateRow | null)?.load ?? Math.round((sensory / 10) * 100);
  const maxSlots = getMaxSlotsWithLoadRule(focusSlots, loadPct);
  if (activeStartedCount > maxSlots) {
    load.used += (activeStartedCount - maxSlots) * 5;
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

      const brainMode = computeBrainMode({
        energy: (dailyState as DailyStateRow | null)?.energy ?? null,
        focus: (dailyState as DailyStateRow | null)?.focus ?? null,
        sensory_load: (dailyState as DailyStateRow | null)?.sensory_load ?? null,
        headroom: Math.round(minRemaining),
        load: (dailyState as DailyStateRow | null)?.load ?? null,
        mental_battery: (dailyState as DailyStateRow | null)?.mental_battery ?? null,
      });

      const consequence: ConsequenceStateBudget = {
        energyDepleted,
        loadOver80: brainMode.risk === "High",
        recoveryOnly: brainMode.risk === "High",
        nextMissionCostMultiplier,
      };

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
        brainMode,
        segments,
        hardLimit: {
          addBlocked: brainMode.addBlocked,
        },
        consequence,
        activeStartedCount,
        maxSlots,
      };
    },
    ["energy-budget", user.id, date],
    { tags: [`energy-${user.id}-${date}`], revalidate: 60 }
  )(user.id, date, accessToken);
}

