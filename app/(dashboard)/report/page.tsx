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
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Reality report</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          {isCurrentWeek ? "Summary of this week." : `Past week: ${report.weekStart} – ${report.weekEnd}.`}
        </p>
      </div>
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
