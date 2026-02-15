import Link from "next/link";
import type { WeekSummary } from "@/app/actions/analytics";

type Props = {
  summary: WeekSummary | null;
};

function formatMinutes(m: number): string {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const min = m % 60;
  return min ? `${h}h ${min}m` : `${h}h`;
}

export function AnalyticsWeekWidget({ summary }: Props) {
  if (!summary) return null;

  const taskPct = summary.totalTasksPlanned > 0
    ? Math.round((summary.totalTasksCompleted / summary.totalTasksPlanned) * 100)
    : 0;
  const learningHit = summary.totalLearningMinutes >= summary.learningTargetMinutes;
  const vsCopy =
    summary.avgEnergy != null
      ? `Avg energy ${summary.avgEnergy.toFixed(1)}/10`
      : "Log brain status to see trends";

  return (
    <Link
      href="/analytics"
      className="card-modern flex flex-col gap-2 p-4 hover:bg-[var(--neuro-surface)]/80 transition"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Your week</h2>
        <span className="text-xs text-[var(--accent-focus)]">Analytics →</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <span className="text-[var(--text-muted)]">Check-ins</span>
        <span className="text-right text-[var(--text-primary)]">{summary.daysWithCheckIn} days</span>
        <span className="text-[var(--text-muted)]">Tasks</span>
        <span className="text-right text-[var(--text-primary)]">{summary.totalTasksCompleted} / {summary.totalTasksPlanned} ({taskPct}%)</span>
        <span className="text-[var(--text-muted)]">Learning</span>
        <span className="text-right text-[var(--text-primary)]">
          {formatMinutes(summary.totalLearningMinutes)} / {summary.learningTargetMinutes} min {learningHit ? "✓" : ""}
        </span>
        <span className="text-[var(--text-muted)]">Focus time</span>
        <span className="text-right text-[var(--text-primary)]">{formatMinutes(Math.floor(summary.activeSeconds / 60))}</span>
      </div>
      <p className="text-[10px] text-[var(--text-muted)]">{vsCopy}</p>
    </Link>
  );
}
