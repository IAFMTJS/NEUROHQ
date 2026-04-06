"use server";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import { revalidatePath } from "next/cache";
import {
  addDays,
  getBudgetToday,
  getBudgetMonthBounds,
  getBudgetWeekBounds,
  getBudgetCycleBounds,
  getPreviousPaydayDateFromDay,
  getNextPaydayDateFromDay,
} from "@/lib/utils/budget-date";
import { createAlternative } from "./alternatives";
import { addSavingsContribution } from "./savings";
import { getBudgetControlState, setBudgetNoSpendLock, submitEmergencyExpenseReason } from "./budget-intelligence";

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
type BudgetEntryInsert = Database["public"]["Tables"]["budget_entries"]["Insert"];

async function logUserActionAudit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  actionType: string,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    await supabase.from("user_actions_audit").insert({
      user_id: userId,
      action_type: actionType,
      payload,
    } as never);
  } catch {
    // Keep primary flows functional even when audit table is unavailable.
  }
}

/** Explicit column list for budget_entries reads (per SUPABASE_PERFORMANCE_GUIDELINES). */
const BUDGET_ENTRY_SELECT =
  "id, user_id, amount_cents, date, category, note, is_planned, freeze_until, freeze_reminder_sent, recurring, store_name, subscription_name, detail_name, created_at, updated_at";

export type BudgetPageEntryBundle = {
  entries: BudgetEntryRow[];
  nextMonthEntries: BudgetEntryRow[];
  prevMonthEntries: BudgetEntryRow[];
  currentMonthExpenses: number;
  currentMonthIncome: number;
  currentWeekExpenses: number;
  currentWeekIncome: number;
};

function minDateStr(...dates: string[]): string {
  return dates.reduce((a, b) => (a < b ? a : b));
}

function maxDateStr(...dates: string[]): string {
  return dates.reduce((a, b) => (a > b ? a : b));
}

function filterEntriesByDateRange(rows: BudgetEntryRow[], from: string, to: string): BudgetEntryRow[] {
  return rows.filter((e) => e.date >= from && e.date <= to);
}

function sumExpenseIncomeCents(rows: BudgetEntryRow[]): { expenses: number; income: number } {
  let expenses = 0;
  let income = 0;
  for (const r of rows) {
    const c = r.amount_cents ?? 0;
    if (c < 0) expenses += Math.abs(c);
    else if (c > 0) income += c;
  }
  return { expenses, income };
}

/**
 * Single budget_entries round-trip for /budget: three period slices + period/week totals.
 * Replaces 3× getBudgetEntries + 4× aggregate queries that each re-authenticated and re-hit the DB.
 */
export async function getBudgetPageEntryBundle(params: {
  periodStart: string;
  periodEnd: string;
  nextMonthStart: string;
  nextMonthEnd: string;
  prevStart: string;
  prevEnd: string;
}): Promise<BudgetPageEntryBundle> {
  const empty: BudgetPageEntryBundle = {
    entries: [],
    nextMonthEntries: [],
    prevMonthEntries: [],
    currentMonthExpenses: 0,
    currentMonthIncome: 0,
    currentWeekExpenses: 0,
    currentWeekIncome: 0,
  };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return empty;

  const { start: weekStart, end: weekEnd } = getBudgetWeekBounds();
  const minD = minDateStr(params.periodStart, params.nextMonthStart, params.prevStart, weekStart);
  const maxD = maxDateStr(params.periodEnd, params.nextMonthEnd, params.prevEnd, weekEnd);

  const { data } = await supabase
    .from("budget_entries")
    .select(BUDGET_ENTRY_SELECT)
    .eq("user_id", user.id)
    .gte("date", minD)
    .lte("date", maxD)
    .order("date", { ascending: false });

  const all = (data ?? []) as BudgetEntryRow[];
  const entries = filterEntriesByDateRange(all, params.periodStart, params.periodEnd);
  const nextMonthEntries = filterEntriesByDateRange(all, params.nextMonthStart, params.nextMonthEnd);
  const prevMonthEntries = filterEntriesByDateRange(all, params.prevStart, params.prevEnd);

  const periodSums = sumExpenseIncomeCents(filterEntriesByDateRange(all, params.periodStart, params.periodEnd));
  const weekSums = sumExpenseIncomeCents(filterEntriesByDateRange(all, weekStart, weekEnd));

  return {
    entries,
    nextMonthEntries,
    prevMonthEntries,
    currentMonthExpenses: periodSums.expenses,
    currentMonthIncome: periodSums.income,
    currentWeekExpenses: weekSums.expenses,
    currentWeekIncome: weekSums.income,
  };
}

