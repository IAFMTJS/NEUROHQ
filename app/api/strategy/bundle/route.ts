import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { applyPrivateSnapshotCacheHeaders } from "@/lib/server/api-snapshot-headers";
import { applyApiRouteTiming, startApiRouteTimer } from "@/lib/server/api-route-telemetry";
import { getUserPreferencesOrDefaults } from "@/app/actions/preferences";
import {
  getActiveStrategyFocus,
  getPastStrategyFocus,
  getPressureIndex,
  getStrategyReviewStatus,
  getAlignmentThisWeek,
  computeAndUpsertAlignment,
} from "@/app/actions/strategyFocus";
import { getQuarterEngineSnapshot } from "@/app/actions/quarter-engine-snapshot";
import { getStrategyBudgetSavingsContext } from "@/app/actions/strategy-budget-savings-context";
import { isQuarterContractComplete } from "@/lib/strategy/engine-params";
import { todayDateString } from "@/lib/utils/timezone";

export const dynamic = "force-dynamic";

/**
 * GET /api/strategy/bundle
 * Page-ready snapshot for `/strategy` to support local-first navigation.
 */
export async function GET() {
  const startedAt = startApiRouteTimer();
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const prefs = await getUserPreferencesOrDefaults();
    const simplified = prefs.simplified_content === true;

    const [strategy, past] = await Promise.all([getActiveStrategyFocus(), getPastStrategyFocus(6)]);
    if (!strategy) {
      const res = NextResponse.json({ today: todayDateString(), simplified, strategy: null, past, status: "no-strategy" });
      applyPrivateSnapshotCacheHeaders(res);
      applyApiRouteTiming(res, startedAt, "strategy_bundle_none");
      return res;
    }

    const budgetSavingsCtx = await getStrategyBudgetSavingsContext();
    const contractComplete = isQuarterContractComplete(strategy.engine_params, budgetSavingsCtx);

    const today = todayDateString();
    try {
      await computeAndUpsertAlignment(strategy.id, today);
    } catch {
      // non-blocking
    }

    const [pressure, review, quarter, align] = await Promise.all([
      getPressureIndex(strategy.id),
      getStrategyReviewStatus(strategy.id, strategy.start_date),
      getQuarterEngineSnapshot(),
      getAlignmentThisWeek(strategy.id),
    ]);

    const out = {
      today,
      simplified,
      status: contractComplete ? "ready" : "locked",
      strategy,
      past,
      pressure: pressure ?? null,
      review: review ?? null,
      quarter: quarter ?? null,
      alignment: align ?? null,
    };

    const res = NextResponse.json(out);
    applyPrivateSnapshotCacheHeaders(res);
    applyApiRouteTiming(res, startedAt, "strategy_bundle");
    return res;
  } catch (err) {
    console.error("[API strategy/bundle]", err);
    return NextResponse.json({ error: "Failed to load strategy bundle" }, { status: 500 });
  }
}

