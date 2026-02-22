import dynamic from "next/dynamic";
import { getMascotSrcForPage } from "@/lib/mascots";
import { HQPageHeader } from "@/components/hq";
import { getXPIdentity } from "@/app/actions/xp";
import { getXPForecast } from "@/app/actions/dcic/xp-forecast";
import { getHeatmapLast30Days } from "@/app/actions/dcic/heatmap";
import { getInsightEngineState } from "@/app/actions/dcic/insight-engine";
import { xpProgressInLevel, xpRangeForNextLevel } from "@/lib/xp";

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
  const [identity, forecast, heatmapDays, insightState] = await Promise.all([
    getXPIdentity(),
    getXPForecast(today),
    getHeatmapLast30Days(),
    getInsightEngineState(),
  ]);

  const velocity = insightState ? Math.round((insightState.xpLast7 / 7) * 10) / 10 : 0;
  const chartData =
    insightState?.graphData.map((d) => ({ name: d.name, value: d.xp })) ?? [];
  const progress = xpProgressInLevel(identity.total_xp);
  const range = xpRangeForNextLevel(identity.total_xp);

  return (
    <div className="container page space-y-6">
      <HQPageHeader
        title="XP Command Center"
        subtitle="Energie-economie · Gedragsanalyse · Strategische optimalisatie"
        backHref="/dashboard"
      />
      <p className="text-sm text-[var(--text-muted)]">
        Alles draait rond één event-systeem: XP Core Engine, Mission Library, Completion & Validation, Analytics & Quality.
      </p>

      <section className="mascot-hero mascot-hero-top" data-mascot-page="xp" aria-hidden>
        <img src={getMascotSrcForPage("xp")} alt="" className="mascot-img" />
      </section>

      <XPPageContent
        identity={identity}
        forecast={forecast}
        heatmapDays={heatmapDays}
        velocity={velocity}
        chartData={chartData}
        progress={progress}
        range={range}
        xpLast7={insightState?.xpLast7 ?? 0}
        xpPrevious7={insightState?.xpPrevious7 ?? 0}
      />
    </div>
  );
}
