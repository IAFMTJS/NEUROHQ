"use client";

type Item = { key: string; label: string; done: boolean };

type Props = {
  completed: number;
  total: number;
  percent: number;
  items: Item[];
};

export function StrategyProgressCard({ completed, total, percent, items }: Props) {
  return (
    <section className="card-simple-accent overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)]/80 px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Strategy completion</h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
          Q at a glance — fill what matters. Linked goal is optional.
        </p>
      </div>
      <div className="p-4">
        <div className="flex items-baseline gap-2">
          <span
            className="text-3xl font-bold tabular-nums text-[var(--accent-focus)]"
            style={{ textShadow: "var(--glow-cyan-real)" }}
          >
            {percent}%
          </span>
          <span className="text-[var(--text-muted)]">
            {completed} / {total} set
          </span>
        </div>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-[var(--card-border)]">
          <div
            className="h-full rounded-full bg-[var(--accent-focus)] transition-all duration-300"
            style={{
              width: `${percent}%`,
              boxShadow: "var(--glow-stack-cyan)",
            }}
          />
        </div>
        <ul className="mt-4 space-y-2">
          {items.map((item) => (
            <li
              key={item.key}
              className="flex items-center gap-2 text-sm text-[var(--text-primary)]"
            >
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-full"
                style={{
                  backgroundColor: item.done ? "var(--accent-focus)" : "var(--card-border)",
                  boxShadow: item.done ? "var(--glow-stack-cyan)" : "none",
                }}
                aria-hidden
              />
              <span className={item.done ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}>
                {item.label}
              </span>
              {item.done && (
                <span className="ml-auto text-xs text-[var(--accent-focus)]" aria-hidden>
                  ✓
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
