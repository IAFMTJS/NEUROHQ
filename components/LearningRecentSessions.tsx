type Session = { id: string; date: string; minutes: number; topic: string | null };

type Props = { sessions: Session[]; weekEnd: string };

export function LearningRecentSessions({ sessions, weekEnd }: Props) {
  const sorted = [...sessions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <section className="card-modern overflow-hidden p-0">
      <div className="border-b border-neuro-border px-4 py-3">
        <h2 className="text-base font-semibold text-neuro-silver">Sessions this week</h2>
        <p className="mt-0.5 text-xs text-neuro-muted">Recent learning sessions (Mon – {weekEnd}).</p>
      </div>
      <div className="p-4">
        {sorted.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neuro-border bg-neuro-dark/40 px-4 py-6 text-center">
            <p className="text-sm text-neuro-muted">No sessions logged this week.</p>
            <p className="mt-1 text-xs text-neuro-muted">Log one above to get started.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {sorted.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between rounded-xl border border-neuro-border bg-neuro-dark/50 px-3 py-2.5"
              >
                <span className="text-sm font-medium text-neuro-silver">
                  {s.minutes} min{s.minutes !== 1 ? "s" : ""}
                  {s.topic ? ` · ${s.topic}` : ""}
                </span>
                <span className="text-xs text-neuro-muted">
                  {new Date(s.date).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
