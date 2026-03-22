"use client";

import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { useBudgetLock } from "@/components/budget/BudgetLockContext";

function formatLockUntil(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return format(new Date(`${iso}T12:00:00Z`), "d MMMM yyyy", { locale: nl });
  } catch {
    return iso;
  }
}

type Props = {
  /** Extra context for screen readers / copy */
  context?: "execute" | "analysis" | "optimization";
  /** Opens Execute tab + scrolls to lock card (hash alone fails on other tabs). */
  lockPanelHref: string;
  className?: string;
};

export function BudgetLockTabBanner({ context, lockPanelHref, className = "" }: Props) {
  const { lockActive, lockUntil } = useBudgetLock();
  if (!lockActive) return null;

  const until = formatLockUntil(lockUntil);
  const contextHint =
    context === "optimization"
      ? "Extra lock-interventies en challenges zijn uitgeschakeld."
      : context === "analysis"
        ? "Signalen blijven zichtbaar; snelle acties volgen je lock op Execute."
        : "Gebruik hieronder het lock-paneel voor noodpad of log een nooduitgave.";

  return (
    <div
      className={`mb-4 rounded-xl border border-amber-400/55 bg-gradient-to-r from-amber-500/20 to-amber-600/10 px-4 py-3 shadow-[0_0_24px_rgba(245,158,11,0.12)] backdrop-blur-sm ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-start gap-3">
        <span className="text-2xl leading-none" aria-hidden>
          🔒
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-amber-100">No-spend lock actief</p>
          {until && <p className="text-xs text-amber-50/95">Tot minstens {until}</p>}
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
