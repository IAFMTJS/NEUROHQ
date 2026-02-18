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
    <div className="space-y-6">
      <HQPageHeader
        title="Reality report"
        subtitle={isCurrentWeek ? "Summary of this week." : `Past week: ${report.weekStart} – ${report.weekEnd}.`}
        backHref="/dashboard"
      />
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
