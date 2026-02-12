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
    query = query.or("energy_required.is.null,energy_required.lt.7");
  }

  query = query.order("created_at", { ascending: true });
  const { data: tasks } = await query;
  const limit = mode === "stabilize" ? 2 : mode === "low_energy" ? 3 : 999;
  let limited = tasks ?? [];
  if (mode === "driven") {
    limited = [...limited].sort((a, b) => {
      const pa = (a as { priority?: number }).priority ?? 0;
      const pb = (b as { priority?: number }).priority ?? 0;
      if (pb !== pa) return pb - pa;
      return new Date((a as { created_at?: string }).created_at ?? 0).getTime() - new Date((b as { created_at?: string }).created_at ?? 0).getTime();
    });
  }
  limited = limited.slice(0, limit);

  const maxCarryOver = Math.max(0, ...(tasks ?? []).map((t) => (t as { carry_over_count?: number }).carry_over_count ?? 0));
  return { tasks: limited, carryOverCount: maxCarryOver };
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
  energy_required?: number;
  priority?: number;
  parent_task_id?: string | null;
  recurrence_rule?: "daily" | "weekly" | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: existing } = await supabase
    .from("tasks")
    .select("id")
    .eq("user_id", user.id)
    .eq("due_date", params.due_date)
    .eq("completed", false)
    .is("parent_task_id", null);
  const carryCount = existing?.length ?? 0;
  if (carryCount >= 5) throw new Error("Stabilize mode: finish or reschedule tasks before adding more.");

  const { error } = await supabase.from("tasks").insert({
    user_id: user.id,
    title: params.title,
    due_date: params.due_date,
    energy_required: params.energy_required ?? null,
    priority: params.priority ?? null,
    parent_task_id: params.parent_task_id ?? null,
    recurrence_rule: params.recurrence_rule ?? null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
}

export async function completeTask(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: task } = await supabase
    .from("tasks")
    .select("recurrence_rule, due_date, title, energy_required, priority")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  const { error } = await supabase
    .from("tasks")
    .update({ completed: true, completed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  if (task?.recurrence_rule === "daily" || task?.recurrence_rule === "weekly") {
    const nextDate = new Date(task.due_date + "T12:00:00Z");
    if (task.recurrence_rule === "daily") nextDate.setUTCDate(nextDate.getUTCDate() + 1);
    else nextDate.setUTCDate(nextDate.getUTCDate() + 7);
    const nextStr = nextDate.toISOString().slice(0, 10);
    await supabase.from("tasks").insert({
      user_id: user.id,
      title: task.title,
      due_date: nextStr,
      energy_required: task.energy_required ?? null,
      priority: task.priority ?? null,
      recurrence_rule: task.recurrence_rule,
    });
  }
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
