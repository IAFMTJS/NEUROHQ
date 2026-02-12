type Week = { weekStart: string; minutes: number };
type Props = { weeks: Week[]; target: number };

export function LearningMonthlyView({ weeks, target }: Props) {
  if (weeks.length === 0) return null;
  return (
    <div className="rounded-xl border border-neuro-border bg-neuro-dark/40 px-4 py-3">
      <p className="mb-2 text-xs font-medium text-neuro-muted">Weeks this month</p>
      <ul className="space-y-1.5">
        {weeks.map((w) => {
          const pct = target ? Math.min(100, Math.round((w.minutes / target) * 100)) : 0;
          return (
            <li key={w.weekStart} className="flex items-center gap-2 text-sm">
              <span className="w-24 shrink-0 text-neuro-muted">
                {new Date(w.weekStart + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </span>
              <span className="min-w-[3ch] tabular-nums text-neuro-silver">{w.minutes}</span>
              <span className="text-neuro-muted">/ {target} min</span>
              <div className="h-1.5 flex-1 max-w-[80px] overflow-hidden rounded-full bg-neuro-border">
                <div
                  className="h-full rounded-full bg-neuro-blue"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
