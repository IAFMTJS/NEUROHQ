import dynamic from "next/dynamic";
import { getXPMascotState } from "@/lib/mascots";
import { MascotImg } from "@/components/MascotImg";
import { HQPageHeader } from "@/components/hq";
import { XPBadge } from "@/components/XPBadge";
import { getXPFullContext } from "@/app/actions/xp-context";
import { getBehaviorProfile } from "@/app/actions/behavior-profile";
import { getHeatmapLast30Days } from "@/app/actions/dcic/heatmap";
import { getXPBySourceLast7 } from "@/app/actions/dcic/insight-engine";
import { xpProgressInLevel, xpRangeForNextLevel } from "@/lib/xp";
import { MISSION_TEMPLATES } from "@/lib/mission-templates";
import { getEnergyBudget } from "@/app/actions/energy";
import { getTodaysTasks } from "@/app/actions/tasks";

const XPPageContent = dynamic(
  () => import("@/components/xp/XPPageContent"),
  { loading: () => <div className="min-h-[200px] animate-pulse rounded-xl bg-white/5" aria-hidden /> }
);
const XPForecastWidget = dynamic(
  () => import("@/components/dashboard/XPForecastWidget").then((m) => ({ default: m.XPForecastWidget })),
  { loading: () => <div className="glass-card min-h-[120px] animate-pulse rounded-[22px]" aria-hidden /> }
);
const WeeklyHeatmap = dynamic(
  () => import("@/components/dashboard/WeeklyHeatmap").then((m) => ({ default: m.WeeklyHeatmap })),
  { loading: () => <div className="glass-card min-h-[80px] animate-pulse rounded-[22px]" aria-hidden /> }
);
const HQChart = dynamic(
  () => import("@/components/hq/HQChart").then((m) => ({ default: m.HQChart })),
  { loading: () => <div className="hq-glass min-h-[200px] animate-pulse rounded-xl" aria-hidden /> }
);

export default async function XPPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [xpContext, heatmapDays, xpBySource, behaviorProfile, energyBudget, todaysTasks] = await Promise.all([
    getXPFullContext(today),
    getHeatmapLast30Days(),
    getXPBySourceLast7(),
    getBehaviorProfile(),
    getEnergyBudget(today),
    getTodaysTasks(today, "normal"),
  ]);
  const { xp, identity, forecast, insightState } = xpContext;

  const velocity = insightState ? Math.round((insightState.xpLast7 / 7) * 10) / 10 : 0;
  const chartData =
    insightState?.graphData.map((d) => {
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

  return (
    <div className="container page page-wide space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <HQPageHeader
          title="XP Command Center"
          subtitle="Energie-economie · Gedragsanalyse · Strategische optimalisatie"
          backHref="/dashboard"
        />
        <XPBadge totalXp={xp.total_xp} level={xp.level} compact href="/xp" />
      </div>
      <p className="text-sm text-[var(--text-muted)]">
        Alles draait rond één event-systeem: XP Core Engine, Mission Library, Completion & Validation, Analytics & Quality.
      </p>

      <section className="xp-mascot-hero" data-mascot-page="xp" aria-hidden>
        <div className="xp-mascot-frame">
          <MascotImg
            page="xp"
            state={getXPMascotState(energyBudget.brainMode.mode)}
            className="xp-mascot-img"
          />
        </div>
      </section>

      <XPPageContent
        identity={identity}
        forecast={forecast}
        insightState={insightState}
        heatmapDays={heatmapDays}
        velocity={velocity}
        chartData={chartData}
        progress={progress}
        range={range}
        xpLast7={insightState?.xpLast7 ?? 0}
        xpPrevious7={insightState?.xpPrevious7 ?? 0}
        xpBySource={xpBySource}
        todayStr={today}
        missionTemplates={MISSION_TEMPLATES.map((t) => ({
          id: t.id,
          title: t.title,
          domain: t.domain,
          energy: t.energy,
          category: t.category ?? null,
          baseXP: t.baseXP ?? null,
          xpLevel: t.xpLevel,
          description: t.description,
        }))}
        behaviorProfile={behaviorProfile}
        brainModeToday={energyBudget.brainMode}
        activeMissionCountToday={activeCountToday}
      />
    </div>
  );
}
