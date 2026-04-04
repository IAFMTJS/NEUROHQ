import nextDynamic from "next/dynamic";
import { getXPFullContext } from "@/app/actions/xp-context";
import { XPBadge } from "@/components/XPBadge";
import { getRealityReport, getStoredReport, getStoredReportWeeks } from "@/app/actions/report";
import { createClient } from "@/lib/supabase/server";
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
import { InsightsTabsShell, isInsightsTabId } from "@/components/report/InsightsTabsShell";

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

export type ReportInsightsSearchParams = Promise<{ weekStart?: string; tab?: string }>;

type Props = {
  searchParams: ReportInsightsSearchParams;
  simplifiedLayout?: boolean;
};

export async function ReportInsightsContent({ searchParams, simplifiedLayout = false }: Props) {
  try {
    const params = await searchParams;
    const today = new Date();
    const { start: currentWeekStart, end: currentWeekEnd } = getWeekBounds(today);
    const weekStartParam = params.weekStart;
    const tabParam = params.tab;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id;

    const [xpContext, storedWeeks, currentReport, hourHeatmap, consistencyMap, dropOff, correlation, radar, comparative, friction40, graph30Data, xpBySource30, metaInsights30, heatmap30Days, thirtyDayMirror, recentRanks] = await Promise.all([
      getXPFullContext(undefined, userId),
      getStoredReportWeeks(),
      getRealityReport(currentWeekStart, currentWeekEnd),
      getBestHourHeatmap(),
      getConsistencyMap(),
      getDropOffPattern(),
      getCorrelationInsights(),
      getStrengthWeaknessRadar(),
      getComparativeIntelligence(),
      getFriction40Insight(),
      getGraphData30Days(),
      getXPBySourceLast30(),
      getMetaInsights30(),
      getHeatmapLast30Days(),
      getThirtyDayMirror(),
      getRecentCompletionsWithRank(20),
    ]);
    const { xp, identity, insightState } = xpContext;

    const selectedWeekStart = weekStartParam ?? currentWeekStart;
    const activeTab = isInsightsTabId(tabParam) ? tabParam : "overview";
    const isCurrentWeek = selectedWeekStart === currentWeekStart;

    const report = isCurrentWeek ? currentReport : (await getStoredReport(selectedWeekStart)) ?? currentReport;

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <XPBadge totalXp={xp.total_xp} level={xp.level} compact href="/profile" />
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

        {insightState && <DataMaturityBanner maturity={insightState.dataMaturity} message={insightState.dataMaturityMessageNl} />}

        {insightState && (
          <InsightsTabsShell activeTab={activeTab} weekStart={weekStartParam} simplifiedLayout={simplifiedLayout}>
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
                  <summary className="cursor-pointer text-sm font-semibold text-[var(--text-primary)]">Aanbevolen strategie (max 3 acties)</summary>
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
                  <summary className="cursor-pointer text-sm font-semibold text-[var(--text-primary)]">Historische trend (30 dagen + weekvergelijking)</summary>
                  <div className="mt-3 space-y-4">
                    <InsightsGraph30Block graphData30={graph30Data.graphData30} />
                    <InsightsWeeklyComparison weeklyTotals={graph30Data.weeklyTotals} />
                  </div>
                </details>
                <div className="grid gap-4 lg:grid-cols-2">
                  <InsightsXPSourcesCard items={xpBySource30} totalXP={graph30Data.xpLast30} periodLabel="Laatste 30 dagen" />
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
                  <summary className="cursor-pointer text-sm font-semibold text-[var(--text-primary)]">Diepte-analyse (30 dagen)</summary>
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
                            })()}{" "}
                            · focus:{" "}
                            {(() => {
                              const withF = graph30Data.graphData30.filter((d) => d.focus != null);
                              const avg = withF.length ? withF.reduce((s, d) => s + (d.focus ?? 0), 0) / withF.length : null;
                              return avg != null ? avg.toFixed(1) : "—";
                            })()}
                          </p>
                        </div>
                      )}
                      {heatmap30Days.length > 0 && <WeeklyHeatmap days={heatmap30Days} />}
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
                          <li className="text-sm text-[var(--text-muted)]">Nog niet genoeg data voor 30-dagen patronen. Blijf taken en missies loggen.</li>
                        )}
                    </ul>
                  </div>
                </details>
              </section>
            )}

          </InsightsTabsShell>
        )}

        {!insightState && (
          <section className="space-y-4 rounded-xl border border-[var(--card-border)] bg-[var(--bg-surface)]/35 px-4 py-4">
            <p className="text-sm text-[var(--text-muted)]">Nog niet genoeg persoonlijke data voor alle Insights-tabs. Het weekrapport is wel beschikbaar.</p>
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
    console.error("[Insights] Data load failed (e.g. Supabase timeout)", e instanceof Error ? e.message : e);
    return <DataUnavailable page="report" />;
  }
}
