"use client";

import React from "react";
import styles from "./hud.module.css";

export type SciFiPanelProps = {
  className?: string;
  bodyClassName?: string;
  variant?: "command" | "glass" | "tactical" | "minimal";
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
  children,
}: SciFiPanelProps) {
  const frameClass = `${styles.panelFrame} ${className}`.trim();
  const bodyClass = `${styles.panelBody} ${bodyClassName}`.trim();

  return (
    <div className={styles.panelShell}>
      <span className={styles.panelWorldGlow} />
      <div className={frameClass} data-variant={variant}>
        <span className={styles.panelNoise} />
        <div className={bodyClass}>{children}</div>
      </div>
    </div>
  );
}

