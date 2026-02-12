type Props = { minutes: number; target: number; weekEnd: string };

/** Gentle nudge when it's late in the week and they haven't hit target (e.g. Thursday+ and 0 min). */
export function LearningNudge({ minutes, target, weekEnd }: Props) {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 Sun ... 6 Sat
  const weekDay = dayOfWeek === 0 ? 7 : dayOfWeek; // Mon=1 .. Sun=7
  const daysLeft = 8 - weekDay;
  if (minutes >= target || daysLeft > 4) return null;
  if (weekDay < 4) return null; // Only nudge from Thursday onward
  const needed = target - minutes;
  return (
    <p className="mt-2 text-xs text-amber-400/90">
      {daysLeft > 0
        ? `${needed} min left to hit your weekly target. A few days left.`
        : "Week almost over. Log any remaining time to count toward your target."}
    </p>
  );
}
