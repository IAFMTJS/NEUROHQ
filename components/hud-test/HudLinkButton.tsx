"use client";

import Link from "next/link";
import React from "react";
import styles from "./hud.module.css";

type HudLinkButtonProps = Omit<React.ComponentProps<typeof Link>, "className"> & {
  children: React.ReactNode;
  className?: string;
  tone?: "glass" | "outline" | "alert";
};

export function HudLinkButton({
  children,
  className = "",
  tone = "glass",
  ...rest
}: HudLinkButtonProps) {
  const toneClass =
    tone === "outline"
      ? styles.outlineButton
      : tone === "alert"
        ? styles.alertButton
        : styles.glassButton;

  return (
    <Link className={`${toneClass} inline-flex items-center justify-center ${className}`.trim()} {...rest}>
      <span className="relative z-10">{children}</span>
    </Link>
  );
}

