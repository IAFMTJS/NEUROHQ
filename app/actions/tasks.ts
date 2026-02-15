"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type TaskListMode = "normal" | "low_energy" | "stabilize" | "driven";

export async function getTodaysTasks(date: string, mode: TaskListMode) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { tasks: [], carryOverCount: 0 };

  const nowIso = new Date().toISOString();
  let query = supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .eq("due_date", date)
    .eq("completed", false)
    .is("parent_task_id", null)
    .or(`snooze_until.is.null,snooze_until.lt.${nowIso}`);

  if (mode === "low_energy") {
    query = query.or("energy_required.is.null,energy_required.lt.4");
  }

  query = query.order("created_at", { ascending: true });
  const { data: tasks } = await query;
  let ordered = tasks ?? [];
  const categoryOrder = (c: string | null) => (c === "work" ? 0 : c === "personal" ? 1 : 2);
  ordered = [...ordered].sort((a, b) => {
    const catA = categoryOrder((a as { category?: string | null }).category ?? null);
    const catB = categoryOrder((b as { category?: string | null }).category ?? null);
    if (catA !== catB) return catA - catB;
    if (mode === "driven") {
      const ia = (a as { impact?: number | null }).impact ?? 0;
      const ib = (b as { impact?: number | null }).impact ?? 0;
      if (ib !== ia) return ib - ia;
      const pa = (a as { priority?: number | null }).priority ?? 0;
      const pb = (b as { priority?: number | null }).priority ?? 0;
      if (pb !== pa) return pb - pa;
    }
    return new Date((a as { created_at?: string }).created_at ?? 0).getTime() - new Date((b as { created_at?: string }).created_at ?? 0).getTime();
  });

  const maxCarryOver = Math.max(0, ...(tasks ?? []).map((t) => (t as { carry_over_count?: number }).carry_over_count ?? 0));
  return { tasks: ordered, carryOverCount: maxCarryOver };
}

export async function getTasksForDate(date: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const nowIso = new Date().toISOString();
  const { data } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .eq("due_date", date)
    .is("parent_task_id", null)
    .or(`snooze_until.is.null,snooze_until.lt.${nowIso}`)
    .order("completed")
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function createTask(params: {
  title: string;
  due_date: string;
  energy_required?: number | null;
  mental_load?: number | null;
  social_load?: number | null;
  priority?: number | null;
  parent_task_id?: string | null;
  recurrence_rule?: "daily" | "weekly" | "monthly" | null;
  recurrence_weekdays?: string | null;
  category?: "work" | "personal" | null;
  impact?: number | null;
  urgency?: number | null;
  notes?: string | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: user.id,
      title: params.title,
      due_date: params.due_date,
      energy_required: params.energy_required ?? null,
      mental_load: params.mental_load ?? null,
      social_load: params.social_load ?? null,
      priority: params.priority ?? null,
      parent_task_id: params.parent_task_id ?? null,
      recurrence_rule: params.recurrence_rule ?? null,
      recurrence_weekdays: params.recurrence_weekdays ?? null,
      category: params.category ?? null,
      impact: params.impact ?? null,
      urgency: params.urgency ?? null,
      notes: params.notes ?? null,
    } as Record<string, unknown>)
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  return { ok: true as const, id: data?.id };
}

/** ISO weekday 1=Mon .. 7=Sun. JS getDay() 0=Sun..6=Sat so ISO = getDay() || 7 */
function getISOWeekday(d: Date): number {
  const day = d.getUTCDay();
  return day === 0 ? 7 : day;
}

/** Next date on or after start whose ISO weekday is in weekdays (1-7). */
function nextWeekdayDate(start: Date, weekdays: number[]): string {
  let d = new Date(start.getTime());
  for (let i = 0; i < 8; i++) {
    if (weekdays.includes(getISOWeekday(d))) return d.toISOString().slice(0, 10);
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return d.toISOString().slice(0, 10);
}

export async function completeTask(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: task } = await supabase
    .from("tasks")
    .select("recurrence_rule, recurrence_weekdays, due_date, title, energy_required, mental_load, social_load, priority, category, impact, urgency")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  const { error } = await supabase
    .from("tasks")
    .update({ completed: true, completed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  const t = task as { recurrence_rule?: string; recurrence_weekdays?: string | null; due_date: string; title: string; energy_required?: number | null; mental_load?: number | null; social_load?: number | null; priority?: number | null; category?: string | null; impact?: number | null; urgency?: number | null } | null;
  if (t?.recurrence_rule === "daily" || t?.recurrence_rule === "weekly" || t?.recurrence_rule === "monthly") {
    let nextStr: string;
    const base = new Date(t.due_date + "T12:00:00Z");
    if (t.recurrence_rule === "daily") {
      base.setUTCDate(base.getUTCDate() + 1);
      nextStr = base.toISOString().slice(0, 10);
    } else if (t.recurrence_rule === "weekly" && t.recurrence_weekdays?.trim()) {
      const weekdays = t.recurrence_weekdays.split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => n >= 1 && n <= 7);
      if (weekdays.length) {
        const nextDay = new Date(base);
        nextDay.setUTCDate(nextDay.getUTCDate() + 1);
        nextStr = nextWeekdayDate(nextDay, weekdays);
      } else {
        base.setUTCDate(base.getUTCDate() + 7);
        nextStr = base.toISOString().slice(0, 10);
      }
    } else if (t.recurrence_rule === "weekly") {
      base.setUTCDate(base.getUTCDate() + 7);
      nextStr = base.toISOString().slice(0, 10);
    } else {
      const day = base.getUTCDate();
      base.setUTCMonth(base.getUTCMonth() + 1);
      if (base.getUTCDate() !== day) base.setUTCDate(0);
      nextStr = base.toISOString().slice(0, 10);
    }
    await supabase.from("tasks").insert({
      user_id: user.id,
      title: t.title,
      due_date: nextStr,
      energy_required: t.energy_required ?? null,
      mental_load: t.mental_load ?? null,
      social_load: t.social_load ?? null,
      priority: t.priority ?? null,
      recurrence_rule: t.recurrence_rule,
      recurrence_weekdays: t.recurrence_weekdays ?? null,
      category: t.category ?? null,
      impact: t.impact ?? null,
      urgency: t.urgency ?? null,
    } as Record<string, unknown>);
  }
  const { awardXPForTaskComplete } = await import("./xp");
  const { upsertDailyAnalytics } = await import("./analytics");
  await awardXPForTaskComplete();
  if (t?.due_date) await upsertDailyAnalytics(t.due_date);
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
}

/** Mark a task as not done (uncheck). Use if completed by accident. */
export async function uncompleteTask(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase
    .from("tasks")
    .update({ completed: false, completed_at: null })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
}

export async function deleteTask(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from("tasks").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
}

export async function getCarryOverCountForDate(date: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const { data: tasks } = await supabase
    .from("tasks")
    .select("carry_over_count")
    .eq("user_id", user.id)
    .eq("due_date", date)
    .eq("completed", false)
    .is("parent_task_id", null);
  const max = Math.max(0, ...(tasks ?? []).map((t) => t.carry_over_count ?? 0));
  return max;
}

export async function snoozeTask(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: task } = await supabase
    .from("tasks")
    .select("due_date")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (!task?.due_date) throw new Error("Task not found");
  const tomorrow = new Date(task.due_date + "T12:00:00Z");
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);
  const { error } = await supabase
    .from("tasks")
    .update({ due_date: tomorrowStr })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
}

