type Props = {
  used: number;
  remaining: number;
  capacity: number;
  /** Suggested task count from brain status (drives capacity). */
  suggestedTaskCount: number;
  /** Energy already spent by completed (checked) tasks. */
  taskUsed: number;
  /** Number of completed tasks today. */
  completedTaskCount: number;
  /** Energy that incomplete tasks would use. */
  taskPlanned: number;
  calendarCost: number;
};

export function EnergyBudgetBar({
  used,
  remaining,
  capacity,
  suggestedTaskCount,
  taskUsed,
  completedTaskCount,
  taskPlanned,
  calendarCost,
}: Props) {
  const remainingPct = capacity > 0 ? (remaining / capacity) * 100 : 0;
  return (
    <div className="card-modern-accent overflow-hidden p-0">
      <div className="border-b border-neuro-border/80 px-4 py-3">
        <h2 className="text-base font-semibold text-neuro-silver">Energy budget</h2>
        <p className="mt-0.5 text-xs text-neuro-muted">
          Brain status suggests ~{suggestedTaskCount} task{suggestedTaskCount !== 1 ? "s" : ""} today. Capacity updates when you save your check-in.
        </p>
      </div>
      <div className="p-5">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tabular-nums text-neuro-blue">{remaining}</span>
          <span className="text-neuro-muted">/ {capacity} left</span>
        </div>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-neuro-border">
          <div
            className="h-full rounded-full bg-neuro-blue transition-all duration-300"
            style={{ width: `${Math.min(100, remainingPct)}%` }}
          />
        </div>
        {(completedTaskCount > 0 || taskPlanned > 0 || calendarCost > 0) && (
          <p className="mt-2 text-xs text-neuro-muted">
            {completedTaskCount > 0 && (
              <span>{completedTaskCount} task{completedTaskCount !== 1 ? "s" : ""} completed ({taskUsed} energy)</span>
            )}
            {taskPlanned > 0 && (completedTaskCount > 0 ? " · " : "")}
            {taskPlanned > 0 && <span>Planned: {taskPlanned}</span>}
            {calendarCost > 0 && ((completedTaskCount > 0 || taskPlanned > 0) ? " · " : "")}
            {calendarCost > 0 && <span>Calendar: {calendarCost}</span>}
          </p>
        )}
      </div>
    </div>
  );
}