/** Explicit columns for recurring_budget_templates reads. */
const RECURRING_TEMPLATE_SELECT =
  "id, user_id, amount_cents, category, note, recurrence_rule, day_of_week, day_of_month, next_generate_date, created_at, updated_at";

export type ScheduledNextBudget = {
  applies_from: string;
  monthly_budget_cents: number | null;
  monthly_savings_cents: number | null;
  budget_period: "monthly" | "weekly" | null;
};

type BudgetSettingsResult = {
  monthly_budget_cents: number | null;
  monthly_savings_cents: number | null;
  currency: string;
  impulse_threshold_pct: number;
  budget_period: "monthly" | "weekly";
  impulse_quick_add_minutes: number | null;
  impulse_risk_categories: string[];
  /** Server row `updated_at` — compare with client persisted payday to avoid stale localStorage overwriting server */
  row_updated_at: string | null;
  /** Gepland voor volgende loonsperiode (nog niet actief). */
  scheduled_next_budget: ScheduledNextBudget | null;
};

type UserNextBudgetRow = {
  next_budget_applies_from?: string | null;
  next_period_monthly_budget_cents?: number | null;
  next_period_monthly_savings_cents?: number | null;
  next_budget_period?: string | null;
};

function mapScheduledNextBudget(row: UserNextBudgetRow): ScheduledNextBudget | null {
  const applies = row.next_budget_applies_from;
  if (applies == null || typeof applies !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(applies)) return null;
  const hasBudget = row.next_period_monthly_budget_cents != null;
  const hasSavings = row.next_period_monthly_savings_cents != null;
  const bp =
    row.next_budget_period === "weekly" || row.next_budget_period === "monthly"
      ? row.next_budget_period
      : null;
  if (!hasBudget && !hasSavings && !bp) return null;
  return {
    applies_from: applies,
    monthly_budget_cents: hasBudget ? row.next_period_monthly_budget_cents ?? null : null,
    monthly_savings_cents: hasSavings ? row.next_period_monthly_savings_cents ?? null : null,
    budget_period: bp,
  };
}

async function applyPendingNextPeriodBudgetIfDueWithClient(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<void> {
  const today = getBudgetToday();
  const { data: row } = await supabase
    .from("users")
    .select("next_budget_applies_from, next_period_monthly_budget_cents, next_period_monthly_savings_cents, next_budget_period")
    .eq("id", userId)
    .maybeSingle();
  if (!row) return;
  const r = row as UserNextBudgetRow;
  const appliesRaw = r.next_budget_applies_from;
  if (appliesRaw == null || typeof appliesRaw !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(appliesRaw)) return;
  if (today < appliesRaw) return;
  const hasBudget = r.next_period_monthly_budget_cents != null;
  const hasSavings = r.next_period_monthly_savings_cents != null;
  const hasPeriod = r.next_budget_period === "weekly" || r.next_budget_period === "monthly";
  if (!hasBudget && !hasSavings && !hasPeriod) return;

  const updates: Record<string, unknown> = {
    next_period_monthly_budget_cents: null,
    next_period_monthly_savings_cents: null,
    next_budget_applies_from: null,
    next_budget_period: null,
  };
  if (hasBudget) updates.monthly_budget_cents = r.next_period_monthly_budget_cents;
  if (hasSavings) updates.monthly_savings_cents = r.next_period_monthly_savings_cents;
  if (hasPeriod) updates.budget_period = r.next_budget_period;
  const { error } = await supabase.from("users").update(updates).eq("id", userId);
  if (error) {
    console.error("applyPendingNextPeriodBudgetIfDueWithClient", error.message);
  }
}

/** Idempotent: promotes scheduled next-period budget when `today` ≥ `next_budget_applies_from`. */
export async function applyPendingNextPeriodBudgetIfDue(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await applyPendingNextPeriodBudgetIfDueWithClient(supabase, user.id);
}

const defaultBudgetSettings = (): BudgetSettingsResult => ({
  monthly_budget_cents: null,
  monthly_savings_cents: null,
  currency: "EUR",
  impulse_threshold_pct: 40,
  budget_period: "monthly",
  impulse_quick_add_minutes: null,
  impulse_risk_categories: [],
  row_updated_at: null,
  scheduled_next_budget: null,
});

/** Dedupe reads when dashboard critical + secondary (and bootstrap) run in the same request. */
const loadBudgetSettings = cache(async (): Promise<BudgetSettingsResult> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return defaultBudgetSettings();

  await applyPendingNextPeriodBudgetIfDueWithClient(supabase, user.id);

  const { data } = await supabase
    .from("users")
    .select(
      "monthly_budget_cents, monthly_savings_cents, currency, impulse_threshold_pct, budget_period, impulse_quick_add_minutes, impulse_risk_categories, updated_at, next_budget_applies_from, next_period_monthly_budget_cents, next_period_monthly_savings_cents, next_budget_period"
    )
    .eq("id", user.id)
    .single();
  const row = (data ?? {}) as BudgetSettingsRow &
    UserNextBudgetRow & { updated_at?: string | null };
  const riskCat = row.impulse_risk_categories;
  return {
    monthly_budget_cents: row.monthly_budget_cents ?? null,
    monthly_savings_cents: row.monthly_savings_cents ?? null,
    currency: row.currency && String(row.currency).trim() ? String(row.currency).toUpperCase() : "EUR",
    impulse_threshold_pct: typeof row.impulse_threshold_pct === "number" ? row.impulse_threshold_pct : 40,
    budget_period: row.budget_period === "weekly" ? "weekly" : "monthly",
    impulse_quick_add_minutes: typeof row.impulse_quick_add_minutes === "number" ? row.impulse_quick_add_minutes : null,
    impulse_risk_categories: Array.isArray(riskCat) ? riskCat.filter((c): c is string => typeof c === "string") : [],
    row_updated_at: typeof row.updated_at === "string" ? row.updated_at : null,
    scheduled_next_budget: mapScheduledNextBudget(row),
  };
});

