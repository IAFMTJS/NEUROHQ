"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useHQStore } from "@/lib/hq-store";

type Props = {
  /** One line; keep short (scan-first hub). */
  statusLine: string;
  actions?: ReactNode;
};

export function StrategyHubHeader({ statusLine, actions }: Props) {
  const mode = useHQStore((s) => s.gameState?.mode?.current ?? "focus");
  const modeLabel =
    mode === "war"
      ? "War mode"
      : mode === "recovery"
        ? "Recovery mode"
        : mode === "overdrive"
          ? "Overdrive mode"
          : "Focus mode";

  return (
    <section className="space-y-3" aria-label="Strategy command">
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/dashboard"
          className="shrink-0 text-xs font-semibold text-[var(--text-secondary)] transition hover:text-[var(--text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--mode-rgb),0.45)] focus-visible:ring-offset-0 rounded-md"
        >
          ← HQ
        </Link>
        <span className="inline-flex shrink-0 items-center rounded-full border border-[rgba(var(--mode-rgb),0.18)] bg-[var(--bg-elevated)]/35 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[var(--accent-focus)]">
          {modeLabel}
        </span>
      </div>

      <h1 className="text-lg font-bold uppercase tracking-[0.16em] text-[var(--text-primary)] [text-shadow:0_0_14px_rgba(var(--mode-rgb),0.35),0_0_28px_rgba(var(--mode-rgb),0.12)] sm:text-xl sm:tracking-[0.18em]">
        Strategy
      </h1>

      <p className="min-w-0 truncate text-xs leading-snug text-[var(--text-muted)]" title={statusLine}>
        {statusLine}
      </p>

      {actions != null ? (
        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">{actions}</div>
      ) : null}
    </section>
  );
}
