"use client";

import React from "react";
import styles from "./hud.module.css";
import { useDCICGameState } from "@/lib/dcic/game-state-client";

export type SciFiPanelProps = {
  className?: string;
  bodyClassName?: string;
  variant?: "command" | "glass" | "tactical" | "minimal";
  /** When false, hides the horizontal top glow line inside the panel body (calmer HUD). Default true. */
  topAccent?: boolean;
  /** Nearly square corners — hub pages with flat glass (dashboard HQ keeps rounded frames). */
  flatFrame?: boolean;
  children: React.ReactNode;
};

/**
 * Reusable cinematic HUD panel shell:
 * - Outer frame
 * - Energy rim
 * - Inner body with top strip
 */
export function SciFiPanel({
  className = "",
  bodyClassName = "",
  variant = "command",
  topAccent = true,
  flatFrame = false,
  children,
}: SciFiPanelProps) {
  const { gameState } = useDCICGameState();
  const dcicMode = gameState?.mode?.current ?? "focus";
  const modeVars: React.CSSProperties =
    dcicMode === "war"
      ? ({ "--mode-rgb": "220, 38, 38", "--mode-rgb-deep": "127, 29, 29" } as React.CSSProperties)
      : dcicMode === "recovery"
        ? ({ "--mode-rgb": "34, 197, 94", "--mode-rgb-deep": "22, 101, 52" } as React.CSSProperties)
        : dcicMode === "overdrive"
          ? ({ "--mode-rgb": "168, 85, 247", "--mode-rgb-deep": "91, 33, 182" } as React.CSSProperties)
          : ({ "--mode-rgb": "0, 212, 255", "--mode-rgb-deep": "0, 136, 255" } as React.CSSProperties);

  const frameClass = `${styles.panelFrame} ${flatFrame ? styles.panelFrameFlat : ""} ${className}`.trim();
  const bodyClass = `${styles.panelBody} ${flatFrame ? styles.panelBodyFlat : ""} ${!topAccent ? styles.panelBodyNoTopAccent : ""} ${bodyClassName}`.trim();

  return (
    <div className={styles.panelShell} style={modeVars}>
      <span className={styles.panelWorldGlow} />
      <div className={frameClass} data-variant={variant}>
        <span className={styles.panelNoise} />
        <div className={bodyClass}>{children}</div>
      </div>
    </div>
  );
}