/** Get user's budget settings from users table */
export async function getBudgetSettings(): Promise<BudgetSettingsResult> {
  return loadBudgetSettings();
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
  /** Zet budget/spaarvoorkeur voor de eerstvolgende loonsperiode (actief vanaf dag na huidige periodEnd, of bij "Vandaag loon gehad"). */
  apply_to_next_period?: boolean;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (params.apply_to_next_period) {
    const hasAny =
      params.monthly_budget_cents !== undefined ||
      params.monthly_savings_cents !== undefined ||
      params.budget_period !== undefined;
    if (!hasAny) throw new Error("Geen budget om te plannen.");
    const { periodEnd } = await getBudgetPeriodBounds();
    const appliesFrom = addDays(periodEnd, 1);
    const nextUpdates: Record<string, unknown> = {
      next_budget_applies_from: appliesFrom,
    };
    if (params.monthly_budget_cents !== undefined)
      nextUpdates.next_period_monthly_budget_cents = params.monthly_budget_cents;
    if (params.monthly_savings_cents !== undefined)
      nextUpdates.next_period_monthly_savings_cents = params.monthly_savings_cents;
    if (params.budget_period !== undefined) nextUpdates.next_budget_period = params.budget_period ?? "monthly";
    const { error } = await supabase.from("users").update(nextUpdates).eq("id", user.id);
    if (error) throw new Error(error.message);
    revalidatePath("/budget");
    revalidatePath("/settings");
    revalidatePath("/profile");
    revalidatePath("/dashboard");
    return;
  }

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
    revalidatePath("/profile");
  revalidatePath("/dashboard");
}

