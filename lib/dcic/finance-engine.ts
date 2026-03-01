/**
 * Dark Commander Intelligence Core - Finance Engine
 * Cashflow intelligence, behavioral analytics, predictive finance
 */

import type { FinanceState, IncomeSource, Expense, BudgetTarget } from "./types";

// ============================================================================
// PAYDAY-BASED CYCLE ENGINE
// ============================================================================

/**
 * Returns the next payday date (YYYY-MM-DD) from income sources.
 */
export function getNextPaydayDate(financeState: FinanceState): string {
  const today = new Date();
  const day = today.getDate();
  const y = today.getFullYear();
  const m = today.getMonth();

  const nextIncomeThisMonth = financeState.income.sources
    .map((i) => i.dayOfMonth)
    .filter((d) => d > day)
    .sort((a, b) => a - b)[0];

  if (nextIncomeThisMonth) {
    const lastDay = new Date(y, m + 1, 0).getDate();
    const d = Math.min(nextIncomeThisMonth, lastDay);
    return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  const firstIncomeNextMonth = financeState.income.sources
    .map((i) => i.dayOfMonth)
    .sort((a, b) => a - b)[0];
  const nextDate = new Date(y, m + 1, Math.min(firstIncomeNextMonth ?? 25, new Date(y, m + 2, 0).getDate()));
  return nextDate.toISOString().slice(0, 10);
}

/**
 * Calculates days until next income
 */
export function getDaysUntilNextIncome(financeState: FinanceState): number {
  const today = new Date();
  const day = today.getDate();

  // Find next income day this month
  const nextIncomeThisMonth = financeState.income.sources
    .map((i) => i.dayOfMonth)
    .filter((d) => d > day)
    .sort((a, b) => a - b)[0];

  if (nextIncomeThisMonth) {
    return nextIncomeThisMonth - day;
  }

  // No income this month, find first income next month
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const firstIncomeNextMonth = financeState.income.sources
    .map((i) => i.dayOfMonth)
    .sort((a, b) => a - b)[0];

  return daysInMonth - day + (firstIncomeNextMonth ?? 25);
}

/**
 * Gets upcoming fixed costs (non-flexible budget targets)
 */
function getUpcomingFixedCosts(financeState: FinanceState): number {
  return financeState.budgetTargets
    .filter((target) => !target.flexible)
    .reduce((sum, target) => sum + target.target, 0);
}

// ============================================================================
// SAFE DAILY SPEND (Real Intelligence)
// ============================================================================

/**
 * Safe daily spend = remaining balance / days until next income.
 * Zolang je daar niet over gaat, overschrijd je je budget niet.
 * Kan negatief zijn (over budget) → dan is het bedrag dat je per dag "te veel" uitgeeft.
 */
export function calculateSafeDailySpend(financeState: FinanceState): number {
  const days = getDaysUntilNextIncome(financeState);
  if (days <= 0) return 0;

  const remaining = getRemainingBalance(financeState);
  return Math.floor(remaining / days);
}

/**
 * Gets remaining balance after fixed costs
 */
export function getRemainingBalance(financeState: FinanceState): number {
  const fixedUpcoming = getUpcomingFixedCosts(financeState);
  return financeState.balance.current - fixedUpcoming;
}

// ============================================================================
// EXPENSE DISTRIBUTION SYSTEM
// ============================================================================

/**
 * Gets category totals from expenses
 */
export function getCategoryTotals(financeState: FinanceState): Record<string, number> {
  const totals: Record<string, number> = {};

  financeState.expenses.forEach((e) => {
    if (e.category) {
      totals[e.category] = (totals[e.category] || 0) + Math.abs(e.amount);
    }
  });

  return totals;
}

/**
 * Gets category percentage of total expenses
 */
export function getCategoryPercentages(financeState: FinanceState): Record<string, number> {
  const totals = getCategoryTotals(financeState);
  const totalExpenses = Object.values(totals).reduce((sum, val) => sum + val, 0);

  if (totalExpenses === 0) return {};

  const percentages: Record<string, number> = {};
  Object.entries(totals).forEach(([category, amount]) => {
    percentages[category] = Math.round((amount / totalExpenses) * 100);
  });

  return percentages;
}

/**
 * Gets largest spending category
 */
export function getLargestCategory(financeState: FinanceState): {
  category: string;
  amount: number;
  percentage: number;
} | null {
  const totals = getCategoryTotals(financeState);
  const percentages = getCategoryPercentages(financeState);

  if (Object.keys(totals).length === 0) return null;

  const entries = Object.entries(totals);
  const largest = entries.reduce((max, [cat, amount]) =>
    amount > max.amount ? { category: cat, amount } : max
  , { category: "", amount: 0 });

  return {
    category: largest.category,
    amount: largest.amount,
    percentage: percentages[largest.category] || 0,
  };
}

// ============================================================================
// TREND & FORECAST ENGINE
// ============================================================================

/**
 * Calculates burn rate (average daily spending in cents per day).
 * Uses calendar days from cycle start to today so cross-month is correct.
 */
export function calculateBurnRate(financeState: FinanceState): number {
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  let cycleStart: Date;
  if (financeState.cycle.startDate && /^\d{4}-\d{2}-\d{2}$/.test(financeState.cycle.startDate)) {
    cycleStart = new Date(financeState.cycle.startDate + "T12:00:00Z");
  } else {
    const day = today.getDate();
    cycleStart = new Date(today.getFullYear(), today.getMonth(), financeState.cycle.startDay);
    if (day < financeState.cycle.startDay) {
      cycleStart.setMonth(cycleStart.getMonth() - 1);
    }
  }

  const cycleExpenses = financeState.expenses.filter((e) => {
    const expenseDate = new Date(e.date + "T12:00:00Z");
    return expenseDate >= cycleStart;
  });

  const totalSpent = cycleExpenses.reduce((sum, e) => sum + Math.abs(e.amount), 0);
  const startStr = financeState.cycle.startDate ?? cycleStart.toISOString().slice(0, 10);
  const todayStr = today.toISOString().slice(0, 10);
  const startMs = new Date(startStr + "T12:00:00Z").getTime();
  const todayMs = new Date(todayStr + "T12:00:00Z").getTime();
  const daysSinceStart = Math.max(1, Math.floor((todayMs - startMs) / (24 * 60 * 60 * 1000)) + 1);

  return totalSpent / daysSinceStart;
}

/**
 * Forecasts end-of-cycle balance
 */
export function forecastEndOfCycle(financeState: FinanceState): {
  projectedSpend: number;
  projectedBalance: number;
  overspend: number;
} {
  const burnRate = calculateBurnRate(financeState);
  const daysLeft = getDaysUntilNextIncome(financeState);
  const projectedSpend = Math.floor(burnRate * daysLeft);
  const projectedBalance = financeState.balance.current - projectedSpend;
  const overspend = projectedBalance < 0 ? Math.abs(projectedBalance) : 0;

  return {
    projectedSpend,
    projectedBalance,
    overspend,
  };
}

// ============================================================================
// INSIGHT ENGINE (Dynamic Intelligence Layer)
// ============================================================================

export type InsightType = "info" | "warning" | "critical" | "suggestion";

export interface Insight {
  type: InsightType;
  message: string;
  category?: string;
  actionable?: boolean;
}

/**
 * Generates insights based on finance state
 */
export function generateInsights(financeState: FinanceState): Insight[] {
  const insights: Insight[] = [];

  // Budget usage check
  const categoryTotals = getCategoryTotals(financeState);
  const budgetUsage = financeState.budgetTargets.map((target) => {
    const spent = categoryTotals[target.category] || 0;
    const percentage = target.target > 0 ? (spent / target.target) * 100 : 0;
    return { target, spent, percentage };
  });

  // Check for overspending categories
  budgetUsage.forEach((usage) => {
    if (usage.percentage > 100) {
      const overspend = usage.spent - usage.target.target;
      insights.push({
        type: "warning",
        message: `${usage.target.category} exceeds target by €${(overspend / 100).toFixed(2)}.`,
        category: usage.target.category,
        actionable: usage.target.flexible,
      });
    } else if (usage.percentage > 85) {
      insights.push({
        type: "warning",
        message: `${usage.target.category} at ${usage.percentage.toFixed(0)}% of target.`,
        category: usage.target.category,
        actionable: true,
      });
    }
  });

  // Check for subscription audit
  const recurringExpenses = financeState.expenses.filter((e) => e.recurring);
  const subscriptionCategories = ["Subscriptions", "subscriptions", "Subscription"];
  const subscriptionExpenses = recurringExpenses.filter((e) =>
    subscriptionCategories.includes(e.category || "")
  );

  if (subscriptionExpenses.length > 0) {
    const totalSubscriptions = subscriptionExpenses.reduce(
      (sum, e) => sum + Math.abs(e.amount),
      0
    );
    const subscriptionTarget = financeState.budgetTargets.find(
      (t) => t.category.toLowerCase().includes("subscription")
    );

    if (subscriptionTarget && totalSubscriptions > subscriptionTarget.target) {
      const overspend = totalSubscriptions - subscriptionTarget.target;
      insights.push({
        type: "suggestion",
        message: `Subscriptions exceed target by €${(overspend / 100).toFixed(2)}. Review unused services.`,
        category: "Subscriptions",
        actionable: true,
      });
    }
  }

  // Check forecast: add when (by next payday) and how (burn rate)
  const forecast = forecastEndOfCycle(financeState);
  if (forecast.overspend > 0) {
    const daysLeft = getDaysUntilNextIncome(financeState);
    const burnRate = calculateBurnRate(financeState);
    const nextPayday = getNextPaydayDate(financeState);
    const whenHow =
      daysLeft > 0 && nextPayday
        ? ` Tegen ${nextPayday}. Gebaseerd op je huidige uitgavenpatroon (€${(burnRate / 100).toFixed(2)}/dag) en ${daysLeft} dagen tot volgende loon.`
        : " Tegen einde van de periode.";
    insights.push({
      type: "critical",
      message: `If current pace continues, overspend by €${(forecast.overspend / 100).toFixed(2)}.${whenHow}`,
      actionable: true,
    });
  }

  return insights;
}

// ============================================================================
// GOAL ACCELERATION SIMULATOR
// ============================================================================

/**
 * Calculates months to reach goal
 */
export function calculateMonthsToGoal(
  goal: { target: number; current: number },
  monthlyContribution: number
): number {
  if (monthlyContribution <= 0) return Infinity;
  const remaining = goal.target - goal.current;
  return Math.ceil(remaining / monthlyContribution);
}

/**
 * Simulates adding extra contribution to goal
 */
export function simulateGoalAcceleration(
  goal: { target: number; current: number },
  currentMonthlyContribution: number,
  extraContribution: number
): {
  currentMonths: number;
  newMonths: number;
  monthsSaved: number;
} {
  const currentMonths = calculateMonthsToGoal(goal, currentMonthlyContribution);
  const newMonths = calculateMonthsToGoal(goal, currentMonthlyContribution + extraContribution);
  const monthsSaved = currentMonths - newMonths;

  return {
    currentMonths,
    newMonths,
    monthsSaved,
  };
}

// ============================================================================
// WEEKLY TACTICAL PLAN
// ============================================================================

/**
 * Weekly tactical: allowance per calendar week (Sun–Sat) until next payday.
 * weekAllowance = remaining balance / number of full weeks until payday (min 1).
 * remainingThisWeek = that allowance minus what you've already spent this week.
 */
export function calculateWeeklyAllowance(financeState: FinanceState): {
  weekAllowance: number;
  remainingThisWeek: number;
  daysInWeek: number;
} {
  const daysLeft = getDaysUntilNextIncome(financeState);
  const remainingWeeks = Math.max(1, Math.ceil(daysLeft / 7));
  const remainingBalance = getRemainingBalance(financeState);

  const weekAllowance = Math.floor(remainingBalance / remainingWeeks);

  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday
  const daysInWeek = 7 - dayOfWeek; // days left in current week (Sun–Sat)
  const spentThisWeek = getWeeklySpending(financeState);
  const remainingThisWeek = weekAllowance - spentThisWeek;

  return {
    weekAllowance,
    remainingThisWeek,
    daysInWeek,
  };
}

/** Extreme bespaartips wanneer weekbudget negatief is; hoe negatiever, hoe extremer. */
export function getExtremeSavingsTips(remainingThisWeekCents: number): string[] {
  if (remainingThisWeekCents >= 0) return [];
  const overCents = Math.abs(remainingThisWeekCents);
  const tips: string[] = [];
  if (overCents >= 5000) {
    tips.push("Niets doen buitenshuis op je vrije dag: geen koffie, geen uitjes.");
    tips.push("Kijk in je kasten en vriezer: maak maaltijden van wat je al hebt, ga niet naar de winkel.");
  }
  if (overCents >= 3000) {
    tips.push("Geen nieuwe boodschappen tot je voorraad op is; maaltijden plannen rond restjes.");
    tips.push("Geen abonnementen of subscriptions deze week; pauzeer of annuleer waar mogelijk.");
  }
  if (overCents >= 1000) {
    tips.push("Stel niet-noodzakelijke aankopen uit tot na je volgende inkomst.");
    tips.push("Eet wat je in huis hebt; vermijd afhalen en uit eten.");
  }
  tips.push("Check je vaste lasten: kan iets een maand gepauzeerd of verlaagd?");
  return tips;
}

/**
 * Gets spending for current week
 */
function getWeeklySpending(financeState: FinanceState): number {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)

  const weekExpenses = financeState.expenses.filter((e) => {
    const expenseDate = new Date(e.date);
    return expenseDate >= weekStart;
  });

  return weekExpenses.reduce((sum, e) => sum + Math.abs(e.amount), 0);
}

