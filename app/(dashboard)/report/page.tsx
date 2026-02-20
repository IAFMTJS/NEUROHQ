import { getMascotSrcForPage } from "@/lib/mascots";
import { HQPageHeader } from "@/components/hq";
import { getRealityReport, getStoredReport, getStoredReportWeeks } from "@/app/actions/report";
import { getWeekBounds } from "@/lib/utils/learning";
import { RealityReportCard } from "@/components/RealityReportCard";
import { ReportWeekSelector } from "@/components/ReportWeekSelector";
import { ReportAnalysis } from "@/components/ReportAnalysis";

type Props = { searchParams: Promise<{ weekStart?: string }> };

export default async function ReportPage({ searchParams }: Props) {
  const today = new Date();
  const { start: currentWeekStart, end: currentWeekEnd } = getWeekBounds(today);
  const params = await searchParams;
  const weekStartParam = params.weekStart;

  const [storedWeeks, currentReport] = await Promise.all([
    getStoredReportWeeks(),
    getRealityReport(currentWeekStart, currentWeekEnd),
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
        subtitle={isCurrentWeek ? "Samenvatting van deze week." : `Afgelopen week: ${report.weekStart} – ${report.weekEnd}.`}
        backHref="/dashboard"
      />
      <p className="text-sm text-[var(--text-muted)]">
        Hier zie je je week in cijfers: taken, learning, energie-check-ins, budget en spaardoelen. De execution score combineert uitvoering (taken + learning) met spaarvoortgang en carry-over. Gebruik de weekselector voor eerdere weken.
      </p>
      <details className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/30 px-4 py-3 text-sm">
        <summary className="cursor-pointer font-medium text-[var(--text-primary)]">Wat betekenen deze insights?</summary>
        <ul className="mt-3 space-y-2 text-[var(--text-muted)]">
          <li><strong className="text-[var(--text-secondary)]">Execution score (0–100):</strong> Samengesteld uit % voltooide taken, behaald learning-doel, spaarvoortgang en aftrek voor carry-over. Hoger = betere week-uitvoering.</li>
          <li><strong className="text-[var(--text-secondary)]">Tasks:</strong> Aantal geplande taken (due in die week) vs. hoeveel je hebt afgevinkt. Helpt om scope en capaciteit bij te stellen.</li>
          <li><strong className="text-[var(--text-secondary)]">Learning:</strong> Minuten leren vs. wekelijkse doel (Growth). Consistentie telt mee voor de score.</li>
          <li><strong className="text-[var(--text-secondary)]">Carry-over:</strong> Niet-afgeronde taken aan het einde van de week. Veel carry-over = minder score; overweeg minder plannen of verzetten.</li>
          <li><strong className="text-[var(--text-secondary)]">Avg energy/focus:</strong> Gemiddelde van je dagelijkse check-ins (Dashboard → Brain status). Zicht op hoe je week voelde.</li>
        </ul>
      </details>
      <section className="mascot-hero mascot-hero-top" data-mascot-page="report" aria-hidden>
        <img src={getMascotSrcForPage("report")} alt="" className="mascot-img" />
      </section>
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
