"use client";

import type { XPBySourceItem } from "@/app/actions/dcic/insight-engine";

const SOURCE_LABELS: Record<string, string> = {
  task_complete: "Missies voltooid",
  brain_status: "Brain status",
  learning_session: "Learning session",
  weekly_learning_target: "Weekly learning",
  streak_day: "Streak dag",
};

function sourceLabel(source_type: string): string {
  return SOURCE_LABELS[source_type] ?? source_type.replace(/_/g, " ");
}

type Props = {
  items: XPBySourceItem[];
  totalXP: number;
  periodLabel: string;
};

export function InsightsXPSourcesCard({ items, totalXP, periodLabel }: Props) {
  if (items.length === 0) {
    return (
      <section className="card-simple hq-card-enter rounded-[var(--hq-card-radius-sharp)] p-5" aria-label="XP per bron">
        <h2 className="hq-h2 mb-2">XP per bron</h2>
        <p className="text-sm text-[var(--text-muted)]">{periodLabel}: nog geen events.</p>
      </section>
    );
  }

  return (
    <section className="card-simple hq-card-enter rounded-[var(--hq-card-radius-sharp)] p-5" aria-label="XP per bron">
      <h2 className="hq-h2 mb-1">XP per bron</h2>
      <p className="mb-4 text-sm text-[var(--text-muted)]">{periodLabel}. Waar komt je XP vandaan?</p>
      <p className="mb-3 text-lg font-semibold text-[var(--text-primary)]">Totaal: {totalXP} XP</p>
      <div className="space-y-3">
        {items.map((item) => {
          const pct = totalXP > 0 ? (item.total / totalXP) * 100 : 0;
          return (
            <div key={item.source_type} className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/50 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-[var(--text-primary)]">{sourceLabel(item.source_type)}</span>
                <span className="text-sm font-bold text-[var(--accent-focus)]">
                  +{item.total} XP ({item.count}x)
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-[var(--accent-focus)]" style={{ width: `${Math.min(100, pct)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
