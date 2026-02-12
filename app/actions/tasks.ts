"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getTodaysTasks(date: string, mode: "normal" | "low_energy" | "stabilize") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { tasks: [], carryOverCount: 0 };

  let query = supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .eq("due_date", date)
    .eq("completed", false)
    .order("created_at", { ascending: true });

  if (mode === "low_energy") {
    query = query.or("energy_required.is.null,energy_required.lt.7");
  }

  const { data: tasks } = await query;
  const limit = mode === "stabilize" ? 2 : mode === "low_energy" ? 3 : 999;
  const limited = (tasks ?? []).slice(0, limit);

  const maxCarryOver = Math.max(0, ...(tasks ?? []).map((t) => (t as { carry_over_count?: number }).carry_over_count ?? 0));
  return { tasks: limited, carryOverCount: maxCarryOver };
}

export async function getTasksForDate(date: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .eq("due_date", date)
    .order("completed")
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function createTask(params: {
  title: string;
  due_date: string;
  energy_required?: number;
  priority?: number;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: existing } = await supabase
    .from("tasks")
    .select("id")
    .eq("user_id", user.id)
    .eq("due_date", params.due_date)
    .eq("completed", false);
  const carryCount = existing?.length ?? 0;
  if (carryCount >= 5) throw new Error("Stabilize mode: finish or reschedule tasks before adding more.");

  const { error } = await supabase.from("tasks").insert({
    user_id: user.id,
    title: params.title,
    due_date: params.due_date,
    energy_required: params.energy_required ?? null,
    priority: params.priority ?? null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
}

export async function completeTask(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase
    .from("tasks")
    .update({ completed: true, completed_at: new Date().toISOString() })
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
    .eq("completed", false);
  const max = Math.max(0, ...(tasks ?? []).map((t) => t.carry_over_count ?? 0));
  return max;
}
