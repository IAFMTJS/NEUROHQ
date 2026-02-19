import { LearningTargetSelect } from "@/components/LearningTargetSelect";
import { LearningStreakExplain } from "@/components/LearningStreakExplain";
import { LearningMilestone } from "@/components/LearningMilestone";
import { LearningNudge } from "@/components/LearningNudge";

type Props = {
  minutes: number;
  target: number;
  streak: number;
  weekStart: string;
  weekEnd: string;
  totalMinutes?: number;
};

export function LearningProgress({ minutes, target, streak, weekStart, weekEnd, totalMinutes = 0 }: Props) {
  const pct = target ? Math.min(100, Math.round((minutes / target) * 100)) : 0;
  return (
    <div className="card-simple-accent overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)]/80 px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">This week</h2>
        <p className="mt-0.5 text-sm text-[var(--text-muted)]">
          {weekStart} – {weekEnd}
        </p>
      </div>
      <div className="p-5">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tabular-nums text-[var(--accent-focus)] text-glow-accent">{minutes}</span>
          <span className="text-[var(--text-muted)]">/ {target} min</span>
        </div>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-[var(--card-border)]">
          <div className="progress-fill-glow h-full rounded-full bg-[var(--accent-focus)] transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
        <LearningTargetSelect currentTarget={target} />
        {streak > 0 && (
          <p className="mt-2 text-sm text-green-400/90">Streak: {streak} week{streak !== 1 ? "s" : ""}</p>
        )}
        <LearningStreakExplain target={target} />
        <LearningMilestone totalMinutes={totalMinutes} />
        <LearningNudge minutes={minutes} target={target} weekEnd={weekEnd} />
      </div>
    </div>
  );
}