/**
 * Counts days this week (from week start up to today) where spending stayed at or below
 * safe daily spend. Used for the Weekly Performance card on the Budget page.
 */
export function getSafeDaysThisWeek(financeState: FinanceState): number {
  const safeDaily = calculateSafeDailySpend(financeState);
  if (safeDaily <= 0) return 0;

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay()); // Sunday as start of week

  let safeDays = 0;
  for (let i = 0; i <= today.getDay(); i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const dayStr = d.toISOString().slice(0, 10);
    const spentThatDay = financeState.expenses
      .filter((e) => (e.date ?? "").slice(0, 10) === dayStr)
      .reduce((sum, e) => sum + Math.abs(e.amount), 0);
    if (spentThatDay <= safeDaily) safeDays++;
  }
  return safeDays;
}

/** Simple 14-day budget load series: overspend, impulse tags, and missed logs. */
export function getBudgetLoadTrend(financeState: FinanceState): { label: string; value: number }[] {
  const today = new Date();
  const days = 14;
  const expenses = financeState.expenses;
  const totalSpentLast14 = expenses
    .filter((e) => {
      const d = new Date(e.date);
      const diffDays = (today.getTime() - d.getTime()) / (24 * 60 * 60 * 1000);
      return diffDays >= 0 && diffDays < days;
    })
    .reduce((sum, e) => sum + Math.abs(e.amount), 0);
  const avgDaily = totalSpentLast14 / Math.max(1, days);

  const series: { label: string; value: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dayStr = d.toISOString().slice(0, 10);
    const dayExpenses = expenses.filter((e) => (e.date ?? "").slice(0, 10) === dayStr);
    const spent = dayExpenses.reduce((sum, e) => sum + Math.abs(e.amount), 0);
    const impulseCount = dayExpenses.filter((e) => !e.isPlanned && !e.recurring).length;
    const hasLog = dayExpenses.length > 0;
    const overspendFlag = spent > avgDaily * 1.2 ? 1 : 0;

    let score = overspendFlag * 3 + impulseCount * 2;
    if (!hasLog) score += 1;

    series.push({ label: dayStr.slice(5), value: score });
  }
  return series;
}

