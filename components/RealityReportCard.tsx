import Link from "next/link";
import type { RealityReport } from "@/app/actions/report";
import { formatCents } from "@/lib/utils/currency";

export function RealityReportCard({ report }: { report: RealityReport }) {
  const budgetRemaining = "budgetRemainingCents" in report ? report.budgetRemainingCents : null;
  const budgetSpent = ("budgetSpentCents" in report ? report.budgetSpentCents : undefined) ?? 0;
  const currency = ("currency" in report ? report.currency : undefined) ?? "EUR";

  return (
    <div className="card-modern overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">
          Week of {report.weekStart} – {report.weekEnd}
        </h2>
      </div>
      <div className="p-4">
      {report.executionScore != null && (
        <div className="mb-3 rounded-lg bg-[var(--bg-surface)] px-3 py-2">
          <span className="text-xs font-medium text-[var(--text-muted)]">Execution score</span>
          <p className="text-2xl font-bold tabular-nums text-[var(--accent-focus)]">{report.executionScore}/100</p>
        </div>
      )}
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-[var(--text-muted)]">Tasks</span>
            <span className="text-[var(--text-primary)]">{report.tasksCompleted} / {report.tasksPlanned} completed</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--accent-neutral)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--accent-focus)] to-[var(--accent-energy)] transition-all duration-500"
              style={{ width: `${report.tasksPlanned > 0 ? Math.min(100, (report.tasksCompleted / report.tasksPlanned) * 100) : 0}%` }}
              aria-hidden
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-[var(--text-muted)]">Learning</span>
            <span className="text-[var(--text-primary)]">{report.learningMinutes} / {report.learningTarget} min</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--accent-neutral)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--accent-energy)] to-[var(--accent-focus)] transition-all duration-500"
              style={{ width: `${report.learningTarget > 0 ? Math.min(100, (report.learningMinutes / report.learningTarget) * 100) : 0}%` }}
              aria-hidden
            />
          </div>
        </div>
      </div>
      <dl className="grid gap-3 text-sm mt-4">
        {budgetRemaining != null && (
          <div className="flex justify-between">
            <dt className="text-[var(--text-muted)]">Budget (month)</dt>
            <dd className={budgetRemaining >= 0 ? "text-[var(--text-primary)]" : "text-amber-400"}>
              {formatCents(budgetRemaining, currency)} remaining · {formatCents(-(budgetSpent ?? 0), currency)} spent
            </dd>
          </div>
        )}
        {report.avgEnergy != null && (
          <div className="flex justify-between">
            <dt className="text-[var(--text-muted)]">Avg energy</dt>
            <dd className="text-[var(--text-primary)]">{report.avgEnergy}</dd>
          </div>
        )}
        {report.avgFocus != null && (
          <div className="flex justify-between">
            <dt className="text-[var(--text-muted)]">Avg focus</dt>
            <dd className="text-[var(--text-primary)]">{report.avgFocus}</dd>
          </div>
        )}
        {report.carryOverCount > 0 && (
          <div className="flex justify-between">
            <dt className="text-[var(--text-muted)]">Carry-over (end of week)</dt>
            <dd className="text-amber-400">{report.carryOverCount}</dd>
          </div>
        )}
      </dl>
      {report.savingsProgress.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-medium text-[var(--text-muted)]">Savings progress</h3>
          <ul className="space-y-1">
            {report.savingsProgress.map((s) => (
              <li key={s.name} className="flex justify-between text-xs">
                <span className="text-[var(--text-muted)]">{s.name}</span>
                <span className="text-[var(--text-primary)]">{s.pct}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {(budgetRemaining != null || report.savingsProgress.length > 0) && (
        <Link href="/budget" className="mt-3 inline-block text-sm font-medium text-[var(--accent-focus)] hover:underline">
          Budget & goals →
        </Link>
      )}
      </div>
    </div>
  );
}
