"use server";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import { revalidatePath } from "next/cache";
import { getBudgetToday, getBudgetMonthBounds, getBudgetWeekBounds, getBudgetCycleBounds, getPreviousPaydayDateFromDay, getNextPaydayDateFromDay } from "@/lib/utils/budget-date";
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

type BudgetEntryRow = Database["public"]["Tables"]["budget_entries"]["Row"];

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
  payday_day_of_month?: number | null;
  last_payday_date?: string | null;
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
  if (params.payday_day_of_month !== undefined) {
    const d = params.payday_day_of_month;
    updates.payday_day_of_month = d == null ? null : Math.max(1, Math.min(31, d));
  }
  if (params.last_payday_date !== undefined) updates.last_payday_date = params.last_payday_date || null;
  const { error } = await supabase.from("users").update(updates).eq("id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/budget");
  revalidatePath("/settings");
}

/** Set "vandaag loon gehad": start budgetperiode vandaag tot volgende verwachte loondag. */
export async function setPaydayReceivedToday(): Promise<void> {
  const today = getBudgetToday();
  await updateBudgetSettings({ last_payday_date: today });
}

/**
 * Current budget period bounds: payday cycle when user has set last_payday_date or payday day,
 * otherwise calendar month (1st–last day).
 * - With last_payday_date: period = that date until day before next payday (rolls forward after next payday).
 * - With only payday_day_of_month (or income_sources): period = last passed payday until day before next payday.
 */
export async function getBudgetPeriodBounds(): Promise<{
  periodStart: string;
  periodEnd: string;
  isPaydayCycle: boolean;
}> {
  const today = getBudgetToday();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const { monthStart, monthEnd } = getBudgetMonthBounds();
    return { periodStart: monthStart, periodEnd: monthEnd, isPaydayCycle: false };
  }
  let paydayDay: number | null = null;
  try {
    const { data: incomeRows } = await supabase
      .from("income_sources")
      .select("day_of_month")
      .eq("user_id", user.id)
      .order("day_of_month", { ascending: true })
      .limit(1);
    if (incomeRows?.[0]?.day_of_month != null) {
      const d = Number(incomeRows[0].day_of_month);
      if (d >= 1 && d <= 31) paydayDay = d;
    }
  } catch {
    /* table may not exist */
  }
  const { data: userRow } = await supabase
    .from("users")
    .select("last_payday_date, payday_day_of_month")
    .eq("id", user.id)
    .single();
  const lastPayday = (userRow as { last_payday_date?: string | null } | null)?.last_payday_date ?? null;
  if (paydayDay == null) {
    const u = (userRow as { payday_day_of_month?: number | null } | null)?.payday_day_of_month ?? null;
    paydayDay = u != null && u >= 1 && u <= 31 ? u : 25;
  }
  const day = Math.max(1, Math.min(31, paydayDay));

  if (lastPayday && /^\d{4}-\d{2}-\d{2}$/.test(lastPayday)) {
    const lastDate = new Date(lastPayday + "T12:00:00Z");
    const todayDate = new Date(today + "T12:00:00Z");
    if (lastDate.getTime() <= todayDate.getTime()) {
      const { periodStart, periodEnd } = getBudgetCycleBounds(today, lastPayday, day);
      return { periodStart, periodEnd, isPaydayCycle: true };
    }
  }

  const prevPayday = getPreviousPaydayDateFromDay(today, day);
  const nextPayday = getNextPaydayDateFromDay(today, day);
  const periodEndDate = new Date(nextPayday + "T12:00:00Z");
  periodEndDate.setUTCDate(periodEndDate.getUTCDate() - 1);
  const periodEnd = periodEndDate.toISOString().slice(0, 10);
  return { periodStart: prevPayday, periodEnd, isPaydayCycle: true };
}

/** Get payday day of month (1–31) when no income_sources; used for "days until next income" */
export async function getPaydayDayOfMonth(): Promise<number | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase.from("users").select("payday_day_of_month").eq("id", user.id).single();
    const d = (data as { payday_day_of_month?: number | null } | null)?.payday_day_of_month;
    return d != null && d >= 1 && d <= 31 ? d : null;
  } catch {
    return null;
  }
}