export async function getSubtasks(parentTaskId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .eq("parent_task_id", parentTaskId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

export type SubtaskRow = { id: string; title: string; completed: boolean; created_at: string; parent_task_id: string };

export async function getSubtasksForTaskIds(parentIds: string[]): Promise<SubtaskRow[]> {
  if (parentIds.length === 0) return [];
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("tasks")
    .select("id, title, completed, created_at, parent_task_id")
    .eq("user_id", user.id)
    .in("parent_task_id", parentIds)
    .order("created_at", { ascending: true });
  return (data ?? []) as SubtaskRow[];
}

/** Tasks with no due_date or due_date > today (backlog / future). */
export async function getBacklogTasks(todayDate: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .eq("completed", false)
    .is("parent_task_id", null)
    .or(`due_date.is.null,due_date.gt.${todayDate}`)
    .order("due_date", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: true })
    .limit(50);
  return data ?? [];
}

/** Completed tasks for a given date (top-level only). */
export async function getCompletedTodayTasks(date: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .eq("due_date", date)
    .eq("completed", true)
    .is("parent_task_id", null)
    .order("completed_at", { ascending: false });
  return data ?? [];
}

/** Reschedule a task (e.g. from backlog to today). */
export async function rescheduleTask(id: string, due_date: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase
    .from("tasks")
    .update({ due_date })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
}

/** Update a task (edit modal). */
export async function updateTask(
  id: string,
  params: {
    title?: string;
    due_date?: string;
    category?: "work" | "personal" | null;
    recurrence_rule?: "daily" | "weekly" | "monthly" | null;
    recurrence_weekdays?: string | null;
    impact?: number | null;
    urgency?: number | null;
    energy_required?: number | null;
    mental_load?: number | null;
    social_load?: number | null;
    priority?: number | null;
    notes?: string | null;
  }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const payload: Record<string, unknown> = {};
  if (params.title !== undefined) payload.title = params.title;
  if (params.due_date !== undefined) payload.due_date = params.due_date;
  if (params.category !== undefined) payload.category = params.category;
  if (params.recurrence_rule !== undefined) payload.recurrence_rule = params.recurrence_rule;
  if (params.recurrence_weekdays !== undefined) payload.recurrence_weekdays = params.recurrence_weekdays;
  if (params.impact !== undefined) payload.impact = params.impact;
  if (params.urgency !== undefined) payload.urgency = params.urgency;
  if (params.energy_required !== undefined) payload.energy_required = params.energy_required;
  if (params.mental_load !== undefined) payload.mental_load = params.mental_load;
  if (params.social_load !== undefined) payload.social_load = params.social_load;
  if (params.priority !== undefined) payload.priority = params.priority;
  if (params.notes !== undefined) payload.notes = params.notes;
  const { error } = await supabase.from("tasks").update(payload).eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
}

/** Duplicate a task to a given due date (same fields, new id). */
export async function duplicateTask(id: string, due_date: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: task } = await supabase
    .from("tasks")
    .select("title, category, recurrence_rule, recurrence_weekdays, impact, urgency, energy_required, mental_load, social_load, priority")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (!task) throw new Error("Task not found");
  const t = task as { title: string; category?: string | null; recurrence_rule?: string | null; recurrence_weekdays?: string | null; impact?: number | null; urgency?: number | null; energy_required?: number | null; mental_load?: number | null; social_load?: number | null; priority?: number | null };
  const { error } = await supabase.from("tasks").insert({
    user_id: user.id,
    title: t.title,
    due_date,
    category: t.category ?? null,
    recurrence_rule: t.recurrence_rule ?? null,
    recurrence_weekdays: t.recurrence_weekdays ?? null,
    impact: t.impact ?? null,
    urgency: t.urgency ?? null,
    energy_required: t.energy_required ?? null,
    mental_load: t.mental_load ?? null,
    social_load: t.social_load ?? null,
    priority: t.priority ?? null,
  } as Record<string, unknown>);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
}
