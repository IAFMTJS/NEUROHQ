"use client";

import type { ReactNode } from "react";
import { toast } from "sonner";

export const BUDGET_DECK_TOAST_DURATION_MS = 120_000;

const toastShell =
  "relative w-[min(100vw-2rem,420px)] max-h-[min(85vh,560px)] overflow-y-auto rounded-2xl border border-emerald-500/20 bg-[linear-gradient(165deg,rgba(6,24,20,0.97),rgba(15,23,42,0.98))] px-3 py-3 pr-10 text-left shadow-[0_0_28px_rgba(16,185,129,0.12),0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-md";

export function BudgetDeckToastChrome({
  toastId,
  title,
  hint,
  children,
  ariaLabel,
}: {
  toastId: string | number;
  title: string;
  hint?: string;
  children: ReactNode;
  ariaLabel: string;
}) {
  return (
    <div className={toastShell} role="dialog" aria-label={ariaLabel}>
      <button
        type="button"
        className="absolute right-2 top-2 z-10 rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
        aria-label="Sluiten"
        onClick={() => toast.dismiss(toastId)}
      >
        ✕
      </button>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-200">{title}</p>
      {hint ? <p className="mt-0.5 text-[11px] leading-snug text-[var(--text-muted)]">{hint}</p> : null}
      <div className="mt-3">{children}</div>
    </div>
  );
}