/** Set "vandaag loon gehad": start budgetperiode vandaag tot volgende verwachte loondag. */
export async function setPaydayReceivedToday(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: before } = await supabase
    .from("users")
    .select(
      "last_payday_date, next_period_monthly_budget_cents, next_period_monthly_savings_cents, next_budget_period"
    )
    .eq("id", user.id)
    .single();
  const previousLastPaydayDate =
    (before as { last_payday_date?: string | null } | null)?.last_payday_date ?? null;
  const today = getBudgetToday();
  const row = before as UserNextBudgetRow | null;
  const updates: Record<string, unknown> = {
    last_payday_date: today,
    next_period_monthly_budget_cents: null,
    next_period_monthly_savings_cents: null,
    next_budget_applies_from: null,
    next_budget_period: null,
  };
  if (row?.next_period_monthly_budget_cents != null)
    updates.monthly_budget_cents = row.next_period_monthly_budget_cents;
  if (row?.next_period_monthly_savings_cents != null)
    updates.monthly_savings_cents = row.next_period_monthly_savings_cents;
  if (row?.next_budget_period === "weekly" || row?.next_budget_period === "monthly")
    updates.budget_period = row.next_budget_period;
  const { error } = await supabase.from("users").update(updates).eq("id", user.id);
  if (error) throw new Error(error.message);
  await logUserActionAudit(supabase, user.id, "payday_received_today", {
    previous_last_payday_date: previousLastPaydayDate,
    new_last_payday_date: today,
    promoted_scheduled_budget:
      row?.next_period_monthly_budget_cents != null || row?.next_period_monthly_savings_cents != null,
  });
  revalidatePath("/budget");
  revalidatePath("/settings");
  revalidatePath("/profile");
  revalidatePath("/dashboard");
}

/** Undo "vandaag loon gehad": restore previous last_payday_date. Call within short window after setPaydayReceivedToday. */
export async function undoPaydayReceived(previousLastPaydayDate: string | null): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  if (previousLastPaydayDate != null && !/^\d{4}-\d{2}-\d{2}$/.test(previousLastPaydayDate)) {
    throw new Error("Invalid date format");
  }
  const { error } = await supabase
    .from("users")
    .update({ last_payday_date: previousLastPaydayDate || null })
    .eq("id", user.id);
  if (error) throw new Error(error.message);
  await logUserActionAudit(supabase, user.id, "undo_payday_received", {
    restored_last_payday_date: previousLastPaydayDate || null,
  });
  revalidatePath("/budget");
    revalidatePath("/settings");
    revalidatePath("/profile");
  revalidatePath("/dashboard");
}

/**
 * Current budget period bounds: payday cycle when user has set last_payday_date or payday day,
 * otherwise calendar month (1st–last day).
 * - With last_payday_date: period = that date until day before next payday; end stays fixed until user pushes "Vandaag loon gehad".
 * - With only payday_day_of_month (or income_sources): period = last passed payday until day before next payday.
 */
export async function getBudgetPeriodBounds(): Promise<{
  periodStart: string;
  periodEnd: string;
  isPaydayCycle: boolean;
  /** Resolved payday day 1–31 for labels / pacing (same as former getPaydayDayOfMonth default path). */
  paydayDayOfMonth: number | null;
}> {
  const today = getBudgetToday();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const { monthStart, monthEnd } = getBudgetMonthBounds();
    return { periodStart: monthStart, periodEnd: monthEnd, isPaydayCycle: false, paydayDayOfMonth: null };
  }
  const { data: userRow } = await supabase
    .from("users")
    .select("last_payday_date, payday_day_of_month")
    .eq("id", user.id)
    .single();
  const lastPayday = (userRow as { last_payday_date?: string | null } | null)?.last_payday_date ?? null;
  // User-configured payday day (via Settings/Budget or Payday card) is authoritative.
  let paydayDay: number | null =
    ((userRow as { payday_day_of_month?: number | null } | null)?.payday_day_of_month ?? null) ?? null;
  if (paydayDay == null) {
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
  }
  if (paydayDay == null) {
    paydayDay = 25;
  }
  const day = Math.max(1, Math.min(31, paydayDay));

  if (lastPayday && /^\d{4}-\d{2}-\d{2}$/.test(lastPayday)) {
    const lastDate = new Date(lastPayday + "T12:00:00Z");
    const todayDate = new Date(today + "T12:00:00Z");
    if (lastDate.getTime() <= todayDate.getTime()) {
      const { periodStart, periodEnd } = getBudgetCycleBounds(today, lastPayday, day);
      return { periodStart, periodEnd, isPaydayCycle: true, paydayDayOfMonth: day };
    }
  }

  const prevPayday = getPreviousPaydayDateFromDay(today, day);
  const nextPayday = getNextPaydayDateFromDay(today, day);
  const periodEndDate = new Date(nextPayday + "T12:00:00Z");
  periodEndDate.setUTCDate(periodEndDate.getUTCDate() - 1);
  const periodEnd = periodEndDate.toISOString().slice(0, 10);
  return { periodStart: prevPayday, periodEnd, isPaydayCycle: true, paydayDayOfMonth: day };
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

const loadCurrentMonthExpensesCents = cache(async (): Promise<number> => {
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
});

