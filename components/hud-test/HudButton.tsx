"use client";

import React from "react";
import styles from "./hud.module.css";

export type HudButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  state?: "default" | "loading" | "disabled" | "locked" | "alert";
};

/**
 * Primary energy capsule button.
 */
export function HudButton({
  children,
  className = "",
  type = "button",
  state = "default",
  ...rest
}: HudButtonProps) {
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
      className={`${styles.hudButton} ${stateClass} ${className}`.trim()}
      disabled={state === "disabled" || rest.disabled}
      {...rest}
    >
      <span className="relative z-10">{children}</span>
    </button>
  );
}

