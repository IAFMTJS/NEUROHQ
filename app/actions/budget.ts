"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createAlternative } from "./alternatives";

/** Get user's monthly budget and savings target from users table */
export async function getBudgetSettings(): Promise<{ monthly_budget_cents: number | null; monthly_savings_cents: number | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { monthly_budget_cents: null, monthly_savings_cents: null };
  const { data } = await supabase
    .from("users")
    .select("monthly_budget_cents, monthly_savings_cents")
    .eq("id", user.id)
    .single();
  return {
    monthly_budget_cents: (data as { monthly_budget_cents?: number | null })?.monthly_budget_cents ?? null,
    monthly_savings_cents: (data as { monthly_savings_cents?: number | null })?.monthly_savings_cents ?? null,
  };
}

/** Update user's monthly budget and/or savings target */
export async function updateBudgetSettings(params: {
  monthly_budget_cents?: number | null;
  monthly_savings_cents?: number | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const updates: Record<string, number | null> = {};
  if (params.monthly_budget_cents !== undefined) updates.monthly_budget_cents = params.monthly_budget_cents;
  if (params.monthly_savings_cents !== undefined) updates.monthly_savings_cents = params.monthly_savings_cents;
  const { error } = await supabase.from("users").update(updates).eq("id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/budget");
}

/** Sum of expenses (absolute value of negative amount_cents) for current calendar month */
export async function getCurrentMonthExpensesCents(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  const { data } = await supabase
    .from("budget_entries")
    .select("amount_cents")
    .eq("user_id", user.id)
    .lt("amount_cents", 0)
    .gte("date", start)
    .lte("date", end);
  const total = (data ?? []).reduce((sum, r) => sum + Math.abs(r.amount_cents ?? 0), 0);
  return total;
}

const MAX_ACTIVE_FREEZES = 5;
const FREEZE_HOURS = 24;

export async function getBudgetEntries(fromDate?: string, toDate?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  let query = supabase
    .from("budget_entries")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false });
  if (fromDate) query = query.gte("date", fromDate);
  if (toDate) query = query.lte("date", toDate);
  const { data } = await query;
  return data ?? [];
}

export async function addBudgetEntry(params: {
  amount_cents: number;
  date: string;
  category?: string;
  note?: string;
  is_planned?: boolean;
}): Promise<{ id: string } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("budget_entries")
    .insert({
      user_id: user.id,
      amount_cents: params.amount_cents,
      date: params.date,
      category: params.category ?? null,
      note: params.note ?? null,
      is_planned: params.is_planned ?? false,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/budget");
  revalidatePath("/dashboard");
  return data ? { id: data.id } : null;
}

export async function updateBudgetEntry(id: string, params: {
  amount_cents?: number;
  date?: string;
  category?: string | null;
  note?: string | null;
  is_planned?: boolean;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase
    .from("budget_entries")
    .update(params)
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/budget");
  revalidatePath("/dashboard");
}

export async function deleteBudgetEntry(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from("budget_entries").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/budget");
  revalidatePath("/dashboard");
}

export async function freezePurchase(entryId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: active } = await supabase
    .from("budget_entries")
    .select("id")
    .eq("user_id", user.id)
    .not("freeze_until", "is", null)
    .gt("freeze_until", new Date().toISOString());
  if ((active?.length ?? 0) >= MAX_ACTIVE_FREEZES) throw new Error("Max 5 active freezes. Confirm or cancel one first.");

  const until = new Date();
  until.setHours(until.getHours() + FREEZE_HOURS);
  const { error } = await supabase
    .from("budget_entries")
    .update({ freeze_until: until.toISOString(), is_planned: true })
    .eq("id", entryId)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/budget");
}

export async function confirmFreeze(entryId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase
    .from("budget_entries")
    .update({ freeze_until: null, freeze_reminder_sent: true })
    .eq("id", entryId)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/budget");
}

export async function cancelFreeze(entryId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase
    .from("budget_entries")
    .update({ freeze_until: null, freeze_reminder_sent: true, amount_cents: 0 })
    .eq("id", entryId)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  try {
    await createAlternative({
      type: "purchase_freeze",
      reference_id: entryId,
      suggestion_text: "You cancelled this. Consider adding the amount to a savings goal instead.",
    });
  } catch {
    // ignore if alternatives fail
  }
  revalidatePath("/budget");
}

export async function getFrozenEntries() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("budget_entries")
    .select("*")
    .eq("user_id", user.id)
    .not("freeze_until", "is", null)
    .gt("freeze_until", new Date().toISOString());
  return data ?? [];
}

export async function getEntriesReadyForFreezeReminder() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("budget_entries")
    .select("*")
    .eq("user_id", user.id)
    .not("freeze_until", "is", null)
    .lte("freeze_until", new Date().toISOString())
    .eq("freeze_reminder_sent", false);
  return data ?? [];
}

/** Entries with freeze_until <= now — ready for user to Confirm or Cancel (24h passed). */
export async function getFrozenEntriesReadyForAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("budget_entries")
    .select("*")
    .eq("user_id", user.id)
    .not("freeze_until", "is", null)
    .lte("freeze_until", new Date().toISOString())
    .order("freeze_until", { ascending: false });
  return data ?? [];
}
/** 4-week average of expenses (absolute sum of negative amount_cents). Used for impulse heuristic. */
export async function getFourWeekExpenseAverage(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const from = fourWeeksAgo.toISOString().slice(0, 10);
  const { data } = await supabase
    .from("budget_entries")
    .select("amount_cents")
    .eq("user_id", user.id)
    .lt("amount_cents", 0)
    .gte("date", from);
  const total = (data ?? []).reduce((sum, r) => sum + Math.abs(r.amount_cents ?? 0), 0);
  const weeks = 4;
  return weeks > 0 ? Math.round(total / weeks) : 0;
}
/** Check if this unplanned expense looks like impulse (> 40% of 4-week weekly average). */
export async function checkImpulseSignal(amountCents: number): Promise<{ isPossibleImpulse: boolean; weeklyAvgCents: number }> {
  if (amountCents >= 0) return { isPossibleImpulse: false, weeklyAvgCents: 0 };
  const weeklyAvg = await getFourWeekExpenseAverage();
  const threshold = 0.4;
  const isPossibleImpulse = weeklyAvg > 0 && Math.abs(amountCents) > weeklyAvg * threshold;
  return { isPossibleImpulse, weeklyAvgCents: weeklyAvg };
}
