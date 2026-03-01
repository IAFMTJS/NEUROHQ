"use client";

import React from "react";
import styles from "./hud.module.css";

export type StatusDotProps = {
  size?: 4 | 6;
  color?: "cyan" | "orange";
  className?: string;
};

export function StatusDot({ size = 4, color = "cyan", className = "" }: StatusDotProps) {
  const background = color === "orange" ? "var(--alert-orange)" : "var(--primary-cyan)";
  const shadow =
    color === "orange"
      ? "0 0 8px rgba(255,154,60,0.85)"
      : "0 0 8px rgba(0,229,255,0.85)";

  return (
    <span
      className={`${styles.statusDot} ${className}`.trim()}
      style={{ width: size, height: size, background, boxShadow: shadow }}
      aria-hidden="true"
    />
  );
}

