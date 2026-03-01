"use client";

const DAY_NAMES = ["Zo", "Ma", "Di", "Wo", "Do", "Vr", "Za"];

type Props = {
  xpLast7: number;
  xpLast30: number;
  missionsLast7: number;
  missionsLast30: number;
  velocity7: number;
  completionRatePct: number | null;
  currentStreak: number;
  longestStreak: number;
  bestDayOfWeek: number | null;
};

export function InsightsKeyNumbersStrip({
  xpLast7,
  xpLast30,
  missionsLast7,
  missionsLast30,
  velocity7,
  completionRatePct,
  currentStreak,
  longestStreak,
  bestDayOfWeek,
}: Props) {
  const items = [
    { label: "XP (7d)", value: xpLast7, sub: "XP" },
    { label: "XP (30d)", value: xpLast30, sub: "XP" },
    { label: "Missies (7d)", value: missionsLast7, sub: "" },
    { label: "Missies (30d)", value: missionsLast30, sub: "" },
    { label: "Velocity", value: velocity7.toFixed(1), sub: "XP/dag" },
    { label: "Completion", value: completionRatePct != null ? `${completionRatePct}%` : "—", sub: "" },
    { label: "Streak", value: `${currentStreak} / ${longestStreak}`, sub: "" },
    { label: "Beste dag", value: bestDayOfWeek != null ? DAY_NAMES[bestDayOfWeek] : "—", sub: "" },
  ];

  return (
    <section
      className="rounded-xl border-2 border-[var(--accent-focus)]/30 bg-[var(--dc-bg-elevated)] px-4 py-4"
      aria-label="Kerncijfers"
    >
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[var(--accent-focus)]">
        Past & present · Alles wat we tracken
      </h2>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4 lg:grid-cols-4">
        {items.map(({ label, value, sub }) => (
          <div key={label} className="rounded-lg bg-white/5 px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
            <p className="mt-0.5 text-lg font-bold tabular-nums text-[var(--text-primary)]">
              {value}
              {sub && <span className="ml-1 text-xs font-normal text-[var(--text-muted)]">{sub}</span>}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
