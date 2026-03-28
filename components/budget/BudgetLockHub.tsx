"use client";

import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { BudgetLockControlCard } from "@/components/budget/BudgetLockControlCard";

export type BudgetLockHubProps = {
  historyMode: boolean;
  lockActive: boolean;
  lockUntil: string | null;
  lockUntilAt: string | null;
  currency: string;
};

const TOAST_MS = 120_000;
const LOCK_TOAST_ID = "budget-lock-flyout";

const toastShellWide =
  "relative w-[min(100vw-2rem,500px)] max-h-[min(88vh,680px)] overflow-y-auto overflow-x-hidden rounded-[var(--hq-card-radius,18px)] border border-[rgba(var(--mode-rgb),0.12)] bg-[linear-gradient(165deg,rgba(var(--mode-rgb-deep),0.42),rgba(15,23,42,0.96))] px-3 py-3 pr-10 text-left shadow-[0_12px_48px_rgba(0,0,0,0.45),0_0_28px_rgba(var(--mode-rgb),0.06)] backdrop-blur-md";

const hubShell =
  "relative scroll-mt-24 overflow-hidden rounded-[var(--hq-card-radius,18px)] border border-[var(--card-border)] bg-gradient-to-b from-[var(--bg-elevated)]/35 via-[var(--bg-primary)]/40 to-[var(--bg-primary)]/55 shadow-[0_8px_32px_rgba(0,0,0,0.22)]";

const tileClass =
  "relative flex min-h-[5.5rem] flex-col items-center justify-center gap-1 rounded-xl border border-[var(--card-border)] bg-[var(--bg-elevated)]/40 px-2 py-3 text-center transition-colors hover:border-[var(--card-border)] hover:bg-[var(--bg-elevated)]/65 focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--mode-rgb),0.45)] focus-visible:ring-offset-0 sm:min-h-[6rem]";

function ToastChrome({
  toastId,
  title,
  hint,
  children,
  ariaLabel,
}: {
  toastId: string | number;
  title: string;
  hint?: string;
  children: React.ReactNode;
  ariaLabel: string;
}) {
  return (
    <div className={toastShellWide} role="dialog" aria-label={ariaLabel}>
      <button
        type="button"
        className="absolute right-2 top-2 z-10 rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
        aria-label="Sluiten"
        onClick={() => toast.dismiss(toastId)}
      >
        ✕
      </button>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--mode-text-soft)]">{title}</p>
      {hint ? <p className="mt-0.5 text-[11px] leading-snug text-[var(--text-muted)]">{hint}</p> : null}
      <div className="mt-3 space-y-4">{children}</div>
    </div>
  );
}

function LockTile({
  emoji,
  label,
  hint,
  onClick,
  badge,
}: {
  emoji: string;
  label: string;
  hint?: string;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button type="button" onClick={onClick} className={tileClass}>
      {badge != null && badge > 0 ? (
        <span className="absolute right-1.5 top-1.5 min-w-[1.25rem] rounded-full bg-amber-500/35 px-1.5 py-0.5 text-[10px] font-bold text-amber-100">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
      <span className="text-2xl leading-none" aria-hidden>
        {emoji}
      </span>
      <span className="text-xs font-semibold text-[var(--text-primary)]">{label}</span>
      {hint ? <span className="line-clamp-2 text-[10px] text-[var(--text-muted)]">{hint}</span> : null}
    </button>
  );
}

export function BudgetLockHub({
  historyMode,
  lockActive,
  lockUntil,
  lockUntilAt,
  currency,
}: BudgetLockHubProps) {
  const openLockToast = useCallback(() => {
    if (historyMode) {
      toast.message("No-spend lock geldt alleen voor je actieve budgetperiode, niet voor een historische maand.");
      return;
    }
    toast.custom(
      (id) => (
        <ToastChrome
          toastId={id}
          title="No-spend lock"
          hint="Zet een lock, zie de countdown, of beëindig door de periode te laten verlopen."
          ariaLabel="Budget lock"
        >
          <BudgetLockControlCard
            lockActive={lockActive}
            lockUntil={lockUntil}
            lockUntilAt={lockUntilAt}
            currency={currency}
            embedded
          />
        </ToastChrome>
      ),
      { id: LOCK_TOAST_ID, duration: TOAST_MS }
    );
  }, [currency, historyMode, lockActive, lockUntil, lockUntilAt]);

  const openEmergencyToast = useCallback(() => {
    if (historyMode) {
      toast.message("Nooduitgave loggen is bedoeld voor je actieve periode.");
      return;
    }
    toast.custom(
      (id) => (
        <ToastChrome
          toastId={id}
          title="Nooduitgave"
          hint="Log bedrag en reden — helpt lock-beslissingen en signalen te trainen."
          ariaLabel="Nooduitgave loggen"
        >
          <BudgetLockControlCard
            lockActive={lockActive}
            lockUntil={lockUntil}
            lockUntilAt={lockUntilAt}
            currency={currency}
            initialEmergencyOpen
            embedded
          />
        </ToastChrome>
      ),
      { id: LOCK_TOAST_ID, duration: TOAST_MS }
    );
  }, [currency, historyMode, lockActive, lockUntil, lockUntilAt]);

  const openLockRef = useRef(openLockToast);
  const openEmergencyRef = useRef(openEmergencyToast);
  openLockRef.current = openLockToast;
  openEmergencyRef.current = openEmergencyToast;

  useEffect(() => {
    if (historyMode || typeof window === "undefined") return;
    const syncHash = () => {
      const h = window.location.hash;
      if (h === "#budget-lock-emergency") {
        openEmergencyRef.current();
        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#budget-lock-control`);
        return;
      }
      if (h === "#budget-lock-control") {
        openLockRef.current();
      }
    };
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [historyMode]);

  return (
    <section className={hubShell} aria-label="Lock hub" id="budget-lock-hub">
      <div className="px-4 py-4 md:px-5 md:py-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--mode-text-soft)]">Lock</p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          No-spend lock en noodpad: tik op een tegel voor het volledige paneel (zelfde werkwijze als Optimalisatie en Execute).
        </p>
        {!historyMode ? (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:max-w-lg sm:mx-auto">
            <LockTile
              emoji="🔒"
              label="No-spend lock"
              hint="Activeren & status"
              onClick={openLockToast}
              badge={lockActive ? 1 : undefined}
            />
            <LockTile emoji="⚡" label="Nooduitgave" hint="Bedrag + reden loggen" onClick={openEmergencyToast} />
          </div>
        ) : (
          <p className="mt-4 text-center text-xs text-[var(--text-muted)]">
            Historische maand: lock en nooduitgave zijn gekoppeld aan je huidige cyclus. Schakel terug naar de actieve maand om
            ze te gebruiken.
          </p>
        )}
      </div>
    </section>
  );
}
