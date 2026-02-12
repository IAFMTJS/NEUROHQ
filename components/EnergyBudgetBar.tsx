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
    <div className="rounded-lg border border-neutral-700 bg-neuro-surface p-4">
      <h2 className="mb-2 text-sm font-medium text-neuro-silver">Energy budget</h2>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-neuro-blue">{remaining}</span>
        <span className="text-neutral-400">/ {CAP} left</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral-700">
        <div
          className="h-full rounded-full bg-neuro-blue transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      {(taskCost > 0 || calendarCost > 0) && (
        <p className="mt-2 text-xs text-neutral-500">
          Tasks: {taskCost} · Calendar: {calendarCost}
        </p>
      )}
    </div>
  );
}
