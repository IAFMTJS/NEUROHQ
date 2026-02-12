import Link from "next/link";
import type { RealityReport } from "@/app/actions/report";

type Props = { report: RealityReport };

export function RealityReportBlock({ report }: Props) {
  const taskPct = report.tasksPlanned > 0
    ? Math.round((report.tasksCompleted / report.tasksPlanned) * 100)
    : 0;
  const learningMet = report.learningMinutes >= report.learningTarget;
  return (
    <div className="card-modern overflow-hidden p-0">
      <div className="border-b border-neuro-border px-4 py-3">
        <h2 className="text-base font-semibold text-neuro-silver">Last week</h2>
        <p className="mt-0.5 text-xs text-neuro-muted">
          {report.weekStart} – {report.weekEnd}
        </p>
      </div>
      <div className="p-4">
        <dl className="grid gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-neuro-muted">Tasks</dt>
            <dd className="text-neuro-silver">
              {report.tasksCompleted} / {report.tasksPlanned} ({taskPct}%)
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neuro-muted">Learning</dt>
            <dd className="text-neuro-silver">
              {report.learningMinutes} / {report.learningTarget} min
              {learningMet ? " ✓" : ""}
            </dd>
          </div>
          {report.carryOverCount > 0 && (
            <div className="flex justify-between">
              <dt className="text-neuro-muted">Carry-over</dt>
              <dd className="text-amber-400">{report.carryOverCount}</dd>
            </div>
          )}
        </dl>
        <Link
          href="/report"
          className="mt-3 inline-block text-sm font-medium text-neuro-blue hover:underline"
        >
          Full report →
        </Link>
      </div>
    </div>
  );
}
