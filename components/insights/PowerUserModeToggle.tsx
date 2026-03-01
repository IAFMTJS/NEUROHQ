"use client";

import { useState } from "react";
import type { InsightGraphDay } from "@/app/actions/dcic/insight-engine";

type Props = {
  graphData: InsightGraphDay[];
  rawSummary?: { xpLast7: number; xpPrevious7: number; completionRate: number | null };
};

export function PowerUserModeToggle({ graphData, rawSummary }: Props) {
  const [on, setOn] = useState(false);

  const exportCSV = () => {
    const header = "date,name,xp,energy,focus\n";
    const rows = graphData
      .map((d) => `${d.date},${d.name},${d.xp},${d.energy ?? ""},${d.focus ?? ""}`)
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `neurohq-insights-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-surface)]/50 px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Power User Mode</h3>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text-primary)]">
          <input
            type="checkbox"
            checked={on}
            onChange={(e) => setOn(e.target.checked)}
            className="rounded border-[var(--card-border)]"
          />
          Ruwe data & export
        </label>
      </div>
      {on && (
        <div className="mt-3 space-y-2 text-sm">
          {rawSummary != null && (
            <pre className="overflow-x-auto rounded bg-[var(--bg-overlay)] p-2 text-xs text-[var(--text-secondary)]">
              XP last 7: {rawSummary.xpLast7} | XP prev 7: {rawSummary.xpPrevious7} | Completion rate: {(rawSummary.completionRate ?? 0) * 100}%
            </pre>
          )}
          <button
            type="button"
            onClick={exportCSV}
            className="rounded-lg border border-[var(--accent-focus)]/40 bg-[var(--accent-focus)]/10 px-3 py-1.5 text-xs font-medium text-[var(--accent-focus)] hover:bg-[var(--accent-focus)]/20"
          >
            Export CSV (graph data)
          </button>
        </div>
      )}
    </section>
  );
}
