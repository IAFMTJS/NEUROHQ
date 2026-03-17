"use client";

import type { ReactNode } from "react";
import { useHQStore } from "@/lib/hq-store";
import Link from "next/link";

type Props = {
  title: string;
  subtitle?: string | ReactNode;
  backHref?: string;
};

export function HQPageHeader({ title, subtitle, backHref }: Props) {
  const mode = useHQStore((s) => s.gameState?.mode.current ?? "focus");
  const showBackLink = backHref != null && backHref !== "";
  return (
    <header>
      {showBackLink && (
        <Link
          href={backHref!}
          className="inline-block text-sm font-medium text-soft hover:text-[var(--text-main)]"
        >
          ← HQ
        </Link>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="page-title-glow">{title}</h1>
        <span className="inline-flex items-center gap-1 rounded-full border border-[var(--card-border)] bg-[var(--bg-secondary)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--accent-focus)]">
          {mode === "war"
            ? "War mode"
            : mode === "recovery"
            ? "Recovery mode"
            : "Focus mode"}
        </span>
      </div>
      {subtitle != null && (
        <p className="text-soft">
          {typeof subtitle === "string" ? subtitle : subtitle}
        </p>
      )}
    </header>
  );
}
