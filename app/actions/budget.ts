"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createAlternative } from "./alternatives";

type BudgetSettingsRow = {
  monthly_budget_cents?: number | null;
  monthly_savings_cents?: number | null;
  currency?: string | null;
  impulse_threshold_pct?: number | null;
  budget_period?: string | null;
  impulse_quick_add_minutes?: number | null;
  impulse_risk_categories?: string[] | null;
};

/** Get user's budget settings from users table */
export async function getBudgetSettings(): Promise<{
  monthly_budget_cents: number | null;
  monthly_savings_cents: number | null;
  currency: string;
  impulse_threshold_pct: number;
  budget_period: "monthly" | "weekly";
  impulse_quick_add_minutes: number | null;
  impulse_risk_categories: string[];
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user)
    return {
      monthly_budget_cents: null,
      monthly_savings_cents: null,
      currency: "EUR",
      impulse_threshold_pct: 40,
      budget_period: "monthly",
      impulse_quick_add_minutes: null,
      impulse_risk_categories: [],
    };
  const { data } = await supabase
    .from("users")
    .select("monthly_budget_cents, monthly_savings_cents, currency, impulse_threshold_pct, budget_period, impulse_quick_add_minutes, impulse_risk_categories")
    .eq("id", user.id)
    .single();
  const row = (data ?? {}) as BudgetSettingsRow;
  const riskCat = row.impulse_risk_categories;
  return {
    monthly_budget_cents: row.monthly_budget_cents ?? null,
    monthly_savings_cents: row.monthly_savings_cents ?? null,
    currency: row.currency && String(row.currency).trim() ? String(row.currency).toUpperCase() : "EUR",
    impulse_threshold_pct: typeof row.impulse_threshold_pct === "number" ? row.impulse_threshold_pct : 40,
    budget_period: row.budget_period === "weekly" ? "weekly" : "monthly",
    impulse_quick_add_minutes: typeof row.impulse_quick_add_minutes === "number" ? row.impulse_quick_add_minutes : null,
    impulse_risk_categories: Array.isArray(riskCat) ? riskCat.filter((c): c is string => typeof c === "string") : [],
  };
}

/** Update user's budget settings */
export async function updateBudgetSettings(params: {
  monthly_budget_cents?: number | null;
  monthly_savings_cents?: number | null;
  currency?: string | null;
  impulse_threshold_pct?: number | null;
  budget_period?: "monthly" | "weekly" | null;
  impulse_quick_add_minutes?: number | null;
  impulse_risk_categories?: string[] | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const updates: Record<string, unknown> = {};
  if (params.monthly_budget_cents !== undefined) updates.monthly_budget_cents = params.monthly_budget_cents;
  if (params.monthly_savings_cents !== undefined) updates.monthly_savings_cents = params.monthly_savings_cents;
  if (params.currency !== undefined) updates.currency = params.currency?.trim() ? params.currency.toUpperCase() : "EUR";
  if (params.impulse_threshold_pct !== undefined)
    updates.impulse_threshold_pct = Math.min(100, Math.max(0, params.impulse_threshold_pct ?? 40));
  if (params.budget_period !== undefined) updates.budget_period = params.budget_period ?? "monthly";
  if (params.impulse_quick_add_minutes !== undefined) updates.impulse_quick_add_minutes = params.impulse_quick_add_minutes;
  if (params.impulse_risk_categories !== undefined) updates.impulse_risk_categories = params.impulse_risk_categories;
  const { error } = await supabase.from("users").update(updates).eq("id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/budget");
  revalidatePath("/settings");
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

/** Sum of income (positive amount_cents) for current calendar month */
export async function getCurrentMonthIncomeCents(): Promise<number> {
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
    .gt("amount_cents", 0)
    .gte("date", start)
    .lte("date", end);
  return (data ?? []).reduce((sum, r) => sum + (r.amount_cents ?? 0), 0);
}

/** Week bounds (Monday–Sunday) for a given date */
function getWeekBounds(d: Date): { start: string; end: string } {
  const day = d.getDay();
  const monOffset = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + monOffset);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return {
    start: mon.toISOString().slice(0, 10),
    end: sun.toISOString().slice(0, 10),
  };
}

/** Sum of expenses for current week (Mon–Sun) */
export async function getCurrentWeekExpensesCents(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const { start, end } = getWeekBounds(new Date());
  const { data } = await supabase
    .from("budget_entries")
    .select("amount_cents")
    .eq("user_id", user.id)
    .lt("amount_cents", 0)
    .gte("date", start)
    .lte("date", end);
  return (data ?? []).reduce((sum, r) => sum + Math.abs(r.amount_cents ?? 0), 0);
}

/** Sum of income for current week (Mon–Sun) */
export async function getCurrentWeekIncomeCents(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const { start, end } = getWeekBounds(new Date());
  const { data } = await supabase
    .from("budget_entries")
    .select("amount_cents")
    .eq("user_id", user.id)
    .gt("amount_cents", 0)
    .gte("date", start)
    .lte("date", end);
  return (data ?? []).reduce((sum, r) => sum + (r.amount_cents ?? 0), 0);
}

/** Expenses for a specific month (for history) */
export async function getMonthExpensesCents(year: number, month: number): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const start = new Date(year, month - 1, 1).toISOString().slice(0, 10);
  const end = new Date(year, month, 0).toISOString().slice(0, 10);
  const { data } = await supabase
    .from("budget_entries")
    .select("amount_cents")
    .eq("user_id", user.id)
    .lt("amount_cents", 0)
    .gte("date", start)
    .lte("date", end);
  return (data ?? []).reduce((sum, r) => sum + Math.abs(r.amount_cents ?? 0), 0);
}

