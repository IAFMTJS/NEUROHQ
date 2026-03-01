"use client";

import React from "react";
import styles from "./hud.module.css";

export type GlassButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  variant?: "default" | "alert";
  shape?: "glass" | "capsule";
  loading?: boolean;
};

/**
 * Secondary glass-styled button.
 */
export function GlassButton({
  children,
  className = "",
  type = "button",
  variant = "default",
  shape = "glass",
  loading = false,
  disabled = false,
  ...rest
}: GlassButtonProps) {
  const variantClass = variant === "alert" ? styles.glassButtonAlert : "";
  const shapeClass = shape === "capsule" ? styles.glassButtonCapsule : "";
  const loadingClass = loading ? styles.glassButtonLoading : "";
  const lockedClass = disabled ? styles.glassButtonLocked : "";

  return (
    <button
      type={type}
      className={`${styles.glassButton} ${variantClass} ${shapeClass} ${loadingClass} ${lockedClass} ${className}`.trim()}
      disabled={disabled}
      {...rest}
    >
      <span className="relative z-10">{children}</span>
    </button>
  );
}