// ============================================================================
// SUBSCRIPTION AUDIT SYSTEM
// ============================================================================

export interface SubscriptionAudit {
  category: string;
  monthlyCost: number;
  annualImpact: number;
  potentialSavings: number;
}

/**
 * Gets recurring expenses (subscriptions)
 */
export function getRecurringExpenses(financeState: FinanceState): Expense[] {
  return financeState.expenses.filter((e) => e.recurring);
}

/**
 * Audits subscriptions and calculates potential savings
 */
export function auditSubscriptions(financeState: FinanceState): SubscriptionAudit[] {
  const recurring = getRecurringExpenses(financeState);
  const subscriptionCategories = ["Subscriptions", "subscriptions", "Subscription"];

  const subscriptions = recurring.filter((e) =>
    subscriptionCategories.includes(e.category || "")
  );

  return subscriptions.map((sub) => {
    const monthlyCost = Math.abs(sub.amount);
    const annualImpact = monthlyCost * 12;
    // Potential savings = 50% if unused (heuristic)
    const potentialSavings = Math.floor(annualImpact * 0.5);

    return {
      category: sub.category || "Unknown",
      monthlyCost,
      annualImpact,
      potentialSavings,
    };
  });
}

/**
 * Gets total potential annual savings from subscriptions
 */
