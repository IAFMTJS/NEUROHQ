type Props = { totalMinutes: number };

function milestone(total: number): string | null {
  if (total >= 600) return `${Math.floor(total / 60)} hours total`;
  if (total >= 300) return "5+ hours total";
  if (total >= 60) return "1+ hour total";
  return null;
}

export function LearningMilestone({ totalMinutes }: Props) {
  const text = milestone(totalMinutes);
  if (!text) return null;
  return (
    <p className="mt-1 text-xs text-[var(--text-muted)]">
      {text} totaal gelogd (niet je streak — streak is per week target).
    </p>
  );
}
