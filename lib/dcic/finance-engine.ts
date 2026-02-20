/**
 * Dark Commander Intelligence Core - Finance Engine
 * Cashflow intelligence, behavioral analytics, predictive finance
 */

import type { FinanceState, IncomeSource, Expense, BudgetTarget } from "./types";

// ============================================================================
// PAYDAY-BASED CYCLE ENGINE
// ============================================================================

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

  return daysInMonth - day + firstIncomeNextMonth;
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
 * Calculates safe daily spend based on remaining balance and days until next income
 */
export function calculateSafeDailySpend(financeState: FinanceState): number {
  const days = getDaysUntilNextIncome(financeState);
  if (days <= 0) return 0;

  const fixedUpcoming = getUpcomingFixedCosts(financeState);
  const realAvailable = financeState.balance.current - fixedUpcoming;

  if (realAvailable <= 0) return 0;

  return Math.floor(realAvailable / days);
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
 * Calculates burn rate (average daily spending)
 */
export function calculateBurnRate(financeState: FinanceState): number {
  const today = new Date();
  const day = today.getDate();

  // Get expenses for current cycle (since cycle start)
  const cycleStart = new Date(today.getFullYear(), today.getMonth(), financeState.cycle.startDay);
  if (day < financeState.cycle.startDay) {
    cycleStart.setMonth(cycleStart.getMonth() - 1);
  }

  const cycleExpenses = financeState.expenses.filter((e) => {
    const expenseDate = new Date(e.date);
    return expenseDate >= cycleStart;
  });

  const totalSpent = cycleExpenses.reduce((sum, e) => sum + Math.abs(e.amount), 0);
  const daysSinceStart = Math.max(1, day - financeState.cycle.startDay + 1);

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

  // Check forecast
  const forecast = forecastEndOfCycle(financeState);
  if (forecast.overspend > 0) {
    insights.push({
      type: "critical",
      message: `If current pace continues, overspend by €${(forecast.overspend / 100).toFixed(2)}.`,
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
 * Calculates weekly allowance
 */
export function calculateWeeklyAllowance(financeState: FinanceState): {
  weekAllowance: number;
  remainingThisWeek: number;
  daysInWeek: number;
} {
  const daysLeft = getDaysUntilNextIncome(financeState);
  const remainingWeeks = Math.ceil(daysLeft / 7);
  const remainingBalance = getRemainingBalance(financeState);

  const weekAllowance = Math.floor(remainingBalance / remainingWeeks);

  // Calculate remaining this week
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday
  const daysInWeek = 7 - dayOfWeek;
  const spentThisWeek = getWeeklySpending(financeState);
  const remainingThisWeek = weekAllowance - spentThisWeek;

  return {
    weekAllowance,
    remainingThisWeek: Math.max(0, remainingThisWeek),
    daysInWeek,
  };
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
  let score = 100;

  // Overspend penalty
  const categoryTotals = getCategoryTotals(financeState);
  financeState.budgetTargets.forEach((target) => {
    const spent = categoryTotals[target.category] || 0;
    if (spent > target.target) {
      const overspendPct = ((spent - target.target) / target.target) * 100;
      score -= Math.min(30, overspendPct * 0.5); // Max 30 point penalty
    }
  });

  // Volatility penalty (if spending varies wildly)
  const forecast = forecastEndOfCycle(financeState);
  if (forecast.overspend > 0) {
    const overspendPct = (forecast.overspend / financeState.balance.current) * 100;
    score -= Math.min(20, overspendPct * 0.3); // Max 20 point penalty
  }

  // Savings bonus
  const totalSavings = financeState.goals.reduce((sum, goal) => sum + goal.current, 0);
  const totalTargets = financeState.goals.reduce((sum, goal) => sum + goal.target, 0);
  if (totalTargets > 0) {
    const savingsProgress = (totalSavings / totalTargets) * 100;
    score += Math.min(20, savingsProgress * 0.2); // Max 20 point bonus
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}
