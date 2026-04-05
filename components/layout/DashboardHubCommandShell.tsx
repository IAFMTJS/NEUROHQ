"use client";

import { useMemo, type CSSProperties, type ReactNode } from "react";
import { DashboardCommandDeckFrame } from "@/components/layout/DashboardCommandDeckFrame";
import { useHQStore } from "@/lib/hq-store";

type Props = {
  children: ReactNode;
  /** Shown as the command deck title (e.g. Strategy, Growth). */
  hubLabel: string;
  /** Kept for API compatibility; the deck always shows `hubLabel` in the header. */
  showBridgeLabel?: boolean;
  /** Narrower horizontal bridge padding + full-bleed outer strip (e.g. Growth). */
  compactHorizontal?: boolean;
  /** Less top padding so primary chrome (e.g. tab bar) sits higher — Growth /learning. */
  compactVertical?: boolean;
};

/**
 * Hub layout: container rim + {@link DashboardCommandDeckFrame} (missions parity).
 * Scroll/ambient frost lives on `#main-content`; avoid nested `main` and duplicate `flatGlassPageRoot`.
 * Column uses `dashboard-cinematic` only (same base as `/tasks`), not `dashboard-page`, so the fixed vignette matches Missions.
 */
export function DashboardHubCommandShell({
  children,
  hubLabel,
  showBridgeLabel: _showBridgeLabel = true,
  compactHorizontal = false,
  compactVertical = false,
}: Props) {
  const dcicMode = useHQStore((s) => s.gameState?.mode?.current ?? "focus");
  const dcicModeVars = useMemo<CSSProperties>(() => {
    if (dcicMode === "war") {
      return { "--mode-rgb": "220, 38, 38", "--mode-rgb-deep": "127, 29, 29" } as CSSProperties;
    }
    if (dcicMode === "recovery") {
      return { "--mode-rgb": "34, 197, 94", "--mode-rgb-deep": "22, 101, 52" } as CSSProperties;
    }
    if (dcicMode === "overdrive") {
      return { "--mode-rgb": "168, 85, 247", "--mode-rgb-deep": "91, 33, 182" } as CSSProperties;
    }
    return { "--mode-rgb": "0, 212, 255", "--mode-rgb-deep": "0, 136, 255" } as CSSProperties;
  }, [dcicMode]);

  return (
    <div
      className="relative w-full overflow-x-hidden"
      style={dcicModeVars}
      data-mode={dcicMode}
    >
      <div
        className="container page page-wide dashboard-cinematic relative z-10 pb-10"
        {...(compactHorizontal ? { "data-hub-compact-x": "true" } : {})}
        {...(compactVertical ? { "data-hub-compact-y": "true" } : {})}
      >
        <div
          className={`${compactVertical ? "space-y-2 pt-0" : "space-y-3 pt-2 md:pt-3"} ${compactHorizontal ? "px-0" : "px-1"}`}
        >
          <div className="hq-frosted-main-shell">
            <DashboardCommandDeckFrame
              deckTitle={hubLabel}
              outerClassName="idle-breathing"
              innerClassName={compactVertical ? "gap-3 md:gap-4" : "gap-4"}
            >
              <div className="flex flex-col gap-4 [-webkit-overflow-scrolling:touch]">{children}</div>
            </DashboardCommandDeckFrame>
          </div>
        </div>
      </div>
    </div>
  );
}
