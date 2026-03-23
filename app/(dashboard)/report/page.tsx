import nextDynamic from "next/dynamic";
import { Suspense } from "react";
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
  DataMaturityBanner,
  InsightsMomentumHero,
  InsightsKeyNumbersStrip,
  InsightsGraph30Block,
  InsightsWeeklyComparison,
  InsightsXPSourcesCard,
  InsightsBehaviorCard,
  InsightsRiskForecastCard,
  InsightsCoachCard,
  InsightsHourHeatmap,
  InsightsConsistencyMap,
  InsightsRadarChart,
  InsightsRecentRanksCard,
  InsightsPatternSignalsCard,
} from "@/components/insights";
import { DataUnavailable } from "@/components/DataUnavailable";
import { ReportSnapshotFallback } from "@/components/report/ReportSnapshotFallback";
import { InsightsTabsShell, isInsightsTabId } from "@/components/report/InsightsTabsShell";
import { InsightsDiagnosticsPopup } from "@/components/report/InsightsDiagnosticsPopup";

const ReportWeekSelector = nextDynamic(
  () => import("@/components/ReportWeekSelector").then((m) => ({ default: m.ReportWeekSelector })),
  { loading: () => null }
);
const ReportAnalysis = nextDynamic(
  () => import("@/components/ReportAnalysis").then((m) => ({ default: m.ReportAnalysis })),
  { loading: () => null }
);
const RealityReportCard = nextDynamic(
  () => import("@/components/RealityReportCard").then((m) => ({ default: m.RealityReportCard })),
  { loading: () => null }
);
const InsightsGraphBlockClient = nextDynamic(
  () => import("@/components/insights/InsightsGraphBlock").then((m) => ({ default: m.InsightsGraphBlock })),
  { loading: () => null }
);
const WeeklyHeatmap = nextDynamic(
  () => import("@/components/dashboard/WeeklyHeatmap").then((m) => ({ default: m.WeeklyHeatmap })),
  { loading: () => null }
);

type Props = { searchParams: Promise<{ weekStart?: string; tab?: string }> };

/** Force dynamic: report uses searchParams (weekStart) and auth/data. */
export const dynamic = "force-dynamic";

function ReportShell() {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <HQPageHeader
          title="Insights"
          subtitle="Verklaren, voorspellen, sturen."
          backHref="/dashboard"
        />
        <div className="h-9 w-24 animate-pulse rounded-lg bg-white/10" aria-hidden />
      </div>
      <p className="text-sm text-[var(--text-muted)]">
        Momentum, trend, gedragspatronen, voorspellingen en aanbevelingen. Alles wat we tracken: 7d / 30d, bronnen, wekelijkse vergelijking.
      </p>
      <section className="mascot-hero mascot-hero-top mascot-hero-sharp" data-mascot-page="report" aria-hidden>
        <div className="mascot-hero-inner mx-auto">
          <HeroMascotImage page="report" className="mascot-img" heroLarge />
        </div>
      </section>
    </>
  );
}

