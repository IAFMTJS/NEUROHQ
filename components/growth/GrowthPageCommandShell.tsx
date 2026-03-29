"use client";

import type { ReactNode } from "react";
import { DashboardHubCommandShell } from "@/components/layout/DashboardHubCommandShell";

type Props = {
  children: ReactNode;
  /** When true, skip starfield / mist (matches dashboard light UI). */
  lightUi?: boolean;
};

export function GrowthPageCommandShell({ children, lightUi = false }: Props) {
  return (
    <DashboardHubCommandShell hubLabel="Growth" lightUi={lightUi} compactHorizontal>
      {children}
    </DashboardHubCommandShell>
  );
}
