"use client";

type Props = { items: { event_name: string; count: number }[] };

const EVENT_LABELS: Record<string, string> = {
  mission_completed: "Missie voltooid",
  mission_started: "Missie gestart",
  CTA_clicked: "CTA geklikt",
  skill_unlocked: "Skill ontgrendeld",
};

function eventLabel(name: string): string {
  return EVENT_LABELS[name] ?? name.replace(/_/g, " ");
}

export function InsightsTrackedEventsCard({ items }: Props) {
  if (items.length === 0) {
    return (
      <section className="card-simple hq-card-enter rounded-[var(--hq-card-radius-sharp)] p-5" aria-label="Tracked events">
        <h2 className="hq-h2 mb-2">Tracked events (7d)</h2>
        <p className="text-sm text-[var(--text-muted)]">Nog geen analytics-events in de laatste 7 dagen.</p>
      </section>
    );
  }

  return (
    <section className="card-simple hq-card-enter rounded-[var(--hq-card-radius-sharp)] p-5" aria-label="Tracked events">
      <h2 className="hq-h2 mb-1">Tracked events (7d)</h2>
      <p className="mb-4 text-sm text-[var(--text-muted)]">Alle client-events die we loggen (mission_completed, CTA_clicked, etc.).</p>
      <ul className="space-y-2">
        {items.map(({ event_name, count }) => (
          <li key={event_name} className="flex items-center justify-between rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/50 px-3 py-2">
            <span className="text-sm font-medium text-[var(--text-primary)]">{eventLabel(event_name)}</span>
            <span className="text-sm tabular-nums text-[var(--accent-focus)]">{count}x</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