export function getTotalPotentialSavings(financeState: FinanceState): number {
  const audits = auditSubscriptions(financeState);
  return audits.reduce((sum, audit) => sum + audit.potentialSavings, 0);
}

// ============================================================================
// EMERGENCY MODE
// ============================================================================

/**
 * Checks if emergency mode should be active
 */
export function checkEmergencyMode(financeState: FinanceState): {
  active: boolean;
  reason: string[];
} {
  const reasons: string[] = [];
  const safeDailySpend = calculateSafeDailySpend(financeState);

  // Calculate historical daily average
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const recentExpenses = financeState.expenses.filter((e) => {
    const expenseDate = new Date(e.date);
    return expenseDate >= thirtyDaysAgo;
  });

  const totalRecentSpending = recentExpenses.reduce((sum, e) => sum + Math.abs(e.amount), 0);
  const historicalDailyAverage = totalRecentSpending / 30;

  // Check conditions
  if (safeDailySpend < historicalDailyAverage * 0.5) {
    reasons.push("Safe daily spend below 50% of historical average");
  }

  const forecast = forecastEndOfCycle(financeState);
  if (forecast.overspend > 0) {
    reasons.push(`Projected overspend: €${(forecast.overspend / 100).toFixed(2)}`);
  }

  const budgetUsage = financeState.budgetTargets.map((target) => {
    const categoryTotals = getCategoryTotals(financeState);
    const spent = categoryTotals[target.category] || 0;
    return target.target > 0 ? (spent / target.target) * 100 : 0;
  });

  const maxUsage = Math.max(...budgetUsage, 0);
  if (maxUsage > 95) {
    reasons.push(`Budget usage at ${maxUsage.toFixed(0)}%`);
  }

  return {
    active: reasons.length > 0,
    reason: reasons,
  };
}

