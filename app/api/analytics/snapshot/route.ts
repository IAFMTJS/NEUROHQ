import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { todayDateString } from "@/lib/utils/timezone";
import { getFunnelCountsLast7 } from "@/app/actions/analytics";
import { getAnalyticsEventsSummaryLast7 } from "@/app/actions/analytics-events";
import {
  getBestHourHeatmap,
  getConsistencyMap,
  getDropOffPattern,
  getCorrelationInsights,
  getStrengthWeaknessRadar,
  getComparativeIntelligence,
  getFriction40Insight,
  getGraphData30Days,
  getXPBySourceLast30,
  getRecentCompletionsWithRank,
} from "@/app/actions/dcic/insight-engine";
import { getMetaInsights30 } from "@/app/actions/missions-performance";
import { getHeatmapLast30Days } from "@/app/actions/dcic/heatmap";
import { getThirtyDayMirror } from "@/app/actions/thirty-day-mirror";
import { getXPFullContext } from "@/app/actions/xp-context";
import { getWeekBounds } from "@/lib/utils/learning";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = todayDateString();
    const now = new Date();
    const { start: currentWeekStart, end: currentWeekEnd } = getWeekBounds(now);

    const [
      xpContext,
      currentReport,
      hourHeatmap,
      consistencyMap,
      dropOff,
      correlation,
      radar,
      comparative,
      friction40,
      funnelCounts,
      graph30Data,
      xpBySource30,
      analyticsEventsSummary,
      metaInsights30,
      heatmap30Days,
      thirtyDayMirror,
      recentRanks,
    ] = await Promise.all([
      getXPFullContext(),
      // Current-week reality report for hero + key numbers.
      (async () => {
        const { getRealityReport } = await import("@/app/actions/report");
        return getRealityReport(currentWeekStart, currentWeekEnd);
      })(),
      getBestHourHeatmap(),
      getConsistencyMap(),
      getDropOffPattern(),
      getCorrelationInsights(),
      getStrengthWeaknessRadar(),
      getComparativeIntelligence(),
      getFriction40Insight(),
      getFunnelCountsLast7(),
      getGraphData30Days(),
      getXPBySourceLast30(),
      getAnalyticsEventsSummaryLast7(),
      getMetaInsights30(),
      getHeatmapLast30Days(),
      getThirtyDayMirror(),
      getRecentCompletionsWithRank(20),
    ]);

    return NextResponse.json(
      {
        today,
        // Keep payload generic: analytics/report pages can pick fields they need.
        payload: {
          xpContext,
          currentReport,
          hourHeatmap,
          consistencyMap,
          dropOff,
          correlation,
          radar,
          comparative,
          friction40,
          funnelCounts,
          graph30Data,
          xpBySource30,
          analyticsEventsSummary,
          metaInsights30,
          heatmap30Days,
          thirtyDayMirror,
          recentRanks,
        },
      },
      { status: 200 },
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[API analytics/snapshot]", err);
    return NextResponse.json(
      { error: "Failed to load analytics snapshot" },
      { status: 500 },
    );
  }
}

