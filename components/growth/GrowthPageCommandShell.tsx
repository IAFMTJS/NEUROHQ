"use client";

import type { ReactNode } from "react";
import { DashboardHubCommandShell } from "@/components/layout/DashboardHubCommandShell";

type Props = {
  children: ReactNode;
};

export function GrowthPageCommandShell({ children }: Props) {
  return (
    <DashboardHubCommandShell
      hubLabel="Growth"
      showBridgeLabel={false}
      compactHorizontal
      compactVertical
      fullBleedMobile
    >
      {children}
    </DashboardHubCommandShell>
  );
}
