"use client";

import { useState } from "react";
import Link from "next/link";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { GlassButton } from "@/components/hud-test/GlassButton";
import { SciFiPanel } from "@/components/hud-test/SciFiPanel";

type Props = {
  /** Short summary for the card (e.g. "Tasks 80%, Learning ✓"). */
  summaryLabel?: string;
  /** Optional second line. */
  summaryStat?: string;
  children: React.ReactNode;
};

/** One card "Groei & inzichten" with summary + CTA that opens a bottom sheet with full content. */
export function DashboardGroeiCard({
  summaryLabel,
  summaryStat,
  children,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <SciFiPanel className="overflow-hidden" bodyClassName="p-0">
        <div className="border-b border-[var(--card-border)] px-4 py-3">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Groei & inzichten
          </h2>
          {(summaryLabel || summaryStat) && (
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {summaryLabel}
              {summaryStat && (
                <>
                  <br />
                  <span className="text-xs">{summaryStat}</span>
                </>
              )}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between gap-3 p-4">
          <Link
            href="/analytics"
            className="dashboard-hud-inline-link text-sm font-medium text-[var(--accent-focus)] hover:underline"
          >
            Analytics →
          </Link>
          <GlassButton
            onClick={() => setOpen(true)}
            className="dashboard-hud-trigger h-[42px] rounded-[14px] px-4 text-[11px] tracking-[0.08em]"
          >
            Bekijk groei & inzichten
          </GlassButton>
        </div>
      </SciFiPanel>
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Groei & inzichten"
        subtitle="Weekoverzicht, heatmap en rapport"
        sheetClassName="dashboard-hud-sheet"
      >
        <div className="space-y-4">{children}</div>
      </BottomSheet>
    </>
  );
}
