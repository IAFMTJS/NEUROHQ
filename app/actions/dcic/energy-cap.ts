"use server";

import { createClient } from "@/lib/supabase/server";
import { ENERGY_CAP } from "@/lib/today-engine";

export interface EnergyCapToday {
  used: number;
  cap: number;
  remaining: number;
  /** Energy of today's incomplete tasks (planned). */
  planned: number;
}

/** Energy used today: sum of energy_required (1–5) for tasks completed today. Optional: add planned from current tasks. */
export async function getEnergyCapToday(dateStr: string): Promise<EnergyCapToday> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { used: 0, cap: ENERGY_CAP, remaining: ENERGY_CAP, planned: 0 };

  const startOfDay = `${dateStr}T00:00:00.000Z`;
  const endOfDay = `${dateStr}T23:59:59.999Z`;
  const nowIso = new Date().toISOString();

  const { data: completedToday } = await supabase
    .from("tasks")
    .select("energy_required")
    .eq("user_id", user.id)
    .eq("completed", true)
    .is("deleted_at", null)
    .is("parent_task_id", null)
    .gte("completed_at", startOfDay)
    .lte("completed_at", endOfDay);

  const used = (completedToday ?? []).reduce(
    (sum, t) => sum + Math.min(5, Math.max(1, (t.energy_required as number) ?? 2)),
    0
  );

  /** Same scope as getTodaysTasks: top-level only, not deleted, not snoozed past now. */
  const { data: todayTasks } = await supabase
    .from("tasks")
    .select("energy_required")
    .eq("user_id", user.id)
    .eq("due_date", dateStr)
    .eq("completed", false)
    .is("deleted_at", null)
    .is("parent_task_id", null)
    .or(`snooze_until.is.null,snooze_until.lt.${nowIso}`);

  const planned = (todayTasks ?? []).reduce(
    (sum, t) => sum + Math.min(5, Math.max(1, (t.energy_required as number) ?? 2)),
    0
  );

  return {
    used,
    cap: ENERGY_CAP,
    remaining: Math.max(0, ENERGY_CAP - used),
    planned,
  };
}
