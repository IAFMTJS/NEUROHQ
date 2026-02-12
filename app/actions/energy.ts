"use server";

import { createClient } from "@/lib/supabase/server";

const TASK_COST_MULTIPLIER = 10;
const DAILY_CAPACITY = 100;

export async function getEnergyBudget(date: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { used: 0, remaining: DAILY_CAPACITY, taskCost: 0, calendarCost: 0 };

  const { data: tasks } = await supabase
    .from("tasks")
    .select("energy_required")
    .eq("user_id", user.id)
    .eq("due_date", date)
    .eq("completed", false);

  let taskCost = 0;
  for (const t of tasks ?? []) {
    const e = t.energy_required ?? 5;
    taskCost += e * TASK_COST_MULTIPLIER;
  }

  const { data: events } = await supabase
    .from("calendar_events")
    .select("duration_hours, is_social")
    .eq("user_id", user.id)
    .gte("start_at", `${date}T00:00:00Z`)
    .lt("start_at", `${date}T23:59:59Z`);

  let calendarCost = 0;
  for (const ev of events ?? []) {
    const hours = Number(ev.duration_hours ?? 0);
    const cost = hours * 15 * (ev.is_social ? 1.5 : 1);
    calendarCost += cost;
  }

  const used = Math.min(DAILY_CAPACITY, taskCost + calendarCost);
  const remaining = Math.max(0, DAILY_CAPACITY - used);
  return { used, remaining, taskCost, calendarCost };
}
