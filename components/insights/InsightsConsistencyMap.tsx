"use client";

type Props = {
  days: { date: string; score: number }[];
};

function dayLabel(iso: string): string {
  return iso.slice(8);
}

export function InsightsConsistencyMap({ days }: Props) {
  const byDate = new Map(days.map((d) => [d.date, d.score]));
  const sorted = [...byDate.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  return (
    <section className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-surface)]/50 px-4 py-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Consistency Map</h3>
      <p className="mt-0.5 text-xs text-[var(--text-muted)]">Laatste 30 dagen: groen = goed, geel = oké, rood = laag.</p>
      <div className="mt-3 flex flex-wrap gap-1">
        {sorted.slice(-30).map(([date, score]) => {
          const color =
            score >= 60 ? "bg-green-500/60" : score >= 30 ? "bg-amber-500/60" : "bg-red-500/50";
          return (
            <div
              key={date}
              className={`h-6 w-6 rounded ${color} shrink-0`}
              title={`${date} – score ${score}`}
            >
              <span className="sr-only">{date} {score}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-[var(--text-muted)]">Elke cel = 1 dag. Groen ≥60, geel ≥30, rood &lt;30.</p>
    </section>
  );
}
