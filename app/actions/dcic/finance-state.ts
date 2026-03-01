/**
 * Dark Commander Intelligence Core - Finance State Server Actions
 * CRUD operations for financeState integrated with gameState
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { FinanceState, IncomeSource, BudgetTarget, Expense, SavingsGoal } from "@/lib/dcic/types";
import {
  calculateSafeDailySpend,
  getDaysUntilNextIncome,
  getNextPaydayDate,
  calculateDisciplineScore,
  forecastEndOfCycle,
  generateInsights,
  calculateWeeklyAllowance,
  auditSubscriptions,
  checkEmergencyMode,
} from "@/lib/dcic/finance-engine";
import { getBudgetToday, getPreviousPaydayDateFromDay } from "@/lib/utils/budget-date";

/**
 * Gets financeState from database
 */
export async function getFinanceState(): Promise<FinanceState | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // 1) Income sources: prefer income_sources table (payday + amount per month)
  let incomeSources: IncomeSource[] = [];
  try {
    const { data: incomeRows } = await supabase
      .from("income_sources")
      .select("id, name, amount_cents, day_of_month, type")
      .eq("user_id", user.id)
      .order("day_of_month", { ascending: true });
    if (incomeRows?.length) {
      incomeSources = incomeRows.map((r: { id: string; name: string; amount_cents: number; day_of_month: number; type: string }) => ({
        id: r.id,
        name: r.name,
        amount: r.amount_cents,
        dayOfMonth: Math.max(1, Math.min(31, r.day_of_month)),
        type: (r.type === "weekly" || r.type === "biweekly" ? r.type : "monthly") as "monthly" | "weekly" | "biweekly",
      }));
    }
  } catch {
    // Table may not exist yet
  }
  // 2) Fallback: payday_day_of_month on users (single “salary day”)
  if (incomeSources.length === 0) {
    try {
      const { data: userRow } = await supabase.from("users").select("payday_day_of_month").eq("id", user.id).single();
      const paydayDay = extractDayOfMonth((userRow as { payday_day_of_month?: number | null } | null)?.payday_day_of_month ?? 25);
      incomeSources = [{ id: "default-payday", name: "Salaris", amount: 0, dayOfMonth: paydayDay, type: "monthly" }];
    } catch {
      incomeSources = [{ id: "default-payday", name: "Salaris", amount: 0, dayOfMonth: 25, type: "monthly" }];
    }
  }

  // Get budget settings and optional last_payday_date for period "van loon tot volgend loon"
  const { data: userRow } = await supabase
    .from("users")
    .select("budget_period, last_payday_date")
    .eq("id", user.id)
    .single();

  const lastPaydayDateStr = (userRow as { last_payday_date?: string | null } | null)?.last_payday_date ?? null;

  const todayStr = getBudgetToday();
  const today = new Date(todayStr + "T12:00:00Z");
  const paydayDay = incomeSources[0]?.dayOfMonth ?? 25;

  let cycleStart: Date;
  if (lastPaydayDateStr && /^\d{4}-\d{2}-\d{2}$/.test(lastPaydayDateStr)) {
    cycleStart = new Date(lastPaydayDateStr + "T12:00:00Z");
    if (cycleStart.getTime() > today.getTime()) {
      cycleStart = new Date(getPreviousPaydayDateFromDay(todayStr, paydayDay) + "T12:00:00Z");
    }
  } else {
    cycleStart = new Date(getPreviousPaydayDateFromDay(todayStr, paydayDay) + "T12:00:00Z");
  }

  const cycleStartDateStr = cycleStart.toISOString().slice(0, 10);

  const { data: entries } = await supabase
    .from("budget_entries")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", cycleStart.toISOString().split("T")[0]);

  const totalIncome = (entries || [])
    .filter((e) => e.amount_cents > 0)
    .reduce((sum, e) => sum + e.amount_cents, 0);

  const totalExpenses = (entries || [])
    .filter((e) => e.amount_cents < 0)
    .reduce((sum, e) => sum + Math.abs(e.amount_cents), 0);

  const currentBalance = totalIncome - totalExpenses;

  // Budget targets: from budget_targets table, or defaults from monthly_budget_cents
  const { data: budgetSettings } = await supabase
    .from("users")
    .select("monthly_budget_cents, monthly_savings_cents")
    .eq("id", user.id)
    .single();
  const monthlyBudget = budgetSettings?.monthly_budget_cents ?? 0;
  const monthlySavings = budgetSettings?.monthly_savings_cents ?? 0;

  const { data: targetRows } = await supabase
    .from("budget_targets")
    .select("category, target_cents, priority, flexible")
    .eq("user_id", user.id);
  let budgetTargets: BudgetTarget[];
  if (targetRows?.length) {
    budgetTargets = targetRows.map((r: { category: string; target_cents: number; priority: number; flexible: boolean }) => ({
      category: r.category,
      target: r.target_cents,
      priority: r.priority,
      flexible: r.flexible,
    }));
  } else {
    budgetTargets = [
      { category: "Housing", target: Math.floor(monthlyBudget * 0.3), priority: 1, flexible: false },
      { category: "Food", target: Math.floor(monthlyBudget * 0.14), priority: 2, flexible: true },
      { category: "Transport", target: Math.floor(monthlyBudget * 0.06), priority: 2, flexible: true },
      { category: "Subscriptions", target: Math.floor(monthlyBudget * 0.04), priority: 3, flexible: true },
      { category: "Fun", target: Math.floor(monthlyBudget * 0.09), priority: 3, flexible: true },
      { category: "Savings", target: monthlySavings, priority: 1, flexible: false },
    ];
  }

  // Get expenses
  const expenses: Expense[] = (entries || [])
    .filter((e) => e.amount_cents < 0)
    .map((e) => ({
      id: e.id,
      amount: e.amount_cents,
      date: e.date,
      category: e.category,
      note: e.note,
      recurring: false, // TODO: Check recurring templates
      isPlanned: e.is_planned || false,
    }));

  // Get savings goals
  const { data: goalsData } = await supabase
    .from("savings_goals")
    .select("*")
    .eq("user_id", user.id);

  const goals: SavingsGoal[] = (goalsData || []).map((g) => ({
    id: g.id,
    name: g.name,
    target: g.target_cents,
    current: g.current_cents,
    deadline: g.deadline,
  }));

  // Weekly review history (last 4 weeks) for discipline index.
  let weeklyReviewsCompletedLast4Weeks: number | undefined;
  let weeksConsideredForReviews: number | undefined;
  try {
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    const fourWeeksAgoStr = fourWeeksAgo.toISOString().slice(0, 10);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- table may be missing from generated types
    const { data: reviewRows } = await (supabase as any)
      .from("budget_weekly_reviews")
      .select("week_start")
      .eq("user_id", user.id)
      .gte("week_start", fourWeeksAgoStr);
    const completedWeeks = new Set(
      ((reviewRows ?? []) as { week_start: string }[]).map((r) => r.week_start)
    ).size;
    weeklyReviewsCompletedLast4Weeks = completedWeeks;
    weeksConsideredForReviews = 4;
  } catch {
    // Table may not exist yet; leave undefined.
  }

  // Calculate discipline score
  const financeState: FinanceState = {
    income: {
      sources: incomeSources,
    },
    cycle: {
      startDay: extractDayOfMonth(incomeSources[0]?.dayOfMonth || 25),
      startDate: cycleStartDateStr,
    },
    balance: {
      current: currentBalance,
    },
    budgetTargets,
    expenses,
    goals,
    disciplineScore: 0, // Will be calculated
    weeklyReviewsCompletedLast4Weeks,
    weeksConsideredForReviews,
  };

  // Calculate discipline score
  financeState.disciplineScore = calculateDisciplineScore(financeState);

  return financeState;
}

