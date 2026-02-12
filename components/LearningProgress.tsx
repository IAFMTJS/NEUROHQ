import { getWeekBounds } from "@/lib/utils/learning";

type Props = {
  minutes: number;
  target: number;
  streak: number;
  weekStart: string;
  weekEnd: string;
};

export function LearningProgress({ minutes, target, streak, weekStart, weekEnd }: Props) {
  const pct = target ? Math.min(100, Math.round((minutes / target) * 100)) : 0;
  return (
    <div className="card-modern-accent overflow-hidden p-0">
      <div className="border-b border-neuro-border/80 px-4 py-3">
        <h2 className="text-base font-semibold text-neuro-silver">This week</h2>
        <p className="mt-0.5 text-sm text-neuro-muted">
          {weekStart} – {weekEnd}
        </p>
      </div>
      <div className="p-5">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tabular-nums text-neuro-blue">{minutes}</span>
          <span className="text-neuro-muted">/ {target} min</span>
        </div>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-neuro-border">
          <div className="h-full rounded-full bg-neuro-blue transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
        {streak > 0 && (
          <p className="mt-2 text-sm text-green-400/90">Streak: {streak} week{streak !== 1 ? "s" : ""}</p>
        )}
      </div>
    </div>
  );
}
