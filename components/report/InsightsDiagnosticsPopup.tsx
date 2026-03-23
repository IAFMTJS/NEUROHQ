"use client";

import { useState } from "react";
import type { InsightGraphDay } from "@/app/actions/dcic/insight-engine";
import { HQModal } from "@/components/hq/HQModal";
import { InsightsTrackedEventsCard } from "@/components/insights/InsightsTrackedEventsCard";
import { PowerUserModeToggle } from "@/components/insights/PowerUserModeToggle";

type Props = {
  graphData: InsightGraphDay[];
  rawSummary: {
    xpLast7: number;
    xpPrevious7: number;
    completionRate: number | null;
  };
  analyticsEventsSummary: { event_name: string; count: number }[];
};

export function InsightsDiagnosticsPopup({ graphData, rawSummary, analyticsEventsSummary }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <section className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-surface)]/50 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Diagnostische details</h3>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              Open tracked events, ruwe samenvatting en CSV-export in een popup.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-lg border border-[var(--semantic-ring)]/50 bg-[var(--semantic-accent)]/15 px-3 py-2 text-xs font-semibold text-[var(--semantic-accent)] transition hover:bg-[var(--semantic-accent)]/25"
          >
            Open details
          </button>
        </div>
      </section>

      <HQModal open={open} onClose={() => setOpen(false)} width={860}>
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Insights diagnostics</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Diepteweergave voor events, ruwe metrics en export.
            </p>
          </div>
          <InsightsTrackedEventsCard items={analyticsEventsSummary} />
          <PowerUserModeToggle graphData={graphData} rawSummary={rawSummary} />
        </div>
      </HQModal>
    </>
  );
}