/** Sum of expenses for current budget period (payday cycle if set, else calendar month) */
export async function getCurrentMonthExpensesCents(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const { periodStart: start, periodEnd: end } = await getBudgetPeriodBounds();
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

/** Sum of income for current budget period (payday cycle if set, else calendar month) */
export async function getCurrentMonthIncomeCents(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const { periodStart: start, periodEnd: end } = await getBudgetPeriodBounds();
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

/** Sum of expenses for current week (Mon–Sun, Europe/Amsterdam) */
export async function getCurrentWeekExpensesCents(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const { start, end } = getBudgetWeekBounds();
  const { data } = await supabase
    .from("budget_entries")
    .select("amount_cents")
    .eq("user_id", user.id)
    .lt("amount_cents", 0)
    .gte("date", start)
    .lte("date", end);
  return (data ?? []).reduce((sum, r) => sum + Math.abs(r.amount_cents ?? 0), 0);
}

/** Sum of income for current week (Mon–Sun, Europe/Amsterdam) */
export async function getCurrentWeekIncomeCents(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const { start, end } = getBudgetWeekBounds();
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
const BASE_FREEZE_HOURS = 24;

async function getFreezeHours(): Promise<number> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return BASE_FREEZE_HOURS;
    const { data } = await supabase
      .from("user_skills")
      .select("skill_key")
      .eq("user_id", user.id);
    const skills = (data ?? []) as { skill_key: string }[];
    const hasImpulseShield = skills.some((s) => s.skill_key === "impulse_shield");
    return hasImpulseShield ? 48 : BASE_FREEZE_HOURS;
  } catch {
    return BASE_FREEZE_HOURS;
  }
}

export async function getBudgetEntries(fromDate?: string, toDate?: string): Promise<BudgetEntryRow[]> {
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
  return (data ?? []) as BudgetEntryRow[];
}

/** Copy entries older than the given date (e.g. start of current month) to archive. Keeps originals. For analytics and slim budgetbeheer. */
export async function copyOldBudgetEntriesToArchive(olderThanDate: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data: rows } = await supabase
    .from("budget_entries")
    .select("*")
    .eq("user_id", user.id)
    .lt("date", olderThanDate);
  if (!rows?.length) return;
  type BudgetEntryArchiveInsert = Database["public"]["Tables"]["budget_entries_archive"]["Insert"];
  const typedRows = rows as BudgetEntryRow[];
  const archive: BudgetEntryArchiveInsert[] = typedRows.map((r) => ({
    id: r.id,
    user_id: r.user_id,
    amount_cents: r.amount_cents,
    date: r.date,
    category: r.category ?? null,
    note: r.note ?? null,
    is_planned: r.is_planned ?? false,
    freeze_until: r.freeze_until ?? null,
    freeze_reminder_sent: r.freeze_reminder_sent ?? false,
    recurring: r.recurring ?? false,
    created_at: r.created_at,
    updated_at: r.updated_at,
    archived_at: new Date().toISOString(),
  }));
  await supabase.from("budget_entries_archive").upsert(archive, { onConflict: "id" });
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
  const hours = await getFreezeHours();
  until.setHours(until.getHours() + hours);
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

export async function getFrozenEntries(): Promise<BudgetEntryRow[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("budget_entries")
    .select("*")
    .eq("user_id", user.id)
    .not("freeze_until", "is", null)
    .gt("freeze_until", new Date().toISOString());
  return (data ?? []) as BudgetEntryRow[];
}

export async function getEntriesReadyForFreezeReminder(): Promise<BudgetEntryRow[]> {
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
  return (data ?? []) as BudgetEntryRow[];
}

/** Entries with freeze_until <= now — ready for user to Confirm or Cancel (24h passed). */
export async function getFrozenEntriesReadyForAction(): Promise<BudgetEntryRow[]> {
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
  return (data ?? []) as BudgetEntryRow[];
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
  const { start, end } = getBudgetWeekBounds();
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
type RecurringTemplateRow = Database["public"]["Tables"]["recurring_budget_templates"]["Row"];

export async function getRecurringTemplates(): Promise<RecurringTemplateRow[]> {
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
    return (data ?? []) as RecurringTemplateRow[];
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
  const today = getBudgetToday();
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
