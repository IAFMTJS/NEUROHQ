"use client";

import Link from "next/link";
import { HudLinkButton } from "@/components/hud-test/HudLinkButton";

/** Small CTA to open budget page at add-entry for quick logging. */
export function DashboardQuickBudgetLog() {
  return (
    <HudLinkButton
      href="/budget#add-entry"
      tone="outline"
      className="dashboard-hud-chip shrink-0 whitespace-nowrap rounded-[10px] px-2 text-[9px] font-semibold normal-case tracking-[0.03em]"
      style={{ height: "26px", minHeight: "26px", paddingTop: 0, paddingBottom: 0, paddingLeft: "6px", paddingRight: "6px" }}
      aria-label="Snel uitgave loggen"
    >
      Log uitgave
    </HudLinkButton>
  );
}
