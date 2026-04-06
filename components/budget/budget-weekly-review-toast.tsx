"use client";

import type { ReactNode } from "react";
import { toast } from "sonner";
import { BudgetWeeklyReviewCard } from "@/components/budget/BudgetWeeklyReviewCard";

const TOAST_MS = 120_000;

const toastShellWide =
  "relative w-[min(100vw-2rem,500px)] max-h-[min(88vh,680px)] overflow-y-auto overflow-x-hidden rounded-[var(--hq-card-radius,18px)] border border-[rgba(var(--mode-rgb),0.12)] bg-[linear-gradient(165deg,rgba(var(--mode-rgb-deep),0.42),rgba(15,23,42,0.96))] px-3 py-3 pr-10 text-left shadow-[0_12px_48px_rgba(0,0,0,0.45),0_0_28px_rgba(var(--mode-rgb),0.06)] backdrop-blur-md";

function ToastChrome({
  toastId,
  children,
}: {
  toastId: string | number;
  children: ReactNode;
}) {
  return (
    <div className={toastShellWide} role="dialog" aria-label="Weekreview">
      <button
        type="button"
        className="absolute right-2 top-2 z-10 rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
        aria-label="Sluiten"
        onClick={() => toast.dismiss(toastId)}
      >
        ✕
      </button>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--mode-text-soft)]">Weekreview</p>
      <p className="mt-0.5 text-[11px] leading-snug text-[var(--text-muted)]">
        Eén rustig moment: wat werkte, wat gleed, wat pas je aan.
      </p>
      <div className="mt-3 space-y-4">{children}</div>
    </div>
  );
}

/** Zelfde paneel als tegel «Weekreview» onder Budget → Inzicht. */
export function openBudgetWeeklyReviewToast(completedThisWeek: boolean): void {
  toast.custom(
    (id) => (
      <ToastChrome toastId={id}>
        <BudgetWeeklyReviewCard completedThisWeek={completedThisWeek} />
      </ToastChrome>
    ),
    { duration: TOAST_MS }
  );
}
