"use client";

import React from "react";
import styles from "./hud.module.css";

export type CornerNodeProps = {
  corner: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  className?: string;
};

export function CornerNode({ corner, className = "" }: CornerNodeProps) {
  const positionStyle: React.CSSProperties = {
    top: corner.includes("top") ? 12 : undefined,
    bottom: corner.includes("bottom") ? 12 : undefined,
    left: corner.includes("left") ? 12 : undefined,
    right: corner.includes("right") ? 12 : undefined,
  };

  return (
    <span
      className={`${styles.cornerNode} ${className}`.trim()}
      style={positionStyle}
      aria-hidden="true"
    />
  );
}

