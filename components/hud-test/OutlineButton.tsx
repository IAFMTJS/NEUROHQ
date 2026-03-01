"use client";

import React from "react";
import styles from "./hud.module.css";

export type OutlineButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  state?: "default" | "disabled" | "locked";
};

/**
 * Tertiary low-emphasis outline button.
 */
export function OutlineButton({
  children,
  className = "",
  type = "button",
  state = "default",
  ...rest
}: OutlineButtonProps) {
  const stateClass =
    state === "disabled"
      ? styles.stateDisabled
      : state === "locked"
        ? styles.stateLocked
        : "";
  return (
    <button
      type={type}
      className={`${styles.outlineButton} ${stateClass} ${className}`.trim()}
      disabled={state === "disabled" || rest.disabled}
      {...rest}
    >
      {children}
    </button>
  );
}

