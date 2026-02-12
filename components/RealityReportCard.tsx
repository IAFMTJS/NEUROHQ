import type { RealityReport } from "@/app/actions/report";

export function RealityReportCard({ report }: { report: RealityReport }) {
  return (
    <div className="space-y-4 rounded-lg border border-neutral-700 bg-neuro-surface p-4">
      <h2 className="text-sm font-medium text-neuro-silver">
        Week of {report.weekStart} – {report.weekEnd}
      </h2>
      <dl className="grid gap-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-neutral-400">Tasks</dt>
          <dd className="text-neuro-silver">
            {report.tasksCompleted} / {report.tasksPlanned} completed
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-neutral-400">Learning</dt>
          <dd className="text-neuro-silver">
            {report.learningMinutes} / {report.learningTarget} min
          </dd>
        </div>
        {report.avgEnergy != null && (
          <div className="flex justify-between">
            <dt className="text-neutral-400">Avg energy</dt>
            <dd className="text-neuro-silver">{report.avgEnergy}</dd>
          </div>
        )}
        {report.avgFocus != null && (
          <div className="flex justify-between">
            <dt className="text-neutral-400">Avg focus</dt>
            <dd className="text-neuro-silver">{report.avgFocus}</dd>
          </div>
        )}
        {report.carryOverCount > 0 && (
          <div className="flex justify-between">
            <dt className="text-neutral-400">Carry-over (end of week)</dt>
            <dd className="text-amber-400">{report.carryOverCount}</dd>
          </div>
        )}
      </dl>
      {report.savingsProgress.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-medium text-neutral-400">Savings progress</h3>
          <ul className="space-y-1">
            {report.savingsProgress.map((s) => (
              <li key={s.name} className="flex justify-between text-xs">
                <span className="text-neutral-400">{s.name}</span>
                <span className="text-neuro-silver">{s.pct}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
