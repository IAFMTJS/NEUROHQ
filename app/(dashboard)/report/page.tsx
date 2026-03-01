import dynamic from "next/dynamic";
import { HeroMascotImage } from "@/components/HeroMascotImage";
import { getXPFullContext } from "@/app/actions/xp-context";
import { HQPageHeader } from "@/components/hq";
import { XPBadge } from "@/components/XPBadge";
import { getRealityReport, getStoredReport, getStoredReportWeeks } from "@/app/actions/report";
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
import { getWeekBounds } from "@/lib/utils/learning";
import {
  InsightsMomentumHero,
  InsightsKeyNumbersStrip,
  InsightsGraphBlock,
  InsightsGraph30Block,
  InsightsWeeklyComparison,
  InsightsXPSourcesCard,
  InsightsBehaviorCard,
  InsightsRiskForecastCard,
  InsightsCoachCard,
  InsightsHourHeatmap,
  InsightsConsistencyMap,
  PowerUserModeToggle,
  InsightsDropOffCard,
  InsightsCorrelationCard,
  InsightsRadarChart,
  InsightsComparativeCard,
  InsightsFriction40Card,
  InsightsTrackedEventsCard,
  InsightsRecentRanksCard,
} from "@/components/insights";
import { DataUnavailable } from "@/components/DataUnavailable";

const ReportWeekSelector = dynamic(() => import("@/components/ReportWeekSelector").then((m) => ({ default: m.ReportWeekSelector })), { loading: () => <div className="min-h-[48px] animate-pulse rounded-lg bg-white/5" aria-hidden /> });
const ReportAnalysis = dynamic(() => import("@/components/ReportAnalysis").then((m) => ({ default: m.ReportAnalysis })), { loading: () => <div className="min-h-[120px] animate-pulse rounded-xl bg-white/5" aria-hidden /> });
const RealityReportCard = dynamic(() => import("@/components/RealityReportCard").then((m) => ({ default: m.RealityReportCard })), { loading: () => <div className="glass-card min-h-[180px] animate-pulse rounded-[22px]" aria-hidden /> });
const InsightsGraphBlockClient = dynamic(
  () => import("@/components/insights/InsightsGraphBlock").then((m) => ({ default: m.InsightsGraphBlock })),
  { loading: () => <div className="min-h-[320px] animate-pulse rounded-[var(--hq-card-radius-sharp)] bg-white/5" aria-hidden /> }
);
const WeeklyHeatmap = dynamic(
  () => import("@/components/dashboard/WeeklyHeatmap").then((m) => ({ default: m.WeeklyHeatmap })),
  { loading: () => <div className="min-h-[80px] animate-pulse rounded-xl bg-white/5" aria-hidden /> }
);

type Props = { searchParams: Promise<{ weekStart?: string }> };

