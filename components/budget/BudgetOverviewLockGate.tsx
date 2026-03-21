"use client";

import type { ReactNode } from "react";

type Props = {
  lockActive: boolean;
  lockUntil: string | null;
  children: ReactNode;
};

/** Dims overview when no-spend lock is on; emergency path points to Budget lock card. */
export function BudgetOverviewLockGate({ lockActive, lockUntil, children }: Props) {
  if (!lockActive) return <>{children}</>;
  return (
    <div className="relative">
      <div className="pointer-events-none select-none opacity-[0.38] [&_a]:pointer-events-none [&_button]:pointer-events-none">
        {children}
      </div>
      <div
        className="pointer-events-auto absolute inset-0 z-[5] flex min-h-[240px] items-center justify-center rounded-xl border-2 border-dashed border-amber-500/55 bg-[var(--bg-primary)]/88 p-6 text-center shadow-[0_0_40px_rgba(245,158,11,0.15)] backdrop-blur-sm"
        role="status"
        aria-live="polite"
      >
        <div className="max-w-sm space-y-2">
          <p className="text-3xl" aria-hidden>
            🔒
          </p>
          <p className="text-base font-bold uppercase tracking-[0.12em] text-amber-200">No-spend lock</p>
          {lockUntil ? (
            <p className="text-xs text-[var(--text-muted)]">Actief tot {lockUntil}</p>
          ) : null}
          <p className="text-sm text-[var(--text-secondary)]">
            Snel loggen en budget-acties in dit overzicht zijn geblokkeerd. Voor een nooduitgave gebruik je het budget-lock-paneel
            onderaan.
          </p>
          <a
            href="#budget-lock-control"
            className="inline-block rounded-lg bg-[var(--accent-focus)]/20 px-3 py-2 text-xs font-semibold text-[var(--accent-focus)] hover:bg-[var(--accent-focus)]/30"
          >
            Naar nooduitgave / lock
          </a>
        </div>
      </div>
    </div>
  );
}