/**
 * Saves financeState to database
 */
export async function saveFinanceState(financeState: FinanceState): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  try {
    // Update budget settings
    const totalBudget = financeState.budgetTargets.reduce((sum, t) => sum + t.target, 0);
    const savingsTarget = financeState.budgetTargets.find((t) => t.category === "Savings")?.target || 0;

    await supabase
      .from("users")
      .update({
        monthly_budget_cents: totalBudget,
        monthly_savings_cents: savingsTarget,
      })
      .eq("id", user.id);

    // Update savings goals
    for (const goal of financeState.goals) {
      await supabase
        .from("savings_goals")
        .update({
          current_cents: goal.current,
        })
        .eq("id", goal.id);
    }

    revalidatePath("/budget");
    revalidatePath("/dashboard");
    return true;
  } catch (error) {
    console.error("Error saving financeState:", error);
    return false;
  }
}

export type FinancialInsightsResult = {
  safeDailySpend: number;
  daysUntilNextIncome: number;
  /** Next expected payday YYYY-MM-DD for period label */
  nextPaydayDate: string;
  /** Current cycle start YYYY-MM-DD (last payday or first of month) */
  cycleStartDate: string;
  forecast: ReturnType<typeof forecastEndOfCycle>;
  insights: ReturnType<typeof generateInsights>;
  weeklyAllowance: ReturnType<typeof calculateWeeklyAllowance>;
  subscriptionAudit: ReturnType<typeof auditSubscriptions>;
  emergencyMode: ReturnType<typeof checkEmergencyMode>;
  disciplineScore: number;
};

