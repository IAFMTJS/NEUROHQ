"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { OutlineButton } from "@/components/hud-test/OutlineButton";

type Props = {
  /** Number of action items to show in badge (0 = hide badge). */
  count: number;
  children: React.ReactNode;
};

/** Header button "Acties" with badge; opens bottom sheet with banner/notification content. */
export function DashboardActionsTrigger({ count, children }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <OutlineButton
        onClick={() => setOpen(true)}
        className="dashboard-hud-trigger relative h-[30px] rounded-[10px] px-2.5 text-[9px] tracking-[0.06em]"
        aria-label={count > 0 ? `${count} acties` : "Acties"}
      >
        <span className="text-[10px]" aria-hidden>🔔</span>
        <span>Acties</span>
        {count > 0 && (
          <span
            className="dashboard-hud-trigger-badge absolute -right-1 -top-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-[var(--accent-focus)] px-1 text-[9px] font-medium text-black"
            aria-hidden
          >
            {count > 99 ? "99+" : count}
          </span>
        )}
      </OutlineButton>
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Acties"
        subtitle={count === 0 ? "Geen actieve meldingen" : undefined}
        sheetClassName="dashboard-hud-sheet dashboard-hud-sheet-compact"
      >
        <div className="space-y-1.5">{children}</div>
      </BottomSheet>
    </>
  );
}