async function ReportContent({ searchParams }: { searchParams: Promise<{ weekStart?: string; tab?: string }> }) {
  try {
    const params = await searchParams;
    const today = new Date();
    const { start: currentWeekStart, end: currentWeekEnd } = getWeekBounds(today);
    const weekStartParam = params.weekStart;
    const tabParam = params.tab;

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
    const activeTab = isInsightsTabId(tabParam) ? tabParam : "overview";
    const isCurrentWeek = selectedWeekStart === currentWeekStart;

    const report = isCurrentWeek
      ? currentReport
      : (await getStoredReport(selectedWeekStart)) ?? currentReport;

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <XPBadge totalXp={xp.total_xp} level={xp.level} compact href="/xp" />
        </div>
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

        {insightState && (
          <DataMaturityBanner maturity={insightState.dataMaturity} message={insightState.dataMaturityMessageNl} />
        )}

        {insightState && (
          <InsightsTabsShell activeTab={activeTab} weekStart={weekStartParam}>
            {activeTab === "overview" && (
              <div className="space-y-4">
                <InsightsMomentumHero
                  score={insightState.momentum.score}
                  band={insightState.momentum.band}
                  trendDirection={insightState.trend.direction}
                  microcopy={insightState.trend.microcopy}
                />
                <div className="grid gap-4 lg:grid-cols-2">
                  <InsightsRiskForecastCard
                    levelProjectionDays={insightState.levelProjectionDays}
                    streakRiskLevel={insightState.streakRisk.level}
                    streakRiskScore={insightState.streakRisk.score}
                    expectedXPNext7={insightState.xpLast7}
                  />
                  <InsightsBehaviorCard bestDayOfWeek={insightState.bestDayOfWeek} />
                </div>
                <details className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/30 px-4 py-3">
                  <summary className="cursor-pointer text-sm font-semibold text-[var(--text-primary)]">
                    Aanbevolen strategie (max 3 acties)
                  </summary>
                  <div className="mt-3">
                    <InsightsCoachCard recommendations={insightState.coachRecommendations} />
                  </div>
                </details>
              </div>
            )}

            {activeTab === "performance" && (
              <div className="space-y-4">
                <InsightsGraphBlockClient graphData={insightState.graphData} />
                <details className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/30 px-4 py-3">
                  <summary className="cursor-pointer text-sm font-semibold text-[var(--text-primary)]">
                    Historische trend (30 dagen + weekvergelijking)
                  </summary>
                  <div className="mt-3 space-y-4">
                    <InsightsGraph30Block graphData30={graph30Data.graphData30} />
                    <InsightsWeeklyComparison weeklyTotals={graph30Data.weeklyTotals} />
                  </div>
                </details>
                <div className="grid gap-4 lg:grid-cols-2">
                  <InsightsXPSourcesCard
                    items={xpBySource30}
                    totalXP={graph30Data.xpLast30}
                    periodLabel="Laatste 30 dagen"
                  />
                  <InsightsRecentRanksCard items={recentRanks} />
                </div>
              </div>
            )}

            {activeTab === "patterns" && (
              <section id="patterns" className="scroll-mt-6 space-y-4" aria-label="Pattern insights">
                <InsightsPatternSignalsCard
                  dropOffMessage={dropOff.message}
                  correlationSentence={correlation.sentence}
                  comparativeSentence={comparative.sentence}
                  frictionSentence={friction40.sentence}
                />
                <div className="grid gap-4 lg:grid-cols-2">
                  <InsightsHourHeatmap byHour={hourHeatmap} />
                  <InsightsConsistencyMap days={consistencyMap} />
                </div>
                <details className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/30 px-4 py-3">
                  <summary className="cursor-pointer text-sm font-semibold text-[var(--text-primary)]">
                    Diepte-analyse (30 dagen)
                  </summary>
                  <div className="mt-3 space-y-4">
                    <InsightsRadarChart data={radar} />
                    <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                      {graph30Data.graphData30.length > 0 && (
                        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-surface)]/50 px-4 py-3">
                          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Trend-samenvatting (30 dagen)</h3>
                          <p className="mt-1 text-xs text-[var(--text-muted)]">
                            Gemiddelde energie:{" "}
                            {(() => {
                              const withE = graph30Data.graphData30.filter((d) => d.energy != null);
                              const avg = withE.length ? withE.reduce((s, d) => s + (d.energy ?? 0), 0) / withE.length : null;
                              return avg != null ? avg.toFixed(1) : "—";
                            })()}
                            {" "}· focus:{" "}
                            {(() => {
                              const withF = graph30Data.graphData30.filter((d) => d.focus != null);
                              const avg = withF.length ? withF.reduce((s, d) => s + (d.focus ?? 0), 0) / withF.length : null;
                              return avg != null ? avg.toFixed(1) : "—";
                            })()}
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
                          <span className="font-medium text-[var(--text-muted)]">Focus (discipline):</span>{" "}
                          {Math.round(thirtyDayMirror.focusRate * 100)}% voltooid
                        </li>
                      )}
                      {!metaInsights30.biggestSabotagePattern &&
                        Object.keys(metaInsights30.growthPerDomain).length === 0 &&
                        thirtyDayMirror.focusRate == null && (
                          <li className="text-sm text-[var(--text-muted)]">
                            Nog niet genoeg data voor 30-dagen patronen. Blijf taken en missies loggen.
                          </li>
                      )}
                    </ul>
                  </div>
                </details>
              </section>
            )}

            {activeTab === "diagnostics" && (
              <div className="space-y-4">
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

                <InsightsDiagnosticsPopup
                  graphData={insightState.graphData}
                  analyticsEventsSummary={analyticsEventsSummary}
                  rawSummary={{
                    xpLast7: insightState.xpLast7,
                    xpPrevious7: insightState.xpPrevious7,
                    completionRate: insightState.completionRateLast7,
                  }}
                />

                <details className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/30 px-4 py-3 text-sm">
                  <summary className="cursor-pointer font-medium text-[var(--text-primary)]">Wat betekenen deze insights?</summary>
                  <ul className="mt-3 space-y-2 text-[var(--text-muted)]">
                    <li><strong className="text-[var(--text-secondary)]">Kerncijfers:</strong> XP en missies (7d/30d), velocity, completion %, streak en beste dag.</li>
                    <li><strong className="text-[var(--text-secondary)]">Momentum (0–100):</strong> Gebaseerd op groeisnelheid, completion rate en streak-stabiliteit.</li>
                    <li><strong className="text-[var(--text-secondary)]">Performance trends:</strong> 14d/30d grafieken en weekvergelijking helpen pieken en dippen verklaren.</li>
                    <li><strong className="text-[var(--text-secondary)]">Voorspelling &amp; risico:</strong> Schatting naar volgend level + streak-risico.</li>
                    <li><strong className="text-[var(--text-secondary)]">Execution score:</strong> Weekrapport met tasks, learning, sparen en carry-over.</li>
                  </ul>
                </details>

                <details
                  className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/30 px-4 py-3 text-sm"
                  open={isCurrentWeek}
                >
                  <summary className="cursor-pointer font-medium text-[var(--text-primary)]">Weekrapport en archief</summary>
                  <div className="mt-3 space-y-4">
                    <p className="text-sm text-[var(--text-muted)]">
                      Taken, learning, execution score en spaardoelen. Gebruik de weekselector voor eerdere weken.
                    </p>
                    <ReportWeekSelector
                      storedWeeks={storedWeeks}
                      currentWeekStart={currentWeekStart}
                      selectedWeekStart={selectedWeekStart}
                      activeTab={activeTab}
                    />
                    <ReportAnalysis report={report} />
                    <RealityReportCard report={report} />
                  </div>
                </details>
              </div>
            )}
          </InsightsTabsShell>
        )}

        {!insightState && (
          <section className="space-y-4 rounded-xl border border-[var(--card-border)] bg-[var(--bg-surface)]/35 px-4 py-4">
            <p className="text-sm text-[var(--text-muted)]">
              Nog niet genoeg persoonlijke data voor alle Insights-tabs. Het weekrapport is wel beschikbaar.
            </p>
            <ReportWeekSelector
              storedWeeks={storedWeeks}
              currentWeekStart={currentWeekStart}
              selectedWeekStart={selectedWeekStart}
              activeTab={activeTab}
            />
            <ReportAnalysis report={report} />
            <RealityReportCard report={report} />
          </section>
        )}
      </div>
    );
  } catch (e) {
    console.error("[Report] Data load failed (e.g. Supabase timeout)", e instanceof Error ? e.message : e);
    return <DataUnavailable page="report" />;
  }
}

export default function ReportPage({ searchParams }: Props) {
  return (
    <div className="container page page-wide space-y-6">
      <ReportShell />
      <Suspense fallback={<ReportSnapshotFallback />}>
        <ReportContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