/**
 * Gets financial insights (throws if no finance state)
 */
export async function getFinancialInsights(): Promise<FinancialInsightsResult> {
  const financeState = await getFinanceState();
  if (!financeState) throw new Error("Finance state not found");
  return {
    safeDailySpend: calculateSafeDailySpend(financeState),
    daysUntilNextIncome: getDaysUntilNextIncome(financeState),
    nextPaydayDate: getNextPaydayDate(financeState),
    cycleStartDate: financeState.cycle.startDate ?? new Date().toISOString().slice(0, 7) + "-01",
    forecast: forecastEndOfCycle(financeState),
    insights: generateInsights(financeState),
    weeklyAllowance: calculateWeeklyAllowance(financeState),
    subscriptionAudit: auditSubscriptions(financeState),
    emergencyMode: checkEmergencyMode(financeState),
    disciplineScore: financeState.disciplineScore,
  };
}

/**
 * Gets financial insights or null when no finance state (e.g. not logged in)
 */
export async function getFinancialInsightsSafe(): Promise<FinancialInsightsResult | null> {
  const financeState = await getFinanceState();
  if (!financeState) return null;
  return {
    safeDailySpend: calculateSafeDailySpend(financeState),
    daysUntilNextIncome: getDaysUntilNextIncome(financeState),
    nextPaydayDate: getNextPaydayDate(financeState),
    cycleStartDate: financeState.cycle.startDate ?? new Date().toISOString().slice(0, 7) + "-01",
    forecast: forecastEndOfCycle(financeState),
    insights: generateInsights(financeState),
    weeklyAllowance: calculateWeeklyAllowance(financeState),
    subscriptionAudit: auditSubscriptions(financeState),
    emergencyMode: checkEmergencyMode(financeState),
    disciplineScore: financeState.disciplineScore,
  };
}

/**
 * Helper to extract day of month from various formats
 */
function extractDayOfMonth(day: number | string | null): number {
  if (typeof day === "number") return Math.max(1, Math.min(31, day));
  if (typeof day === "string") {
    const parsed = parseInt(day, 10);
    if (!isNaN(parsed)) return Math.max(1, Math.min(31, parsed));
  }
  return 25; // Default
}

/** Get budget targets for current user (for plan per category) */
export async function getBudgetTargets(): Promise<{ category: string; target_cents: number; priority: number; flexible: boolean }[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase.from("budget_targets").select("category, target_cents, priority, flexible").eq("user_id", user.id);
  return (data ?? []) as { category: string; target_cents: number; priority: number; flexible: boolean }[];
}

/** Upsert budget target (plan: how much per category) */
export async function saveBudgetTarget(params: {
  category: string;
  target_cents: number;
  priority?: number;
  flexible?: boolean;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from("budget_targets").upsert(
    {
      user_id: user.id,
      category: params.category.trim(),
      target_cents: Math.max(0, params.target_cents),
      priority: Math.max(1, Math.min(3, params.priority ?? 2)),
      flexible: params.flexible ?? true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,category" }
  );
  if (error) throw new Error(error.message);
  revalidatePath("/budget");
  revalidatePath("/dashboard");
}

/** Delete budget target by category */
export async function deleteBudgetTarget(category: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from("budget_targets").delete().eq("user_id", user.id).eq("category", category);
  if (error) throw new Error(error.message);
  revalidatePath("/budget");
  revalidatePath("/dashboard");
}
