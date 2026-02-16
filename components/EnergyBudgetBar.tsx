"use client";

import type { PoolBudget } from "@/app/actions/energy";

type Props = {
  remaining: number;
  capacity: number;
  suggestedTaskCount: number;
  taskUsed: number;
  completedTaskCount: number;
  taskPlanned: number;
  calendarCost: number;
  energy: PoolBudget;
  focus: PoolBudget;
  load: PoolBudget;
  insight: string;
  segments: { label: string; value: number; color: string }[];
};

export function EnergyBudgetBar({
  remaining,
  capacity,
  suggestedTaskCount,
  taskUsed,
  completedTaskCount,
  taskPlanned,
  calendarCost,
  energy,
  focus,
  load,
  insight,
  segments,
}: Props) {
  const totalConsumed = taskUsed + taskPlanned + Math.round(calendarCost);
  const barTotal = Math.max(capacity, totalConsumed, 1);

  function poolBar(pool: PoolBudget, label: string, accent: string) {
    const usedPct = pool.capacity > 0 ? (pool.used / pool.capacity) * 100 : 0;
    const plannedPct = pool.capacity > 0 ? (pool.planned / pool.capacity) * 100 : 0;
    const remainPct = pool.capacity > 0 ? (pool.remaining / pool.capacity) * 100 : 0;
    return (
      <div key={label} className="flex items-center gap-2">
        <span className="w-14 shrink-0 text-[10px] font-medium text-[var(--text-muted)]">{label}</span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--card-border)]">
          <div className="flex h-full">
            {pool.used > 0 && (
              <div className={accent} style={{ width: `${usedPct}%` }} title={`Used: ${pool.used}`} />
            )}
            {pool.planned > 0 && (
              <div
                className="bg-amber-500/70"
                style={{ width: `${plannedPct}%` }}
                title={`Planned: ${pool.planned}`}
              />
            )}
            {pool.remaining > 0 && (
              <div
                className="bg-[var(--bg-surface)]/50"
                style={{ width: `${remainPct}%` }}
                title={`Remaining: ${pool.remaining}`}
              />
            )}
          </div>
        </div>
        <span className="w-8 shrink-0 text-right text-[10px] tabular-nums text-[var(--text-muted)]">
          {pool.remaining}
        </span>
      </div>
    );
  }

  return (
    <div className="card-modern-accent overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)]/80 px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Energy budget</h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
          ~{suggestedTaskCount} task{suggestedTaskCount !== 1 ? "s" : ""} suggested · {insight}
        </p>
      </div>
      <div className="p-5 space-y-4">
        <div className="flex items-baseline gap-2">
          <span
            className={`text-3xl font-bold tabular-nums ${
              remaining < 20 ? "text-amber-400" : "text-[var(--accent-focus)]"
            }`}
          >
            {remaining}
          </span>
          <span className="text-[var(--text-muted)]">/ {capacity} headroom</span>
        </div>

        {/* Stacked breakdown */}
        {(segments.length > 0 || remaining > 0) && (
          <div className="space-y-1">
            <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
              Breakdown
            </p>
            <div className="flex h-3 w-full overflow-hidden rounded-lg bg-[var(--card-border)]">
              {segments.map((s) => {
                const pct = barTotal > 0 ? (s.value / barTotal) * 100 : 0;
                return (
                  <div
                    key={s.label}
                    className={`${s.color} transition-all`}
                    style={{ width: `${pct}%` }}
                    title={`${s.label}: ${s.value}`}
                  />
                );
              })}
              {remaining > 0 && (
                <div
                  className="bg-[var(--bg-surface)]/60"
                  style={{
                    width: `${barTotal > 0 ? (remaining / barTotal) * 100 : 0}%`,
                  }}
                />
              )}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-[var(--text-muted)]">
              {completedTaskCount > 0 && (
                <span>
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 align-middle" />{" "}
                  {completedTaskCount} done ({taskUsed})
                </span>
              )}
              {taskPlanned > 0 && (
                <span>
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500 align-middle" />{" "}
                  Planned ({taskPlanned})
                </span>
              )}
              {calendarCost > 0 && (
                <span>
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500 align-middle" />{" "}
                  Calendar ({Math.round(calendarCost)})
                </span>
              )}
            </div>
          </div>
        )}

        {/* Full stats table */}
        <div className="overflow-x-auto rounded-lg border border-[var(--card-border)]/50 bg-[var(--bg-surface)]/20 px-3 py-2">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Full stats (capacity · used · planned · remaining)
          </p>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--card-border)]/50 text-[var(--text-muted)]">
                <th className="py-1.5 pr-3 font-medium">Pool</th>
                <th className="py-1.5 pr-2 text-right tabular-nums">Capacity</th>
                <th className="py-1.5 pr-2 text-right tabular-nums">Used</th>
                <th className="py-1.5 pr-2 text-right tabular-nums">Planned</th>
                <th className="py-1.5 text-right tabular-nums">Remaining</th>
              </tr>
            </thead>
            <tbody className="text-[var(--text-primary)]">
              <tr className="border-b border-[var(--card-border)]/30">
                <td className="py-1.5 pr-3">Energy</td>
                <td className="py-1.5 pr-2 text-right tabular-nums">{energy.capacity}</td>
                <td className="py-1.5 pr-2 text-right tabular-nums">{energy.used}</td>
                <td className="py-1.5 pr-2 text-right tabular-nums">{energy.planned}</td>
                <td className="py-1.5 text-right tabular-nums font-medium">{energy.remaining}</td>
              </tr>
              <tr className="border-b border-[var(--card-border)]/30">
                <td className="py-1.5 pr-3">Focus</td>
                <td className="py-1.5 pr-2 text-right tabular-nums">{focus.capacity}</td>
                <td className="py-1.5 pr-2 text-right tabular-nums">{focus.used}</td>
                <td className="py-1.5 pr-2 text-right tabular-nums">{focus.planned}</td>
                <td className="py-1.5 text-right tabular-nums font-medium">{focus.remaining}</td>
              </tr>
              <tr>
                <td className="py-1.5 pr-3" title="Headroom before overload (tasks + calendar consume this)">
                  Load
                </td>
                <td className="py-1.5 pr-2 text-right tabular-nums">{load.capacity}</td>
                <td className="py-1.5 pr-2 text-right tabular-nums">{load.used}</td>
                <td className="py-1.5 pr-2 text-right tabular-nums">{load.planned}</td>
                <td className="py-1.5 text-right tabular-nums font-medium">{load.remaining}</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-2 text-[10px] text-[var(--text-muted)]">
            Load = headroom before overload. Social/calendar events use more of it. Headroom shown above = min of the three remaining.
          </p>
        </div>

        {/* Per-pool bars */}
        <div className="space-y-2 rounded-lg border border-[var(--card-border)]/50 bg-[var(--bg-surface)]/20 px-3 py-2">
          <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
            3 pools (Energy · Focus · Load)
          </p>
          {poolBar(energy, "Energy", "bg-[var(--accent-energy)]")}
          {poolBar(focus, "Focus", "bg-[var(--accent-focus)]")}
          {poolBar(load, "Load", "bg-[var(--accent-warning)]")}
        </div>

        {remaining < 20 && (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            Low headroom. Consider lighter tasks or rescheduling.
          </p>
        )}
      </div>
    </div>
  );
}
