"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  locked: boolean;
};

/** Blokkeert het dashboard tot de verplichte weekreview op /strategy is ingevuld. */
export function StrategyWeeklyReviewLockOverlay({ locked }: Props) {
  const pathname = usePathname();
  const p = pathname.replace(/\/$/, "") || "/";
  const onStrategy = p === "/strategy" || p.startsWith("/strategy/");

  if (!locked || onStrategy) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex flex-col items-center justify-center gap-4 bg-[rgba(3,8,18,0.92)] p-6 backdrop-blur-md"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="strategy-lock-title"
      aria-describedby="strategy-lock-desc"
    >
      <div className="max-w-md rounded-2xl border border-amber-500/40 bg-[rgba(8,18,32,0.95)] p-6 text-center shadow-[0_0_40px_rgba(0,0,0,0.5)]">
        <h2 id="strategy-lock-title" className="text-lg font-bold text-amber-100">
          Weekreview verplicht
        </h2>
        <p id="strategy-lock-desc" className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
          Vul je wekelijkse Strategy-review in (tab Review) om verder te gaan. Dit geldt voor de hele app tot de review is
          opgeslagen.
        </p>
        <Link
          href="/strategy?tab=review"
          className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border border-[var(--semantic-accent)]/50 bg-[var(--semantic-accent)]/20 px-4 text-sm font-semibold text-[var(--semantic-accent)] transition hover:bg-[var(--semantic-accent)]/30"
        >
          Naar Strategy → Review
        </Link>
        <Link
          href="/settings"
          className="mt-3 block text-center text-xs text-[var(--text-muted)] underline-offset-2 hover:text-[var(--text-primary)] hover:underline"
        >
          Instellingen
        </Link>
      </div>
    </div>
  );
}
