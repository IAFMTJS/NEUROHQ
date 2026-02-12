import { getRealityReport, getStoredReport, getStoredReportWeeks } from "@/app/actions/report";
import { getWeekBounds } from "@/lib/utils/learning";
import { RealityReportCard } from "@/components/RealityReportCard";
import { ReportWeekSelector } from "@/components/ReportWeekSelector";

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
      <h1 className="text-xl font-bold text-neuro-silver">Reality report</h1>
      <p className="text-sm text-neutral-400">
        {isCurrentWeek ? "Summary of this week." : `Past week: ${report.weekStart} – ${report.weekEnd}.`}
      </p>
      <ReportWeekSelector
        storedWeeks={storedWeeks}
        currentWeekStart={currentWeekStart}
        selectedWeekStart={selectedWeekStart}
      />
      <RealityReportCard report={report} />
    </div>
  );
}
