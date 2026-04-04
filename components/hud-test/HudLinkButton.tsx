"use client";

import Link from "next/link";
import React from "react";

type HudLinkButtonProps = Omit<React.ComponentProps<typeof Link>, "className"> & {
  children: React.ReactNode;
  className?: string;
  tone?: "glass" | "outline" | "alert";
};

const toneBase: Record<NonNullable<HudLinkButtonProps["tone"]>, string> = {
  glass:
    "border border-[var(--border-soft)] bg-[var(--bg-elevated)] text-[var(--text-main)] shadow-sm transition-colors hover:bg-[var(--bg-card)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--mode-rgb),0.45)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]",
  outline:
    "border border-[rgba(var(--mode-rgb),0.35)] bg-transparent text-[var(--mode-text-soft)] transition-colors hover:bg-[var(--bg-elevated)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--mode-rgb),0.45)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]",
  alert:
    "border border-amber-500/40 bg-amber-950/25 text-amber-100 shadow-sm transition-colors hover:bg-amber-950/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]",
};

export function HudLinkButton({
  children,
  className = "",
  tone = "glass",
  ...rest
}: HudLinkButtonProps) {
  return (
    <Link className={`${toneBase[tone]} inline-flex items-center justify-center ${className}`.trim()} {...rest}>
      <span className="relative z-10">{children}</span>
    </Link>
  );
}
