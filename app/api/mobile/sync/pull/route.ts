import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTasksForDate } from "@/app/actions/tasks";
import { getFinancialInsightsSafe, getFinanceState } from "@/app/actions/dcic/finance-state";
import { getRemainingBalance } from "@/lib/dcic/finance-engine";
import { getDashboardPayload } from "@/app/actions/dashboard-data";

function makeCursor(): string {
  return new Date().toISOString();
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const domain = request.nextUrl.searchParams.get("domain");

  if (domain === "tasks") {
    const date = request.nextUrl.searchParams.get("date");
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Missing/invalid date for tasks domain" }, { status: 400 });
    }
    const tasks = await getTasksForDate(date);
    return NextResponse.json({ domain, cursor: makeCursor(), payload: tasks });
  }

  if (domain === "budget") {
    const insights = await getFinancialInsightsSafe();
    if (!insights) return NextResponse.json({ error: "No budget context" }, { status: 404 });
    const financeState = await getFinanceState();
    const budgetRemainingCents = financeState ? getRemainingBalance(financeState) : null;
    return NextResponse.json({
      domain,
      cursor: makeCursor(),
      payload: {
        periodStart: insights.cycleStartDate,
        periodEnd: financeState?.planning?.periodEnd ?? null,
        periodLabel: insights.nextPaydayDate,
        nextPaydayDate: insights.nextPaydayDate,
        daysUntilNextIncome: insights.daysUntilNextIncome,
        budgetRemainingCents,
        disciplineScore: insights.disciplineScore,
        safeDailySpend: insights.safeDailySpend,
        currency: "EUR",
      },
    });
  }

  if (domain === "dashboard") {
    const payload = await getDashboardPayload();
    return NextResponse.json({
      domain,
      cursor: makeCursor(),
      payload: payload ? { critical: payload.critical, secondary: payload.secondary } : null,
    });
  }

  return NextResponse.json({ error: "Unsupported domain" }, { status: 400 });
}

