"use client";

import type { ReactNode } from "react";
import { useHQStore } from "@/lib/hq-store";
import Link from "next/link";

type Props = {
  title: string;
  subtitle?: string | ReactNode;
  backHref?: string;
  /** Geen grote paginatitel: alleen terug + modus-badge (bijv. profiel/engine). */
  compact?: boolean;
};

export function HQPageHeader({ title, subtitle, backHref, compact = false }: Props) {
  const mode = useHQStore((s) => s.gameState?.mode?.current ?? "focus");
  const showBackLink = backHref != null && backHref !== "";
  const modeLabel =
    mode === "war" ? "War mode" : mode === "recovery" ? "Recovery mode" : "Focus mode";

  if (compact) {
    return (
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          {showBackLink ? (
            <Link
              href={backHref!}
              className="shrink-0 text-sm font-semibold text-[var(--text-secondary)] transition hover:text-[var(--text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--mode-rgb),0.45)] focus-visible:ring-offset-0 rounded-md"
            >
              ← HQ
            </Link>
          ) : null}
          <h1 className="sr-only">{title}</h1>
        </div>
        <span className="inline-flex items-center rounded-full border border-[rgba(var(--mode-rgb),0.22)] bg-[rgba(var(--mode-rgb-deep),0.2)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--semantic-accent)]">
          {modeLabel}
        </span>
      </header>
    );
  }

  return (
    <header>
      {showBackLink && (
        <Link
          href={backHref!}
          className="inline-block text-sm font-medium text-soft hover:text-[var(--text-main)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--mode-rgb),0.45)] focus-visible:ring-offset-0 rounded-md"
        >
          ← HQ
        </Link>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="page-title-glow">{title}</h1>
        <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(var(--mode-rgb),0.2)] bg-[rgba(var(--mode-rgb-deep),0.15)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--accent-focus)]">
          {modeLabel}
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