// ============================================================================
// FINANCIAL DISCIPLINE SCORE
// ============================================================================

/**
 * Calculates financial discipline score (0-100)
 */
export function calculateDisciplineScore(financeState: FinanceState): number {
  // 1) Budget adherence (40%)
  const categoryTotals = getCategoryTotals(financeState);
  let adherenceSum = 0;
  let adherenceCount = 0;
  for (const target of financeState.budgetTargets) {
    const spent = categoryTotals[target.category] || 0;
    if (target.target <= 0) continue;
    const usagePct = (spent / target.target) * 100;
    const adherence = usagePct <= 100 ? 1 : Math.max(0, 1 - Math.min(100, usagePct - 100) / 100);
    adherenceSum += adherence;
    adherenceCount += 1;
  }
  const budgetAdherenceScore =
    adherenceCount > 0 ? (adherenceSum / adherenceCount) * 100 : 70;

  // 2) Impulse control (20%) – treat non-planned, non-recurring expenses as impulse.
  const expenses = financeState.expenses;
  const totalSpend = expenses.reduce((sum, e) => sum + Math.abs(e.amount), 0);
  const impulseSpend = expenses
    .filter((e) => !e.isPlanned && !e.recurring)
    .reduce((sum, e) => sum + Math.abs(e.amount), 0);
  const impulseRatio = totalSpend > 0 ? impulseSpend / totalSpend : 0;
  const impulseControlScore = totalSpend === 0 ? 70 : Math.max(0, (1 - impulseRatio) * 100);

  // 3) Logging consistency (20%) – days with at least one entry over last 14 days.
  const today = new Date();
  const daysWindow = 14;
  let loggedDays = 0;
  for (let i = 0; i < daysWindow; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dayStr = d.toISOString().slice(0, 10);
    const hasEntry = expenses.some((e) => (e.date ?? "").slice(0, 10) === dayStr);
    if (hasEntry) loggedDays++;
  }
  const loggingRatio = loggedDays / daysWindow;
  const loggingConsistencyScore = Math.round(40 + loggingRatio * 60); // 40–100
  // 4) Weekly review (20%) – based on completion ratio over last 4 weeks (if available).
  let weeklyReviewScore = 70;
  if (
    typeof financeState.weeklyReviewsCompletedLast4Weeks === "number" &&
    typeof financeState.weeksConsideredForReviews === "number" &&
    financeState.weeksConsideredForReviews > 0
  ) {
    const ratio =
      financeState.weeklyReviewsCompletedLast4Weeks /
      financeState.weeksConsideredForReviews;
    const clamped = Math.max(0, Math.min(1, ratio));
    weeklyReviewScore = Math.round(40 + clamped * 60); // 40–100 depending on review consistency
  }

  const finalScore =
    budgetAdherenceScore * 0.4 +
    impulseControlScore * 0.2 +
    loggingConsistencyScore * 0.2 +
    weeklyReviewScore * 0.2;

  return Math.max(0, Math.min(100, Math.round(finalScore)));
}
