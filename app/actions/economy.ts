"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type UserEconomy = {
  discipline_points: number;
  focus_credits: number;
  momentum_boosters: number;
};

const DEFAULT_ECONOMY: UserEconomy = { discipline_points: 0, focus_credits: 0, momentum_boosters: 0 };

export async function getUserEconomy(): Promise<UserEconomy> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return DEFAULT_ECONOMY;
  const { data, error } = await supabase
    .from("user_economy")
    .select("discipline_points, focus_credits, momentum_boosters")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) return DEFAULT_ECONOMY;
  return {
    discipline_points: (data?.discipline_points as number | undefined) ?? 0,
    focus_credits: (data?.focus_credits as number | undefined) ?? 0,
    momentum_boosters: (data?.momentum_boosters as number | undefined) ?? 0,
  };
}

async function ensureEconomyRow(userId: string): Promise<UserEconomy> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_economy")
    .select("discipline_points, focus_credits, momentum_boosters")
    .eq("user_id", userId)
    .single();
  if (data) {
    return {
      discipline_points: (data.discipline_points as number) ?? 0,
      focus_credits: (data.focus_credits as number) ?? 0,
      momentum_boosters: (data.momentum_boosters as number) ?? 0,
    };
  }
  await supabase.from("user_economy").insert({
    user_id: userId,
    discipline_points: 0,
    focus_credits: 0,
    momentum_boosters: 0,
    updated_at: new Date().toISOString(),
  });
  return { discipline_points: 0, focus_credits: 0, momentum_boosters: 0 };
}

export async function addDisciplinePoints(userId: string, amount: number): Promise<void> {
  if (amount <= 0) return;
  const supabase = await createClient();
  const current = await ensureEconomyRow(userId);
  await supabase
    .from("user_economy")
    .update({
      discipline_points: current.discipline_points + amount,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  revalidatePath("/settings");
}

export async function addFocusCredits(userId: string, amount: number): Promise<void> {
  if (amount <= 0) return;
  const supabase = await createClient();
  const current = await ensureEconomyRow(userId);
  await supabase
    .from("user_economy")
    .update({
      focus_credits: current.focus_credits + amount,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  revalidatePath("/settings");
}

export async function addMomentumBoosters(userId: string, amount: number): Promise<void> {
  if (amount <= 0) return;
  const supabase = await createClient();
  const current = await ensureEconomyRow(userId);
  await supabase
    .from("user_economy")
    .update({
      momentum_boosters: current.momentum_boosters + amount,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  revalidatePath("/settings");
}

/** Award economy for completing a task: +1 discipline, +1 focus (capped 10/day), optional +1 momentum on chain complete. */
export async function awardEconomyForTaskComplete(options?: {
  discipline_weight?: number | null;
  chainCompleted?: boolean;
}): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const today = new Date().toISOString().slice(0, 10);
  await addDisciplinePoints(user.id, 1);
  const { count: completedToday } = await supabase
    .from("task_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("event_type", "complete")
    .gte("occurred_at", today + "T00:00:00Z")
    .lt("occurred_at", today + "T23:59:59.999Z");
  const completedTodayNum = completedToday ?? 0;
  if (completedTodayNum <= 10) await addFocusCredits(user.id, 1);
  if (options?.chainCompleted) await addMomentumBoosters(user.id, 1);
}