/** Income for a specific month (for history) */
export async function getMonthIncomeCents(year: number, month: number): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const start = new Date(year, month - 1, 1).toISOString().slice(0, 10);
  const end = new Date(year, month, 0).toISOString().slice(0, 10);
  const { data } = await supabase
    .from("budget_entries")
    .select("amount_cents")
    .eq("user_id", user.id)
    .gt("amount_cents", 0)
    .gte("date", start)
    .lte("date", end);
  return (data ?? []).reduce((sum, r) => sum + (r.amount_cents ?? 0), 0);
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

export async function cancelFreeze(entryId: string, options?: { addToGoalId?: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: entry } = await supabase
    .from("budget_entries")
    .select("amount_cents")
    .eq("id", entryId)
    .eq("user_id", user.id)
    .single();
  const amountAbs = entry ? Math.abs((entry as { amount_cents: number }).amount_cents ?? 0) : 0;

  if (options?.addToGoalId && amountAbs > 0) {
    const { data: goal } = await supabase
      .from("savings_goals")
      .select("current_cents")
      .eq("id", options.addToGoalId)
      .eq("user_id", user.id)
      .single();
    if (goal) {
      const current = (goal as { current_cents: number }).current_cents ?? 0;
      await supabase
        .from("savings_goals")
        .update({ current_cents: current + amountAbs })
        .eq("id", options.addToGoalId)
        .eq("user_id", user.id);
    }
  }

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
      suggestion_text: options?.addToGoalId
        ? "You cancelled and added the amount to a savings goal."
        : "You cancelled this. Consider adding the amount to a savings goal instead.",
    });
  } catch {
    // ignore if alternatives fail
  }
  revalidatePath("/budget");
  revalidatePath("/dashboard");
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
/** Check if this unplanned expense looks like impulse (size vs avg, optional quick-add window, risk category). */
export async function checkImpulseSignal(
  amountCents: number,
  opts?: { category?: string; addedWithinMinutes?: number }
): Promise<{ isPossibleImpulse: boolean; weeklyAvgCents: number }> {
  if (amountCents >= 0) return { isPossibleImpulse: false, weeklyAvgCents: 0 };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { isPossibleImpulse: false, weeklyAvgCents: 0 };
  const { data: userRow } = await supabase
    .from("users")
    .select("impulse_threshold_pct, impulse_quick_add_minutes, impulse_risk_categories")
    .eq("id", user.id)
    .single();
  const row = userRow as {
    impulse_threshold_pct?: number;
    impulse_quick_add_minutes?: number | null;
    impulse_risk_categories?: string[] | null;
  } | null;
  const weeklyAvg = await getFourWeekExpenseAverage();
  const pct = row?.impulse_threshold_pct ?? 40;
  const threshold = pct / 100;
  let isPossibleImpulse = weeklyAvg > 0 && Math.abs(amountCents) > weeklyAvg * threshold;
  if (opts?.addedWithinMinutes != null && row?.impulse_quick_add_minutes != null && opts.addedWithinMinutes <= row.impulse_quick_add_minutes)
    isPossibleImpulse = true;
  if (opts?.category && Array.isArray(row?.impulse_risk_categories) && row.impulse_risk_categories.some((c) => c.toLowerCase() === (opts.category ?? "").toLowerCase()))
    isPossibleImpulse = true;
  return { isPossibleImpulse, weeklyAvgCents: weeklyAvg };
}

