"use server";

import { createClient } from "@/lib/supabase/server";
import type { ExecutionQuarterMetrics } from "@/lib/strategy/execution-behavior";

function toDay(iso: string): string {
  return iso.slice(0, 10);
}

function quarterElapsedDays(quarterStart: string, quarterEnd: string, todayStr: string): number {
  const end = todayStr > quarterEnd ? quarterEnd : todayStr;
  if (end < quarterStart) return 1;
  const a = new Date(`${quarterStart}T12:00:00Z`).getTime();
  const b = new Date(`${end}T12:00:00Z`).getTime();
  return Math.max(1, Math.round((b - a) / 86400000) + 1);
}

/**
 * Signalen uit Missions (task_events + tasks) voor executie-gedragspijler per focus-modus.
 */
export async function loadExecutionQuarterMetrics(
  userId: string,
  quarterStart: string,
  quarterEnd: string,
  todayStr: string
): Promise<ExecutionQuarterMetrics> {
  const supabase = await createClient();
  const t0 = `${quarterStart}T00:00:00.000Z`;
  const t1 = `${quarterEnd}T23:59:59.999Z`;

  const [
    { data: completeEvts },
    { count: startCount },
    { count: abandonCount },
    { count: recurringDueCount },
  ] = await Promise.all([
    supabase
      .from("task_events")
      .select("task_id, occurred_at")
      .eq("user_id", userId)
      .eq("event_type", "complete")
      .gte("occurred_at", t0)
      .lte("occurred_at", t1),
    supabase
      .from("task_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("event_type", "start")
      .gte("occurred_at", t0)
      .lte("occurred_at", t1),
    supabase
      .from("task_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("event_type", "abandon")
      .gte("occurred_at", t0)
      .lte("occurred_at", t1),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("deleted_at", null)
      .not("recurrence_rule", "is", null)
      .neq("recurrence_rule", "")
      .gte("due_date", quarterStart)
      .lte("due_date", quarterEnd),
  ]);

  const completesList = (completeEvts ?? []) as { task_id: string; occurred_at: string }[];
  const taskIds = [...new Set(completesList.map((e) => e.task_id))];

  const taskMap = new Map<string, { due_date: string | null; recurrence_rule: string | null }>();
  if (taskIds.length > 0) {
    const chunk = 200;
    for (let i = 0; i < taskIds.length; i += chunk) {
      const slice = taskIds.slice(i, i + chunk);
      const { data: rows } = await supabase
        .from("tasks")
        .select("id, due_date, recurrence_rule")
        .eq("user_id", userId)
        .in("id", slice)
        .is("deleted_at", null);
      for (const r of rows ?? []) {
        const row = r as { id: string; due_date: string | null; recurrence_rule: string | null };
        taskMap.set(row.id, { due_date: row.due_date, recurrence_rule: row.recurrence_rule });
      }
    }
  }

  const completesWithDue: ExecutionQuarterMetrics["completesWithDue"] = [];
  const recurringTouched = new Set<string>();
  const daySet = new Set<string>();

  for (const e of completesList) {
    const day = toDay(e.occurred_at);
    daySet.add(day);
    const t = taskMap.get(e.task_id);
    const dueDate = t?.due_date ?? null;
    const isRec =
      typeof t?.recurrence_rule === "string" && t.recurrence_rule.trim().length > 0;
    completesWithDue.push({ completeDay: day, dueDate, isRecurring: isRec });
    if (isRec) recurringTouched.add(e.task_id);
  }

  return {
    completesWithDue,
    skipRescheduleDelete: 0, // gevuld in quarter-engine-snapshot met mission_outcome-telling
    startCount: startCount ?? 0,
    abandonCount: abandonCount ?? 0,
    distinctCompleteDays: daySet.size,
    quarterElapsedDays: quarterElapsedDays(quarterStart, quarterEnd, todayStr),
    recurringTasksDueInQuarter: recurringDueCount ?? 0,
    recurringTasksTouchedInQuarter: recurringTouched.size,
  };
}
