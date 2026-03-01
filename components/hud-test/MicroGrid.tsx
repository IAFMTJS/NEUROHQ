"use client";

import React from "react";
import styles from "./hud.module.css";

export type MicroGridProps = {
  density?: 24 | 32;
  className?: string;
};

/**
 * Structural 1px micro-grid overlay.
 */
export function MicroGrid({ density = 24, className = "" }: MicroGridProps) {
  return (
    <div
      className={`${styles.microGrid} ${className}`.trim()}
      style={{ backgroundSize: `${density}px ${density}px` }}
      aria-hidden="true"
    />
  );
}

