"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { IncomeSource } from "@/lib/dcic/types";

/** Get all income sources for current user (for payday + amount) */
export async function getIncomeSources(): Promise<IncomeSource[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let data: { id: string; name: string; amount_cents: number; day_of_month: number; type: string }[] | null = null;
  try {
    const res = await supabase
      .from("income_sources")
      .select("*")
      .eq("user_id", user.id)
      .order("day_of_month", { ascending: true });
    if (res.error) return [];
    data = res.data;
  } catch {
    return [];
  }
  return (data || []).map((row: { id: string; name: string; amount_cents: number; day_of_month: number; type: string }) => ({
    id: row.id,
    name: row.name,
    amount: row.amount_cents,
    dayOfMonth: Math.max(1, Math.min(31, row.day_of_month)),
    type: (row.type === "weekly" || row.type === "biweekly" ? row.type : "monthly") as "monthly" | "weekly" | "biweekly",
  }));
}

/** Add income source (e.g. salary on day 25) */
export async function addIncomeSource(params: {
  name: string;
  amount_cents: number;
  day_of_month: number;
  type?: "monthly" | "weekly" | "biweekly";
}): Promise<{ id: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const day = Math.max(1, Math.min(31, params.day_of_month));
  const { data, error } = await supabase
    .from("income_sources")
    .insert({
      user_id: user.id,
      name: params.name.trim() || "Salaris",
      amount_cents: Math.max(0, params.amount_cents),
      day_of_month: day,
      type: params.type || "monthly",
    })
    .select("id")
    .single();

  if (error) {
    console.error("addIncomeSource", error);
    return null;
  }
  revalidatePath("/budget");
  revalidatePath("/dashboard");
  return data ? { id: data.id } : null;
}

/** Update income source */
export async function updateIncomeSource(
  id: string,
  params: { name?: string; amount_cents?: number; day_of_month?: number; type?: "monthly" | "weekly" | "biweekly" }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const updates: Record<string, unknown> = {};
  if (params.name !== undefined) updates.name = params.name.trim() || "Salaris";
  if (params.amount_cents !== undefined) updates.amount_cents = Math.max(0, params.amount_cents);
  if (params.day_of_month !== undefined) updates.day_of_month = Math.max(1, Math.min(31, params.day_of_month));
  if (params.type !== undefined) updates.type = params.type;

  const { error } = await supabase
    .from("income_sources")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/budget");
  revalidatePath("/dashboard");
}

/** Delete income source */
export async function deleteIncomeSource(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from("income_sources").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/budget");
  revalidatePath("/dashboard");
}
