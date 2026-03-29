"use client";

import { useMemo, type CSSProperties, type ReactNode } from "react";
import { SciFiPanel } from "@/components/hud-test/SciFiPanel";
import { CornerNode } from "@/components/hud-test/CornerNode";
import hudStyles from "@/components/hud-test/hud.module.css";
import { useHQStore } from "@/lib/hq-store";

type Props = {
  children: ReactNode;
  /** Shown in the bridge chrome (e.g. Strategy, Growth). */
  hubLabel: string;
  /** When false, omit the top bridge title strip (hub chrome only). */
  showBridgeLabel?: boolean;
  /** When true, skip starfield / mist (matches dashboard light UI). */
  lightUi?: boolean;
  /** Narrower horizontal bridge padding + full-bleed outer strip (e.g. Growth). */
  compactHorizontal?: boolean;
};

export function DashboardHubCommandShell({
  children,
  hubLabel,
  showBridgeLabel = true,
  lightUi = false,
  compactHorizontal = false,
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

  const skipCinematic = lightUi === true;

  return (
    <main
      className={`relative min-h-screen overflow-x-hidden ${!skipCinematic ? hudStyles.cinematicBackdrop : ""}`}
      style={dcicModeVars}
      data-mode={dcicMode}
    >
      {!skipCinematic && (
        <>
          <div className={hudStyles.spaceMist} aria-hidden />
          <div className={hudStyles.starLayerFar} aria-hidden />
          <div className={hudStyles.starLayerNear} aria-hidden />
          <div className={hudStyles.backgroundAtmosphere} aria-hidden />
          <div className={hudStyles.colorBlend} aria-hidden />
          <div className={hudStyles.spaceNoise} aria-hidden />
        </>
      )}
      <div
        className="container page page-wide dashboard-page dashboard-cinematic relative z-10 pb-10"
        {...(compactHorizontal ? { "data-hub-compact-x": "true" } : {})}
      >
        <div className={`space-y-3 pt-2 md:pt-3 ${compactHorizontal ? "px-0" : "px-1"}`}>
          <SciFiPanel
            className={`dashboard-bridge-frame idle-breathing ${hudStyles.focusPrimary}`}
            bodyClassName={`dashboard-bridge-body flex flex-col gap-4 [-webkit-overflow-scrolling:touch] ${skipCinematic ? "light-ui-defer-paint" : ""}`}
            variant="command"
          >
            <CornerNode corner="top-left" />
            <CornerNode corner="top-right" />
            {showBridgeLabel ? (
              <span className="dashboard-bridge-label shrink-0" aria-hidden>
                {hubLabel}
              </span>
            ) : null}
            {children}
          </SciFiPanel>
        </div>
      </div>
    </main>
  );
}
