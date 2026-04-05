"use client";

import { useBudgetLock } from "@/components/budget/BudgetLockContext";
import { BudgetLockCountdown } from "@/components/budget/BudgetLockCountdown";
import { formatLockEndDateTime } from "@/lib/budget-lock-display";

type Props = {
  /** Extra context for screen readers / copy */
  context?: "overview" | "execute" | "analysis";
  /** Opens Sparen & boeken-tab + lock-anker (hash alleen faalt op andere tabs). */
  lockPanelHref: string;
  className?: string;
};

export function BudgetLockTabBanner({ context, lockPanelHref, className = "" }: Props) {
  const { lockActive, lockUntilAt } = useBudgetLock();
  if (!lockActive) return null;

  const until = formatLockEndDateTime(lockUntilAt);
  const contextHint =
    context === "overview"
      ? "Status blijft zichtbaar, maar acties lopen via de Lock-tab."
      : context === "analysis"
        ? "Grafieken en routines blijven leesbaar; boeken en sparen doe je via Sparen & boeken of Lock."
        : "Gebruik hieronder het lock-paneel voor noodpad of log een nooduitgave.";

  return (
    <div
      className={`mb-4 rounded-xl border border-[rgba(var(--mode-rgb),0.28)] bg-gradient-to-br from-[rgba(var(--mode-rgb),0.12)] via-[rgba(var(--mode-rgb-deep),0.2)] to-[rgba(6,18,30,0.45)] px-4 py-3 shadow-[0_0_24px_rgba(var(--mode-rgb),0.1)] backdrop-blur-sm ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-start gap-3">
        <span className="text-2xl leading-none" aria-hidden>
          🔒
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-[var(--text-primary)]">
            No-spend lock actief
          </p>
          {until && <p className="text-xs text-[var(--text-secondary)]">Tot {until}</p>}
          {lockUntilAt && (
            <p className="text-xs text-[var(--semantic-accent)]" aria-hidden>
              <BudgetLockCountdown unlockAtIso={lockUntilAt} />
            </p>
          )}
          <p className="text-xs text-[var(--text-secondary)]">{contextHint}</p>
          <a
            href={lockPanelHref}
            className="inline-flex text-xs font-semibold text-[var(--semantic-accent)] underline-offset-2 hover:underline"
          >
            Naar lock- en nooduitgave-paneel
          </a>
        </div>
      </div>
    </div>
  );
}
