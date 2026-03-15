/**
 * GET /api/budget/context – Finance state summary for dashboard/budget cards.
 * Single source for period bounds, remaining, payday, discipline. Use with BudgetDashboardProvider.
 */

import { NextResponse } from "next/server";
import { getFinanceState, getFinancialInsightsSafe } from "@/app/actions/dcic/finance-state";
import { getRemainingBalance } from "@/lib/dcic/finance-engine";

export async function GET() {
  const insights = await getFinancialInsightsSafe();
  if (!insights) {
    return NextResponse.json({ error: "Unauthorized or no finance state" }, { status: 401 });
  }
  const financeState = await getFinanceState();
  const budgetRemainingCents = financeState ? getRemainingBalance(financeState) : null;
  const periodEnd = financeState?.planning?.periodEnd ?? null;
  return NextResponse.json({
    periodStart: insights.cycleStartDate,
    periodEnd,
    periodLabel: insights.nextPaydayDate,
    nextPaydayDate: insights.nextPaydayDate,
    daysUntilNextIncome: insights.daysUntilNextIncome,
    budgetRemainingCents,
    disciplineScore: insights.disciplineScore,
    safeDailySpend: insights.safeDailySpend,
    currency: "EUR",
  });
}
