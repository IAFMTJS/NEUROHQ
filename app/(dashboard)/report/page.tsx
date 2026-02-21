import dynamic from "next/dynamic";
import { getMascotSrcForPage } from "@/lib/mascots";
import { HQPageHeader } from "@/components/hq";
import { getRealityReport, getStoredReport, getStoredReportWeeks } from "@/app/actions/report";
import { getInsightEngineState } from "@/app/actions/dcic/insight-engine";
import { getWeekBounds } from "@/lib/utils/learning";
import {
  InsightsMomentumHero,
  InsightsGraphBlock,
  InsightsBehaviorCard,
  InsightsRiskForecastCard,
  InsightsCoachCard,
} from "@/components/insights";

const ReportWeekSelector = dynamic(() => import("@/components/ReportWeekSelector").then((m) => ({ default: m.ReportWeekSelector })), { loading: () => <div className="min-h-[48px] animate-pulse rounded-lg bg-white/5" aria-hidden /> });
const ReportAnalysis = dynamic(() => import("@/components/ReportAnalysis").then((m) => ({ default: m.ReportAnalysis })), { loading: () => <div className="min-h-[120px] animate-pulse rounded-xl bg-white/5" aria-hidden /> });
const RealityReportCard = dynamic(() => import("@/components/RealityReportCard").then((m) => ({ default: m.RealityReportCard })), { loading: () => <div className="glass-card min-h-[180px] animate-pulse rounded-[22px]" aria-hidden /> });
const InsightsGraphBlockClient = dynamic(
  () => import("@/components/insights/InsightsGraphBlock").then((m) => ({ default: m.InsightsGraphBlock })),
  { loading: () => <div className="min-h-[320px] animate-pulse rounded-[var(--hq-card-radius-sharp)] bg-white/5" aria-hidden /> }
);

type Props = { searchParams: Promise<{ weekStart?: string }> };

export default async function ReportPage({ searchParams }: Props) {
  const today = new Date();
  const { start: currentWeekStart, end: currentWeekEnd } = getWeekBounds(today);
  const params = await searchParams;
  const weekStartParam = params.weekStart;

  const [storedWeeks, currentReport, insightState] = await Promise.all([
    getStoredReportWeeks(),
    getRealityReport(currentWeekStart, currentWeekEnd),
    getInsightEngineState(),
  ]);

  const selectedWeekStart = weekStartParam ?? currentWeekStart;
  const isCurrentWeek = selectedWeekStart === currentWeekStart;

  const report = isCurrentWeek
    ? currentReport
    : (await getStoredReport(selectedWeekStart)) ?? currentReport;

  return (
    <div className="container page space-y-6">
      <HQPageHeader
        title="Insights"
        subtitle={isCurrentWeek ? "Verklaren, voorspellen, sturen." : `Afgelopen week: ${report.weekStart} – ${report.weekEnd}.`}
        backHref="/dashboard"
      />
      <p className="text-sm text-[var(--text-muted)]">
        Momentum, trend, gedragspatronen en aanbevelingen. Onderaan je weekrapport: taken, learning, budget.
      </p>
      <section className="mascot-hero mascot-hero-top" data-mascot-page="report" aria-hidden>
        <img src={getMascotSrcForPage("report")} alt="" className="mascot-img" />
      </section>

      {/* Section 1 – Momentum Hero */}
      {insightState && (
        <>
          <InsightsMomentumHero
            score={insightState.momentum.score}
            band={insightState.momentum.band}
            trendDirection={insightState.trend.direction}
            microcopy={insightState.trend.microcopy}
          />

          {/* Section 2 – Multi-layer graph */}
          <InsightsGraphBlockClient graphData={insightState.graphData} />

          {/* Section 3 – Behavioral patterns */}
          <InsightsBehaviorCard bestDayOfWeek={insightState.bestDayOfWeek} />

          {/* Section 4 – Risk & forecast */}
          <InsightsRiskForecastCard
            levelProjectionDays={insightState.levelProjectionDays}
            streakRiskLevel={insightState.streakRisk.level}
            streakRiskScore={insightState.streakRisk.score}
          />

          {/* Section 5 – Coach */}
          <InsightsCoachCard recommendations={insightState.coachRecommendations} />
        </>
      )}

      <h2 className="hq-h2 text-[var(--text-primary)]">Weekrapport</h2>
      <p className="text-sm text-[var(--text-muted)]">
        Taken, learning, execution score en spaardoelen. Gebruik de weekselector voor eerdere weken.
      </p>
      <details className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/30 px-4 py-3 text-sm">
        <summary className="cursor-pointer font-medium text-[var(--text-primary)]">Wat betekenen deze insights?</summary>
        <ul className="mt-3 space-y-2 text-[var(--text-muted)]">
          <li><strong className="text-[var(--text-secondary)]">Momentum (0–100):</strong> Groeisnelheid (laatste vs vorige 7 dagen), completion rate en streak-stabiliteit.</li>
          <li><strong className="text-[var(--text-secondary)]">Trend:</strong> ↑ groei, → plateau, ↓ daling op basis van XP laatste 7 vs vorige 7 dagen.</li>
          <li><strong className="text-[var(--text-secondary)]">Execution score (0–100):</strong> Samengesteld uit % voltooide taken, behaald learning-doel, spaarvoortgang en aftrek voor carry-over.</li>
          <li><strong className="text-[var(--text-secondary)]">Tasks / Learning / Carry-over:</strong> Zie weekrapport hieronder.</li>
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
}
