import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { applyPrivateSnapshotCacheHeaders } from "@/lib/server/api-snapshot-headers";
import { applyApiRouteTiming, startApiRouteTimer } from "@/lib/server/api-route-telemetry";
import { getBudgetToday, getBudgetAdjacentMonths, getPreviousPeriodBounds } from "@/lib/utils/budget-date";
import { loadBudgetPageDataBatch, runBudgetPagePreamble } from "@/lib/budget/budget-page-load";

export const dynamic = "force-dynamic";

/**
 * GET /api/budget/bundle
 * Page-ready snapshot for `/budget` (live view). History view stays server-only for now.
 */
export async function GET() {
  const startedAt = startApiRouteTimer();
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const today = getBudgetToday();
    const { prefs, periodBounds, paydayDayOfMonth } = await runBudgetPagePreamble();
    const { periodStart, periodEnd, isPaydayCycle } = periodBounds;
    const { nextMonthStart, nextMonthEnd, prevMonthStart, prevMonthEnd } = getBudgetAdjacentMonths();
    const prevPeriodRange = isPaydayCycle
      ? getPreviousPeriodBounds(periodStart, paydayDayOfMonth ?? 25)
      : { prevStart: prevMonthStart, prevEnd: prevMonthEnd };

    const batch = await loadBudgetPageDataBatch({
      today,
      isHistoryView: false,
      periodStart,
      periodEnd,
      nextMonthStart,
      nextMonthEnd,
      prevStart: prevPeriodRange.prevStart,
      prevEnd: prevPeriodRange.prevEnd,
    });

    const out = {
      today,
      prefs,
      periodBounds,
      paydayDayOfMonth,
      batch,
    };

    const res = NextResponse.json(out);
    applyPrivateSnapshotCacheHeaders(res);
    applyApiRouteTiming(res, startedAt, "budget_bundle");
    return res;
  } catch (err) {
    console.error("[API budget/bundle]", err);
    return NextResponse.json({ error: "Failed to load budget bundle" }, { status: 500 });
  }
}

