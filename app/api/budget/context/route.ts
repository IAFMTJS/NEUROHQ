/**
 * GET /api/budget/context – Finance state summary for dashboard/budget cards.
 * Single source for period bounds, remaining, payday, discipline. Use with BudgetDashboardProvider.
 */

import { NextResponse } from "next/server";
import { getFinanceState, getFinancialInsightsSafe } from "@/app/actions/dcic/finance-state";
import { getRemainingBalance } from "@/lib/dcic/finance-engine";
import { SUPABASE_FIRST_CONTRACT_VERSION } from "@/lib/mobile/supabase-first-contract";

export async function GET() {
  const insights = await getFinancialInsightsSafe();
  if (!insights) {
    return NextResponse.json({ error: "Unauthorized or no finance state" }, { status: 401 });
  }
  const financeState = await getFinanceState();
  const budgetRemainingCents = financeState ? getRemainingBalance(financeState) : null;
  const periodEnd = financeState?.planning?.periodEnd ?? null;
  const res = NextResponse.json({
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
  res.headers.set("Cache-Control", "no-store, max-age=0");
  res.headers.set("x-neurohq-source-of-truth", "supabase");
  res.headers.set("x-neurohq-sync-contract", SUPABASE_FIRST_CONTRACT_VERSION);
  return res;
}