export default async function ReportPage({ searchParams }: Props) {
  try {
  const today = new Date();
  const { start: currentWeekStart, end: currentWeekEnd } = getWeekBounds(today);
  const params = await searchParams;
  const weekStartParam = params.weekStart;

  const [xpContext, storedWeeks, currentReport, hourHeatmap, consistencyMap, dropOff, correlation, radar, comparative, friction40, funnelCounts, graph30Data, xpBySource30, analyticsEventsSummary, metaInsights30, heatmap30Days, thirtyDayMirror, recentRanks] = await Promise.all([
    getXPFullContext(),
    getStoredReportWeeks(),
    getRealityReport(currentWeekStart, currentWeekEnd),
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
  const { xp, identity, insightState } = xpContext;

  const selectedWeekStart = weekStartParam ?? currentWeekStart;
  const isCurrentWeek = selectedWeekStart === currentWeekStart;

  const report = isCurrentWeek
    ? currentReport
    : (await getStoredReport(selectedWeekStart)) ?? currentReport;

  return (
    <div className="container page page-wide space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <HQPageHeader
          title="Insights"
          subtitle={isCurrentWeek ? "Verklaren, voorspellen, sturen." : `Afgelopen week: ${report.weekStart} – ${report.weekEnd}.`}
          backHref="/dashboard"
        />
        <XPBadge totalXp={xp.total_xp} level={xp.level} compact href="/xp" />
      </div>
      <p className="text-sm text-[var(--text-muted)]">
        Momentum, trend, gedragspatronen, voorspellingen en aanbevelingen. Alles wat we tracken: 7d / 30d, bronnen, wekelijkse vergelijking.
      </p>
      <section className="mascot-hero mascot-hero-top mascot-hero-sharp" data-mascot-page="report" aria-hidden>
        <div className="mascot-hero-inner mx-auto">
          <HeroMascotImage page="report" className="mascot-img" />
        </div>
      </section>

      {/* Key numbers: past & present */}
      {insightState && identity && (
        <InsightsKeyNumbersStrip
          xpLast7={insightState.xpLast7}
          xpLast30={graph30Data.xpLast30}
          missionsLast7={graph30Data.missionsLast7}
          missionsLast30={graph30Data.missionsLast30}
          velocity7={insightState.xpLast7 / 7}
          completionRatePct={insightState.completionRateLast7 != null ? Math.round(insightState.completionRateLast7 * 100) : null}
          currentStreak={identity.streak.current}
          longestStreak={identity.streak.longest}
          bestDayOfWeek={insightState.bestDayOfWeek}
        />
      )}

      {/* Section 1 – Momentum Hero */}
      {insightState && (
        <>
          <InsightsMomentumHero
            score={insightState.momentum.score}
            band={insightState.momentum.band}
            trendDirection={insightState.trend.direction}
            microcopy={insightState.trend.microcopy}
          />

          {/* Funnel: view → start → complete (laatste 7 dagen) */}
          <section className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-surface)]/50 px-4 py-3" aria-label="Missie-funnel">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Funnel (laatste 7 dagen)</h3>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">Bekeken → Gestart → Voltooid</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded-lg bg-white/10 px-3 py-1.5 font-medium text-[var(--text-primary)]">View: {funnelCounts.view}</span>
              <span className="text-[var(--text-muted)]" aria-hidden>→</span>
              <span className="rounded-lg bg-white/10 px-3 py-1.5 font-medium text-[var(--text-primary)]">Start: {funnelCounts.start}</span>
              <span className="text-[var(--text-muted)]" aria-hidden>→</span>
              <span className="rounded-lg bg-[var(--accent-focus)]/20 px-3 py-1.5 font-medium text-[var(--accent-focus)]">Complete: {funnelCounts.complete}</span>
            </div>
          </section>

          {/* Section 2 – Multi-layer graph (14d) */}
          <InsightsGraphBlockClient graphData={insightState.graphData} />

          {/* Trends: 30d graph + weekly comparison */}
          <InsightsGraph30Block graphData30={graph30Data.graphData30} />
          <InsightsWeeklyComparison weeklyTotals={graph30Data.weeklyTotals} />

          {/* XP per bron (30d) */}
          <InsightsXPSourcesCard
            items={xpBySource30}
            totalXP={graph30Data.xpLast30}
            periodLabel="Laatste 30 dagen"
          />

          <InsightsRecentRanksCard items={recentRanks} />

          {/* Section 3 – Behavioral patterns */}
          <InsightsBehaviorCard bestDayOfWeek={insightState.bestDayOfWeek} />

          {/* Section 4 – Risk & forecast */}
          <InsightsRiskForecastCard
            levelProjectionDays={insightState.levelProjectionDays}
            streakRiskLevel={insightState.streakRisk.level}
            streakRiskScore={insightState.streakRisk.score}
            expectedXPNext7={insightState.xpLast7}
          />

          {/* Section 5 – Coach */}
          <InsightsCoachCard recommendations={insightState.coachRecommendations} />

          {/* Beste tijdstip (heatmap per uur) */}
          <InsightsHourHeatmap byHour={hourHeatmap} />

          {/* Drop-off pattern */}
          <InsightsDropOffCard message={dropOff.message} />

          {/* Correlation Insight Engine */}
          <InsightsCorrelationCard sentence={correlation.sentence} />

          {/* Strength vs Weakness Radar (domeinen) */}
          <InsightsRadarChart data={radar} />

          {/* Comparative Intelligence */}
          <InsightsComparativeCard sentence={comparative.sentence} />

          {/* Friction 40% langer */}
          <InsightsFriction40Card sentence={friction40.sentence} />

          {/* Consistency Map (groen/geel/rood) */}
          <InsightsConsistencyMap days={consistencyMap} />

          {/* Tracked analytics events (7d) */}
          <InsightsTrackedEventsCard items={analyticsEventsSummary} />

          {/* Power User Mode: ruwe data + export CSV */}
          <PowerUserModeToggle
            graphData={insightState.graphData}
            rawSummary={{
              xpLast7: insightState.xpLast7,
              xpPrevious7: insightState.xpPrevious7,
              completionRate: insightState.completionRateLast7,
            }}
          />
        </>
      )}

      {/* 30-day patterns: trend, heatmap, top pattern bullets */}
      <section id="patterns" className="scroll-mt-6 space-y-4" aria-label="30-day insights">
        <h2 className="hq-h2 text-[var(--text-primary)]">30-day insights</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Trend, activiteit en patronen over de laatste 30 dagen. Zie de grafiek hierboven voor energie/focus/load.
        </p>
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
          {graph30Data.graphData30.length > 0 && (
            <div className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-surface)]/50 px-4 py-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Trend (30 dagen)</h3>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                XP, energie en focus per dag in de grafiek hierboven. Gemiddelde energie:{" "}
                {(() => {
                  const withE = graph30Data.graphData30.filter((d) => d.energy != null);
                  const avg = withE.length ? withE.reduce((s, d) => s + (d.energy ?? 0), 0) / withE.length : null;
                  return avg != null ? avg.toFixed(1) : "—";
                })()}
                , focus:{" "}
                {(() => {
                  const withF = graph30Data.graphData30.filter((d) => d.focus != null);
                  const avg = withF.length ? withF.reduce((s, d) => s + (d.focus ?? 0), 0) / withF.length : null;
                  return avg != null ? avg.toFixed(1) : "—";
                })()}
                .
              </p>
            </div>
          )}
          {heatmap30Days.length > 0 && (
            <WeeklyHeatmap days={heatmap30Days} />
          )}
        </div>
        <ul className="space-y-2 rounded-xl border border-[var(--card-border)] bg-[var(--bg-surface)]/50 px-4 py-3">
          {metaInsights30.biggestSabotagePattern && (
            <li className="text-sm text-[var(--text-secondary)]">
              <span className="font-medium text-amber-400">Patroon:</span> {metaInsights30.biggestSabotagePattern}
            </li>
          )}
          {Object.keys(metaInsights30.growthPerDomain).length > 0 && (
            <li className="text-sm text-[var(--text-secondary)]">
              <span className="font-medium text-[var(--accent-focus)]">Groei per domein:</span>{" "}
              {Object.entries(metaInsights30.growthPerDomain)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([domain, pct]) => `${domain} ${Math.round(pct * 100)}%`)
                .join(", ")}
            </li>
          )}
          {thirtyDayMirror.focusRate != null && (
            <li className="text-sm text-[var(--text-secondary)]">
              <span className="font-medium text-[var(--text-muted)]">Focus (discipline):</span> {Math.round(thirtyDayMirror.focusRate * 100)}% voltooid
            </li>
          )}
          {!metaInsights30.biggestSabotagePattern && Object.keys(metaInsights30.growthPerDomain).length === 0 && thirtyDayMirror.focusRate == null && (
            <li className="text-sm text-[var(--text-muted)]">Nog niet genoeg data voor 30-dagen patronen. Blijf taken en missies loggen.</li>
          )}
        </ul>
      </section>

      <h2 className="hq-h2 text-[var(--text-primary)]">Weekrapport</h2>
      <p className="text-sm text-[var(--text-muted)]">
        Taken, learning, execution score en spaardoelen. Gebruik de weekselector voor eerdere weken.
      </p>
      <details className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/30 px-4 py-3 text-sm">
        <summary className="cursor-pointer font-medium text-[var(--text-primary)]">Wat betekenen deze insights?</summary>
        <ul className="mt-3 space-y-2 text-[var(--text-muted)]">
          <li><strong className="text-[var(--text-secondary)]">Kerncijfers:</strong> XP en missies (7d/30d), velocity (XP per dag), completion %, streak, beste dag. Alles wat we tracken.</li>
          <li><strong className="text-[var(--text-secondary)]">Momentum (0–100):</strong> Groeisnelheid (laatste vs vorige 7 dagen), completion rate en streak-stabiliteit.</li>
          <li><strong className="text-[var(--text-secondary)]">Trend:</strong> ↑ groei, → plateau, ↓ daling op basis van XP laatste 7 vs vorige 7 dagen.</li>
          <li><strong className="text-[var(--text-secondary)]">Verloop 14d / 30d:</strong> Dagelijkse XP (en optioneel energie, focus, streak). Wekelijkse vergelijking: laatste 4 weken naast elkaar.</li>
          <li><strong className="text-[var(--text-secondary)]">Tracked events (7d):</strong> Aantal keren per event (mission_completed, CTA_clicked, etc.) in de laatste 7 dagen.</li>
          <li><strong className="text-[var(--text-secondary)]">XP per bron:</strong> Waar je XP vandaan komt (missies, streak, brain status, learning) in de laatste 30 dagen.</li>
          <li><strong className="text-[var(--text-secondary)]">Voorspelling &amp; risico:</strong> Geschatte dagen tot volgend level; streak-risico op basis van activiteit en energie.</li>
          <li><strong className="text-[var(--text-secondary)]">Execution score (0–100):</strong> Weekrapport: % voltooide taken, learning, spaarvoortgang, carry-over.</li>
        </ul>
      </details>
      <ReportWeekSelector
        storedWeeks={storedWeeks}
        currentWeekStart={currentWeekStart}
        selectedWeekStart={selectedWeekStart}
      />
      <ReportAnalysis report={report} />
      <RealityReportCard report={report} />
    </div>
  );
  } catch (e) {
    console.error("[Report] Data load failed (e.g. Supabase timeout)", e instanceof Error ? e.message : e);
    return <DataUnavailable page="report" />;
  }
}
