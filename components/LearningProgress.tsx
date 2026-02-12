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
    <div className="rounded-lg border border-neutral-700 bg-neuro-surface p-4">
      <h2 className="mb-2 text-sm font-medium text-neuro-silver">This week</h2>
      <p className="text-sm text-neutral-400">
        {weekStart} – {weekEnd}
      </p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-neuro-blue">{minutes}</span>
        <span className="text-neutral-400">/ {target} min</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral-700">
        <div className="h-full rounded-full bg-neuro-blue transition-all" style={{ width: `${pct}%` }} />
      </div>
      {streak > 0 && (
        <p className="mt-2 text-xs text-green-400">Streak: {streak} week{streak !== 1 ? "s" : ""}</p>
      )}
    </div>
  );
}