/** Unplanned expenses this week (is_planned = false, amount < 0): count and total cents */
export async function getUnplannedWeeklySummary(): Promise<{ count: number; totalCents: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { count: 0, totalCents: 0 };
  const { start, end } = getWeekBounds(new Date());
  const { data } = await supabase
    .from("budget_entries")
    .select("amount_cents")
    .eq("user_id", user.id)
    .eq("is_planned", false)
    .lt("amount_cents", 0)
    .gte("date", start)
    .lte("date", end);
  const list = data ?? [];
  const totalCents = list.reduce((s, r) => s + Math.abs(r.amount_cents ?? 0), 0);
  return { count: list.length, totalCents };
}

function escapeCsv(s: string): string {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Export budget entries and savings goals as CSV string */
export async function exportBudgetCsv(): Promise<string> {
  const [entries, goals] = await Promise.all([
    getBudgetEntries(),
    import("./savings").then((m) => m.getSavingsGoals(true)),
  ]);
  const rows: string[] = [];
  rows.push("date,amount,category,note,type");
  for (const e of entries as { date: string; amount_cents: number; category: string | null; note: string | null }[]) {
    const type = e.amount_cents >= 0 ? "income" : "expense";
    const amount = (e.amount_cents / 100).toFixed(2);
    rows.push([e.date, amount, escapeCsv(e.category ?? ""), escapeCsv(e.note ?? ""), type].join(","));
  }
  rows.push("");
  rows.push("name,target_cents,current_cents,deadline,status");
  for (const g of goals as { name: string; target_cents: number; current_cents: number; deadline: string | null; status?: string }[]) {
    rows.push([escapeCsv(g.name), g.target_cents, g.current_cents, g.deadline ?? "", g.status ?? ""].join(","));
  }
  return rows.join("\n");
}

/** Recurring budget templates (returns [] if table not yet migrated) */
export async function getRecurringTemplates() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from("recurring_budget_templates")
      .select("*")
      .eq("user_id", user.id)
      .order("next_generate_date", { ascending: true });
    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}

export async function createRecurringTemplate(params: {
  amount_cents: number;
  category?: string | null;
  note?: string | null;
  recurrence_rule: "weekly" | "monthly";
  day_of_week?: number | null;
  day_of_month?: number | null;
  next_generate_date: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from("recurring_budget_templates").insert({
    user_id: user.id,
    amount_cents: params.amount_cents,
    category: params.category ?? null,
    note: params.note ?? null,
    recurrence_rule: params.recurrence_rule,
    day_of_week: params.day_of_week ?? null,
    day_of_month: params.day_of_month ?? null,
    next_generate_date: params.next_generate_date,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/budget");
}

export async function deleteRecurringTemplate(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from("recurring_budget_templates").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/budget");
}

/** Create budget entries from templates that are due and advance next_generate_date */
export async function generateRecurringEntries() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const today = new Date().toISOString().slice(0, 10);
  const { data: templates } = await supabase
    .from("recurring_budget_templates")
    .select("*")
    .eq("user_id", user.id)
    .lte("next_generate_date", today);
  if (!templates?.length) return;
  for (const t of templates as { id: string; amount_cents: number; category: string | null; note: string | null; recurrence_rule: string; day_of_week: number | null; day_of_month: number | null; next_generate_date: string }[]) {
    await supabase.from("budget_entries").insert({
      user_id: user.id,
      amount_cents: t.amount_cents,
      date: t.next_generate_date,
      category: t.category,
      note: t.note,
      is_planned: true,
    });
    let next = t.next_generate_date;
    if (t.recurrence_rule === "weekly") {
      const d = new Date(next);
      d.setDate(d.getDate() + 7);
      next = d.toISOString().slice(0, 10);
    } else {
      const d = new Date(next);
      d.setMonth(d.getMonth() + 1);
      next = d.toISOString().slice(0, 10);
    }
    await supabase.from("recurring_budget_templates").update({ next_generate_date: next, updated_at: new Date().toISOString() }).eq("id", t.id).eq("user_id", user.id);
  }
  revalidatePath("/budget");
}
