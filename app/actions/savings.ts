"use server";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import { revalidatePath } from "next/cache";

export type SavingsGoalRow = Database["public"]["Tables"]["savings_goals"]["Row"];

export async function getSavingsGoals(includeArchived = false): Promise<SavingsGoalRow[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("savings_goals")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const list = (data ?? []) as SavingsGoalRow[];
  if (includeArchived) return list;
  return list.filter((g) => g.status !== "completed" && g.status !== "cancelled");
}

export async function createSavingsGoal(params: {
  name: string;
  target_cents: number;
  deadline?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from("savings_goals").insert({
    user_id: user.id,
    name: params.name,
    target_cents: params.target_cents,
    current_cents: 0,
    deadline: params.deadline ?? null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/budget");
  revalidatePath("/dashboard");
}

export async function updateSavingsGoal(id: string, params: {
  name?: string;
  target_cents?: number;
  current_cents?: number;
  deadline?: string | null;
  status?: "active" | "completed" | "cancelled";
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase
    .from("savings_goals")
    .update(params)
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/budget");
  revalidatePath("/dashboard");
}

/** Add a contribution to a goal (updates current_cents and logs in savings_contributions) */
export async function addSavingsContribution(goalId: string, amountCents: number, note?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  if (amountCents <= 0) throw new Error("Amount must be positive");
  const { data: goal } = await supabase
    .from("savings_goals")
    .select("current_cents")
    .eq("id", goalId)
    .eq("user_id", user.id)
    .single();
  if (!goal) throw new Error("Goal not found");
  const current = (goal as { current_cents: number }).current_cents ?? 0;
  const { error: insertErr } = await supabase.from("savings_contributions").insert({
    user_id: user.id,
    goal_id: goalId,
    amount_cents: amountCents,
    contributed_at: new Date().toISOString().slice(0, 10),
    note: note ?? null,
  });
  if (insertErr) throw new Error(insertErr.message);
  await supabase
    .from("savings_goals")
    .update({ current_cents: current + amountCents })
    .eq("id", goalId)
    .eq("user_id", user.id);
  revalidatePath("/budget");
  revalidatePath("/dashboard");
}

/** Get contributions for a goal (or all goals) within optional date range */
export async function getSavingsContributions(opts?: { goalId?: string; fromDate?: string; toDate?: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  let q = supabase
    .from("savings_contributions")
    .select("id, goal_id, amount_cents, contributed_at, note, created_at")
    .eq("user_id", user.id)
    .order("contributed_at", { ascending: false });
  if (opts?.goalId) q = q.eq("goal_id", opts.goalId);
  if (opts?.fromDate) q = q.gte("contributed_at", opts.fromDate);
  if (opts?.toDate) q = q.lte("contributed_at", opts.toDate);
  const { data } = await q.limit(200);
  return data ?? [];
}

export async function deleteSavingsGoal(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from("savings_goals").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/budget");
  revalidatePath("/dashboard");
}

