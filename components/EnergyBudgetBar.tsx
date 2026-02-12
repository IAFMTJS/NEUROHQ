type Props = {
  used: number;
  remaining: number;
  taskCost: number;
  calendarCost: number;
};

const CAP = 100;

export function EnergyBudgetBar({ used, remaining, taskCost, calendarCost }: Props) {
  const pct = (used / CAP) * 100;
  return (
    <div className="card-modern-accent p-5">
      <h2 className="mb-2 text-sm font-semibold text-neuro-silver">Energy budget</h2>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold tabular-nums text-neuro-blue">{remaining}</span>
        <span className="text-neuro-muted">/ {CAP} left</span>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-neuro-border">
        <div
          className="h-full rounded-full bg-neuro-blue transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      {(taskCost > 0 || calendarCost > 0) && (
        <p className="mt-2 text-xs text-neuro-muted">
          Tasks: {taskCost} · Calendar: {calendarCost}
        </p>
      )}
    </div>
  );
}
