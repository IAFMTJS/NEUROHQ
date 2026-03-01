"use server";

import { revalidatePath } from "next/cache";
import { revalidateTagMax } from "@/lib/revalidate";
import { createClient } from "@/lib/supabase/server";
import { isHeavyTask } from "@/lib/brain-mode";
import { logTaskEvent } from "./tasks";

const HEAVY_START_FOCUS_COST = 5;
const ABANDON_LOAD_BUMP = 5;
const ABANDON_XP_PENALTY_PCT = 0.1;
const LOAD_PER_EXCESS_ACTIVE = 5;

/**
 * Fase 5.1.2 + 5.2.1: Apply cancel cost when user abandons a task (XP -10%, Load +5).
 * Call before or with logTaskEvent(abandon).
 */
export async function applyAbandonCost(taskId: string, dateStr: string): Promise<{ xpDeducted: number; loadBump: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { xpDeducted: 0, loadBump: 0 };

  const [{ data: task }, { data: xpRow }, { data: dailyRow }] = await Promise.all([
    supabase.from("tasks").select("base_xp, impact").eq("id", taskId).eq("user_id", user.id).single(),
    supabase.from("user_xp").select("total_xp").eq("user_id", user.id).single(),
    supabase.from("daily_state").select("id, load").eq("user_id", user.id).eq("date", dateStr).maybeSingle(),
  ]);

  const baseXp = (task as { base_xp?: number | null; impact?: number | null } | null)?.base_xp ?? null;
  const impact = (task as { impact?: number | null } | null)?.impact ?? 2;
  const taskXp = baseXp != null && baseXp > 0 ? baseXp : Math.max(10, Math.min(100, impact * 35));
  const xpDeduct = Math.round(taskXp * ABANDON_XP_PENALTY_PCT);
  const xpDeducted = Math.max(0, xpDeduct);

  if (xpDeducted > 0) {
    const currentTotal = (xpRow as { total_xp?: number } | null)?.total_xp ?? 0;
    await supabase.from("user_xp").update({ total_xp: Math.max(0, currentTotal - xpDeducted) }).eq("user_id", user.id);
    await supabase.from("xp_events").insert({
      user_id: user.id,
      amount: -xpDeducted,
      source_type: "task_abandon_penalty",
    });
  }

  const currentLoad = (dailyRow as { load?: number | null } | null)?.load ?? 0;
  const newLoad = Math.min(100, currentLoad + ABANDON_LOAD_BUMP);
  if (dailyRow && (dailyRow as { id?: string }).id) {
    await supabase.from("daily_state").update({ load: newLoad }).eq("user_id", user.id).eq("date", dateStr);
  } else {
    await supabase.from("daily_state").insert({
      user_id: user.id,
      date: dateStr,
      load: newLoad,
    });
  }

  revalidateTagMax(`daily-${user.id}-${dateStr}`);
  revalidateTagMax(`energy-${user.id}-${dateStr}`);
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  revalidatePath("/xp");
  return { xpDeducted, loadBump: ABANDON_LOAD_BUMP };
}

/**
 * Fase 5.1.1 + 5.2.2: Deduct 5 focus when starting a heavy mission (consumed for the day).
 */
export async function applyHeavyStartFocusCost(dateStr: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: row } = await supabase
    .from("daily_state")
    .select("id, focus_consumed")
    .eq("user_id", user.id)
    .eq("date", dateStr)
    .maybeSingle();

  const consumed = (row as { focus_consumed?: number | null } | null)?.focus_consumed ?? 0;
  const newConsumed = Math.min(10, consumed + HEAVY_START_FOCUS_COST);

  if (row && (row as { id?: string }).id) {
    await supabase.from("daily_state").update({ focus_consumed: newConsumed }).eq("user_id", user.id).eq("date", dateStr);
  } else {
    await supabase.from("daily_state").insert({
      user_id: user.id,
      date: dateStr,
      focus_consumed: newConsumed,
    });
  }

  revalidateTagMax(`daily-${user.id}-${dateStr}`);
  revalidateTagMax(`energy-${user.id}-${dateStr}`);
  return true;
}

/**
 * Fase 5.1.3: Count tasks "started today" (have start event today) but not completed today.
 */
export async function getActiveStartedCount(dateStr: string): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const dayStart = `${dateStr}T00:00:00`;
  const dayEnd = `${dateStr}T23:59:59.999`;

  const { data: startEvents } = await supabase
    .from("task_events")
    .select("task_id")
    .eq("user_id", user.id)
    .eq("event_type", "start")
    .gte("occurred_at", dayStart)
    .lte("occurred_at", dayEnd);

  const { data: completeEvents } = await supabase
    .from("task_events")
    .select("task_id")
    .eq("user_id", user.id)
    .eq("event_type", "complete")
    .gte("occurred_at", dayStart)
    .lte("occurred_at", dayEnd);

  const startedIds = new Set((startEvents ?? []).map((e: { task_id: string }) => e.task_id));
  const completedIds = new Set((completeEvents ?? []).map((e: { task_id: string }) => e.task_id));
  let active = 0;
  for (const id of startedIds) {
    if (!completedIds.has(id)) active++;
  }
  return active;
}

/**
 * Fase 5.1.3: Load bump when active started count exceeds maxSlots. Returns extra load to add (e.g. (active - maxSlots) * 5).
 */
export async function getExcessActiveLoadBump(dateStr: string, maxSlots: number): Promise<number> {
  const active = await getActiveStartedCount(dateStr);
  if (active <= maxSlots) return 0;
  return (active - maxSlots) * LOAD_PER_EXCESS_ACTIVE;
}

/**
 * Abandon task with cost: apply XP -10%, Load +5, then log abandon event. Use from UI after confirmation.
 */
export async function abandonTaskWithCost(taskId: string): Promise<{ xpDeducted: number; loadBump: number }> {
  const dateStr = new Date().toISOString().slice(0, 10);
  const result = await applyAbandonCost(taskId, dateStr);
  await logTaskEvent({ taskId, eventType: "abandon" });
  return result;
}

/**
 * Fase 5.1.1: Start task and apply heavy mission focus cost (-5) when task is heavy. Call from UI when user starts timer/task.
 */
export async function startTaskWithHeavyCost(taskId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data: task } = await supabase.from("tasks").select("energy_required").eq("id", taskId).eq("user_id", user.id).single();
  const energyRequired = (task as { energy_required?: number | null } | null)?.energy_required ?? null;
  const dateStr = new Date().toISOString().slice(0, 10);
  if (isHeavyTask(energyRequired)) await applyHeavyStartFocusCost(dateStr);
  await logTaskEvent({ taskId, eventType: "start" });
}
