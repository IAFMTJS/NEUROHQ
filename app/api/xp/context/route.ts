import { NextResponse } from "next/server";
import { getXPFullContext } from "@/app/actions/xp-context";
import { getHeatmapLast30Days } from "@/app/actions/dcic/heatmap";
import { getXPBySourceLast7, getInsightEngineState } from "@/app/actions/dcic/insight-engine";
import { getBehaviorProfile } from "@/app/actions/behavior-profile";
import { getEnergyBudget } from "@/app/actions/energy";
import { getTodaysTasks } from "@/app/actions/tasks";
import { xpProgressInLevel, xpRangeForNextLevel } from "@/lib/xp";
import { MISSION_TEMPLATES } from "@/lib/mission-templates";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const date = url.searchParams.get("date") ?? new Date().toISOString().slice(0, 10);

    const [xpContext, heatmapDays, xpBySource, behaviorProfile, energyBudget, todaysTasks] =
      await Promise.all([
        getXPFullContext(date),
        getHeatmapLast30Days(),
        getXPBySourceLast7(),
        getBehaviorProfile(),
        getEnergyBudget(date),
        getTodaysTasks(date, "normal"),
      ]);

    const { xp, identity, forecast, insightState } = xpContext;
    const effectiveInsight =
      insightState ?? (await getInsightEngineState().catch(() => null));

    const velocity = effectiveInsight ? Math.round((effectiveInsight.xpLast7 / 7) * 10) / 10 : 0;
    const chartData =
      effectiveInsight?.graphData.map((d) => {
        const base = d.xp;
        const hasStreak = d.streakActive ?? (d.streak ?? 0) > 0;
        const overlay =
          hasStreak && base > 0 ? Math.max(5, Math.round(base * 0.25)) : 0;
        return {
          name: d.name,
          value: base,
          streakOverlay: overlay,
          streakActive: hasStreak,
        };
      }) ?? [];
    const progress = xpProgressInLevel(identity.total_xp);
    const range = xpRangeForNextLevel(identity.total_xp);
    const activeCountToday = todaysTasks.tasks.length;

    const payload = {
      dateStr: date,
      identity,
      forecast,
      insightState: effectiveInsight,
      heatmapDays,
      velocity,
      chartData,
      progress,
      range,
      xpLast7: effectiveInsight?.xpLast7 ?? 0,
      xpPrevious7: effectiveInsight?.xpPrevious7 ?? 0,
      xpBySource,
      missionTemplates: MISSION_TEMPLATES.map((t) => ({
        id: t.id,
        title: t.title,
        domain: t.domain,
        energy: t.energy,
        category: t.category ?? null,
        baseXP: t.baseXP ?? null,
        xpLevel: t.xpLevel,
        description: t.description,
      })),
      behaviorProfile,
      brainModeToday: energyBudget.brainMode,
      activeMissionCountToday: activeCountToday,
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    console.error("XP context API error:", error);
    return NextResponse.json({ error: "Failed to load XP context" }, { status: 500 });
  }
}

