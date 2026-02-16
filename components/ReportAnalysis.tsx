import type { RealityReport } from "@/app/actions/report";

type Props = { report: RealityReport };

export function ReportAnalysis({ report }: Props) {
  const taskPct = report.tasksPlanned > 0
    ? Math.round((report.tasksCompleted / report.tasksPlanned) * 100)
    : 0;
  const learningMet = report.learningMinutes >= report.learningTarget;
  const lines: string[] = [];

  if (report.tasksPlanned > 0) {
    if (taskPct >= 80) {
      lines.push(`You completed ${taskPct}% of planned tasks — strong execution this week.`);
    } else if (taskPct >= 50) {
      lines.push(`You completed ${taskPct}% of planned tasks. Consider focusing on fewer, higher-impact items next week.`);
    } else if (report.tasksPlanned > 0) {
      lines.push(`You completed ${report.tasksCompleted} of ${report.tasksPlanned} tasks. Review what blocked you and adjust capacity or scope.`);
    }
  } else {
    lines.push("No tasks were planned this week. Add a few for next week to keep momentum.");
  }

  if (learningMet) {
    lines.push(`Learning goal met (${report.learningMinutes} / ${report.learningTarget} min).`);
  } else if (report.learningTarget > 0) {
    lines.push(`Learning: ${report.learningMinutes} / ${report.learningTarget} min. Small, consistent sessions add up.`);
  }

  if (report.avgEnergy != null || report.avgFocus != null) {
    const parts: string[] = [];
    if (report.avgEnergy != null) parts.push(`energy ${report.avgEnergy}/10`);
    if (report.avgFocus != null) parts.push(`focus ${report.avgFocus}/10`);
    lines.push(`Average check-in: ${parts.join(", ")}.`);
  }

  if (report.carryOverCount > 0) {
    lines.push(`${report.carryOverCount} task(s) carried over at week end — consider rescheduling or reducing next week’s load.`);
  }

  if (report.savingsProgress.length > 0) {
    lines.push(`Savings: ${report.savingsProgress.length} goal(s) tracked; keep going.`);
  }

  if (report.executionScore != null) {
    lines.unshift(`Execution score: ${report.executionScore}/100 this week.`);
  }

  if (lines.length === 0) {
    lines.push("Log tasks, learning, and daily state to get a richer summary next week.");
  }

  return (
    <div className="card-modern-accent overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)]/80 px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Summary & analysis</h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">What the numbers suggest for this week.</p>
      </div>
      <div className="p-4">
        <ul className="space-y-2 text-sm text-[var(--text-primary)] leading-relaxed">
          {lines.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
