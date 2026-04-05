"use client";

import type { ReactNode } from "react";

type Props = {
  lockActive: boolean;
  lockUntil: string | null;
  lockUntilAt: string | null;
  /** Opens Sparen & boeken-tab + lock-anker (hash faalt als Status actief is). */
  lockPanelHref: string;
  /** Opens Lock tab and triggers emergency-expense modal. */
  emergencyPanelHref?: string;
  children: ReactNode;
};

/** Dims overview when no-spend lock is on; emergency path points to Budget lock card. */
export function BudgetOverviewLockGate({
  lockActive,
  lockUntil,
  lockUntilAt,
  lockPanelHref,
  emergencyPanelHref,
  children,
}: Props) {
  if (!lockActive) return <>{children}</>;
  const emergencyHref = emergencyPanelHref ?? lockPanelHref;
  const untilLabel =
    lockUntilAt != null
      ? new Date(lockUntilAt).toLocaleString("nl-NL", { dateStyle: "medium", timeStyle: "short" })
      : lockUntil ?? "";
  return (
    <div className="space-y-2">
      <div
        className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[rgba(var(--mode-rgb),0.28)] bg-[rgba(6,18,30,0.55)] px-3 py-2 text-sm text-[var(--text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_24px_rgba(var(--mode-rgb),0.12)] backdrop-blur-md"
        role="status"
        aria-live="polite"
      >
        <span className="font-semibold">
          No-spend lock{untilLabel ? ` · tot ${untilLabel}` : ""}
        </span>
        <a
          href={emergencyHref}
          className="shrink-0 rounded-md bg-[var(--accent-focus)]/25 px-2.5 py-1 text-xs font-semibold text-[var(--accent-focus)] hover:bg-[var(--accent-focus)]/35"
        >
          Nooduitgave / lock
        </a>
      </div>
      <div className="relative">
        <div className="pointer-events-none select-none opacity-[0.38] [&_a]:pointer-events-none [&_button]:pointer-events-none">
          {children}
        </div>
        <div
          className="pointer-events-auto absolute inset-0 z-[5] flex min-h-[180px] items-start justify-center rounded-xl border-2 border-dashed border-[rgba(var(--mode-rgb),0.4)] bg-[rgba(8,26,42,0.88)] pt-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_0_40px_rgba(var(--mode-rgb),0.15)] backdrop-blur-md sm:pt-10"
          role="presentation"
        >
          <div className="max-w-sm space-y-2 px-4">
            <p className="text-2xl" aria-hidden>
              🔒
            </p>
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--semantic-accent)]">
              Overzicht geblokkeerd
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              Log snel uitgaven en budget-acties hier zijn gepauzeerd. Gebruik het paneel hieronder voor een noodpad.
            </p>
            <a
              href={emergencyHref}
              className="inline-block rounded-lg bg-[var(--accent-focus)]/20 px-3 py-2 text-xs font-semibold text-[var(--accent-focus)] hover:bg-[var(--accent-focus)]/30"
            >
              Naar nooduitgave
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
