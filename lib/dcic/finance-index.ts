/**
 * Dark Commander Intelligence Core - Finance Public API
 */

export type {
  FinanceState,
  IncomeSource,
  BudgetTarget,
  Expense,
  SavingsGoal,
  Insight,
  InsightType,
} from "./types";

export {
  getDaysUntilNextIncome,
  calculateSafeDailySpend,
  getRemainingBalance,
  getCategoryTotals,
  getCategoryPercentages,
  getLargestCategory,
  calculateBurnRate,
  forecastEndOfCycle,
  generateInsights,
  calculateMonthsToGoal,
  simulateGoalAcceleration,
  calculateWeeklyAllowance,
  getRecurringExpenses,
  auditSubscriptions,
  getTotalPotentialSavings,
  checkEmergencyMode,
  calculateDisciplineScore,
} from "./finance-engine";
