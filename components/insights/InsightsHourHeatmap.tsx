"use client";

type Props = {
  byHour: { hour: number; count: number }[];
};

export function InsightsHourHeatmap({ byHour }: Props) {
  const max = Math.max(1, ...byHour.map((h) => h.count));
  return (
    <section className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-surface)]/50 px-4 py-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Beste tijdstip (heatmap per uur)</h3>
      <p className="mt-0.5 text-xs text-[var(--text-muted)]">Laatste 30 dagen: wanneer voltooi je meestal missies?</p>
      <div className="mt-3 flex flex-wrap gap-1">
        {byHour.map(({ hour, count }) => (
          <div
            key={hour}
            className="flex flex-col items-center rounded p-0.5"
            title={`${hour}:00 – ${count} voltooid`}
          >
            <div
              className="h-5 w-5 rounded-sm transition-opacity"
              style={{
                backgroundColor: count === 0 ? "var(--bg-overlay)" : "var(--accent-focus)",
                opacity: count === 0 ? 0.2 : 0.3 + (count / max) * 0.7,
              }}
            />
            <span className="mt-0.5 text-[9px] text-[var(--text-muted)]">{hour}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-[var(--text-muted)]">0–23 uur (UTC). Donkerder = meer voltooid.</p>
    </section>
  );
}
