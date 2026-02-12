type Props = { breakdown: { topic: string; minutes: number }[] };

export function LearningTopicBreakdown({ breakdown }: Props) {
  if (breakdown.length === 0) return null;
  const total = breakdown.reduce((s, b) => s + b.minutes, 0);
  return (
    <div className="rounded-xl border border-neuro-border bg-neuro-dark/40 px-4 py-3">
      <p className="mb-2 text-xs font-medium text-neuro-muted">This week by topic</p>
      <ul className="space-y-1.5">
        {breakdown.map((b) => (
          <li key={b.topic} className="flex justify-between text-sm">
            <span className="text-neuro-silver">{b.topic}</span>
            <span className="tabular-nums text-neuro-muted">
              {b.minutes} min ({total ? Math.round((b.minutes / total) * 100) : 0}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