/** Sum of expenses for current budget period (payday cycle if set, else calendar month) */
export async function getCurrentMonthExpensesCents(): Promise<number> {
  return loadCurrentMonthExpensesCents();
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

type AutoBudgetLockInput = {
  expenseDeltaCents: number;
  isPlanned: boolean;
  category?: string | null;
  source: "add" | "update";
};

function resolveAutoBudgetLockRule(input: {
  spendableCents: number;
  remainingBeforeCents: number;
  remainingAfterCents: number;
  expenseDeltaCents: number;
  isPlanned: boolean;
  daysToPayday: number | null;
}): { hours: number; reasonCode: string } | null {
  const {
    spendableCents,
    remainingBeforeCents,
    remainingAfterCents,
    expenseDeltaCents,
    isPlanned,
    daysToPayday,
  } = input;
  if (spendableCents <= 0 || expenseDeltaCents <= 0) return null;

  const crossedIntoNegative = remainingBeforeCents >= 0 && remainingAfterCents < 0;
  const deepOverspend = remainingAfterCents <= -Math.round(spendableCents * 0.15);
  const singleHitRatio = expenseDeltaCents / Math.max(1, spendableCents);
  const largeSingleHit = singleHitRatio >= 0.35;
  const impulseSpike = !isPlanned && singleHitRatio >= 0.22;
  const lateCycleUnplannedSpike =
    !isPlanned && daysToPayday != null && daysToPayday <= 4 && singleHitRatio >= 0.12;

  if (crossedIntoNegative && deepOverspend) {
    return { hours: 24, reasonCode: "crossed_budget_deep_overspend" };
  }
  if (crossedIntoNegative) {
    return { hours: 12, reasonCode: "crossed_budget_single_expense" };
  }
  if (remainingAfterCents < 0) {
    return { hours: 12, reasonCode: "budget_already_negative" };
  }
  if (largeSingleHit) {
    return { hours: 12, reasonCode: "single_expense_large_share" };
  }
  if (impulseSpike) {
    return { hours: 12, reasonCode: "impulse_spike" };
  }
  if (lateCycleUnplannedSpike) {
    return { hours: 8, reasonCode: "late_cycle_unplanned_spike" };
  }
  return null;
}

/**
 * Auto safety lock:
 * - Crossing below zero in one move => immediate 12h lock (24h when deep overspend).
 * - Large single-hit expense / unplanned spike => short cooldown lock.
 * Non-blocking: never throws into add/update flow.
 */
async function maybeApplyAutomaticBudgetLockAfterExpense(input: AutoBudgetLockInput): Promise<void> {
  try {
    const control = await getBudgetControlState();
    if (control.lockActive) return;

    const settings = await getBudgetSettings();
    const spendableCents = Math.max(
      0,
      (settings.monthly_budget_cents ?? 0) - (settings.monthly_savings_cents ?? 0)
    );
    if (spendableCents <= 0) return;

    const spentAfterCents = await getCurrentMonthExpensesCents();
    const remainingAfterCents = spendableCents - spentAfterCents;
    const remainingBeforeCents = remainingAfterCents + Math.max(0, input.expenseDeltaCents);

    const rule = resolveAutoBudgetLockRule({
      spendableCents,
      remainingBeforeCents,
      remainingAfterCents,
      expenseDeltaCents: Math.max(0, input.expenseDeltaCents),
      isPlanned: input.isPlanned,
      daysToPayday: control.daysToPayday,
    });
    if (!rule) return;

    const unlockAt = new Date(Date.now() + rule.hours * 60 * 60 * 1000);
    await setBudgetNoSpendLock({
      days: Math.max(1, Math.ceil(rule.hours / 24)),
      lockUntilAtIso: unlockAt.toISOString(),
      bypassStrategyCap: true,
      reason: [
        `AUTO_LOCK:${rule.reasonCode}`,
        `source=${input.source}`,
        `remaining_after_cents=${remainingAfterCents}`,
        `expense_delta_cents=${Math.max(0, input.expenseDeltaCents)}`,
        `category=${(input.category ?? "unknown").slice(0, 40)}`,
      ].join(";"),
    });
  } catch {
    // Auto lock is safety-only and must never block the budget mutation.
  }
}

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
    .select(BUDGET_ENTRY_SELECT)
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
    .select(BUDGET_ENTRY_SELECT)
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
  store_name?: string | null;
  subscription_name?: string | null;
  detail_name?: string | null;
  emergency_override_reason?: string | null;
}): Promise<{ id: string } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  if (params.amount_cents < 0) {
    const control = await getBudgetControlState();
    const emergencyReason = params.emergency_override_reason?.trim() ?? "";
    if (control.needsPaydaySurvey) {
      throw new Error("Vul eerst de verplichte pre-payday survey in (T-4) in de Optimization-tab.");
    }
    if (control.lockActive && emergencyReason.length < 6) {
      throw new Error("Budget lock actief: nooduitgaven vereisen een duidelijke reden (min. 6 tekens).");
    }
  }
  const row: BudgetEntryInsert = {
    user_id: user.id,
    amount_cents: params.amount_cents,
    date: params.date,
    category: params.category ?? null,
    note: params.note ?? null,
    is_planned: params.is_planned ?? false,
    store_name: params.store_name ?? null,
    subscription_name: params.subscription_name ?? null,
    detail_name: params.detail_name ?? null,
  };
  const { data, error } = await supabase
    .from("budget_entries")
    .insert(row)
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  if (params.amount_cents < 0 && params.emergency_override_reason?.trim()) {
    await submitEmergencyExpenseReason({
      amountCents: Math.abs(params.amount_cents),
      category: params.category ?? "unknown",
      reason: params.emergency_override_reason.trim(),
    });
  }
  if (params.amount_cents < 0) {
    await maybeApplyAutomaticBudgetLockAfterExpense({
      expenseDeltaCents: Math.abs(params.amount_cents),
      isPlanned: params.is_planned ?? false,
      category: params.category ?? null,
      source: "add",
    });
  }
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
  store_name?: string | null;
  subscription_name?: string | null;
  detail_name?: string | null;
  emergency_override_reason?: string | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: existingRow, error: existingError } = await supabase
    .from("budget_entries")
    .select("amount_cents, is_planned, category")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (existingError) throw new Error(existingError.message);
  if (!existingRow) throw new Error("Budget entry not found.");

  const previousAmount = (existingRow as { amount_cents?: number | null }).amount_cents ?? 0;
  const nextAmount = params.amount_cents ?? previousAmount;
  if (nextAmount < 0) {
    const control = await getBudgetControlState();
    const emergencyReason = params.emergency_override_reason?.trim() ?? "";
    if (control.needsPaydaySurvey) {
      throw new Error("Vul eerst de verplichte pre-payday survey in (T-4) in de Optimization-tab.");
    }
    if (control.lockActive && emergencyReason.length < 6) {
      throw new Error("Budget lock actief: nooduitgaven vereisen een duidelijke reden (min. 6 tekens).");
    }
  }
  const { error } = await supabase
    .from("budget_entries")
    .update(params)
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  if (nextAmount < 0 && params.emergency_override_reason?.trim()) {
    await submitEmergencyExpenseReason({
      amountCents: Math.abs(nextAmount),
      category: params.category ?? (existingRow as { category?: string | null }).category ?? "unknown",
      reason: params.emergency_override_reason.trim(),
    });
  }
  if (nextAmount < 0) {
    const previousExpenseCents = previousAmount < 0 ? Math.abs(previousAmount) : 0;
    const nextExpenseCents = Math.abs(nextAmount);
    const expenseDeltaCents = Math.max(0, nextExpenseCents - previousExpenseCents);
    if (expenseDeltaCents > 0) {
      await maybeApplyAutomaticBudgetLockAfterExpense({
        expenseDeltaCents,
        isPlanned: params.is_planned ?? ((existingRow as { is_planned?: boolean | null }).is_planned ?? false),
        category: params.category ?? (existingRow as { category?: string | null }).category ?? null,
        source: "update",
      });
    }
  }
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
    try {
      await addSavingsContribution(options.addToGoalId, amountAbs, "Impuls geannuleerd → spaardoel");
    } catch {
      // Goal missing or RLS — still clear freeze below
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
  revalidatePath("/strategy");
}

export async function getFrozenEntries(): Promise<BudgetEntryRow[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("budget_entries")
    .select(BUDGET_ENTRY_SELECT)
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
    .select(BUDGET_ENTRY_SELECT)
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
    .select(BUDGET_ENTRY_SELECT)
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
      .select(RECURRING_TEMPLATE_SELECT)
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
    .select(RECURRING_TEMPLATE_SELECT)
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
