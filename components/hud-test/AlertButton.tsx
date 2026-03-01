"use client";

import React from "react";
import styles from "./hud.module.css";

export type AlertButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  state?: "default" | "loading" | "disabled" | "locked";
};

/**
 * Alert action button with orange accent glow on hover.
 */
export function AlertButton({
  children,
  className = "",
  type = "button",
  state = "default",
  ...rest
}: AlertButtonProps) {
  const stateClass =
    state === "loading"
      ? styles.stateLoading
      : state === "disabled"
        ? styles.stateDisabled
        : state === "locked"
          ? styles.stateLocked
          : "";
  return (
    <button
      type={type}
      className={`${styles.alertButton} ${stateClass} ${className}`.trim()}
      disabled={state === "disabled" || rest.disabled}
      {...rest}
    >
      {children}
    </button>
  );
}

