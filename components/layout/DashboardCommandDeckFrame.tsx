import Link from "next/link";
import type { ReactNode } from "react";

export const dashboardCommandDeckOuterClass =
  "tasks-command-deck dashboard-cinematic relative overflow-hidden rounded-2xl border border-[rgba(var(--mode-rgb),0.32)] bg-gradient-to-br from-[rgba(6,22,38,0.97)] via-[var(--bg-elevated)]/88 to-[rgba(var(--mode-rgb-deep),0.18)] shadow-[0_0_48px_rgba(var(--mode-rgb),0.16),0_12px_40px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)]";

type Props = {
  deckTitle: ReactNode;
  /** Use with `hideTitleBar`: keeps page title for a11y only. */
  hideTitleVisually?: boolean;
  fillViewport?: boolean;
  /** Extra classes on the gradient outer shell (e.g. `idle-breathing`, `flex min-h-0 flex-1`). */
  outerClassName?: string;
  /** Extra classes on the inner padded column (e.g. `gap-4`, `min-h-0 flex-1`). */
  innerClassName?: string;
  /** Optional tint layer above base flares, below content (same as Visual Lab deck). */
  accentFlareClassName?: string;
  children: ReactNode;
};

/**
 * Outer missions-style command card (gradient, radii, “Command” header, ← HQ).
 * Used by `/tasks`, simplified hubs, and full-mode dashboard routes for one chrome.
 */
export function DashboardCommandDeckFrame({
  deckTitle,
  hideTitleVisually = false,
  fillViewport = false,
  outerClassName = "",
  innerClassName = "",
  accentFlareClassName,
  children,
}: Props) {
  return (
    <div
      className={`${dashboardCommandDeckOuterClass} ${fillViewport ? "flex min-h-0 flex-1 flex-col" : ""} ${outerClassName}`.trim()}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_50%_0%,rgba(var(--mode-rgb),0.16),transparent_58%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,rgba(var(--mode-rgb),0.1),transparent_55%)]"
        aria-hidden
      />
      {accentFlareClassName ? (
        <div className={`pointer-events-none absolute inset-0 ${accentFlareClassName}`} aria-hidden />
      ) : null}
      <div
        className={`relative z-[1] flex flex-col gap-0 p-4 md:p-5 ${fillViewport ? "min-h-0 flex-1" : ""} ${innerClassName}`.trim()}
      >
        <header className="flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-[rgba(var(--mode-rgb),0.18)] pb-4">
          <div className="min-w-0 border-l-2 border-[rgba(var(--semantic-accent),0.55)] pl-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--semantic-accent)]/90">
              Command
            </p>
            <h2
              className={`mt-0.5 text-base font-bold tracking-tight text-[var(--text-primary)] [text-shadow:0_0_14px_rgba(var(--mode-rgb),0.18)] md:text-lg ${
                hideTitleVisually ? "sr-only" : ""
              }`}
            >
              {deckTitle}
            </h2>
          </div>
          <Link
            href="/dashboard"
            className="shrink-0 rounded-xl border border-[rgba(var(--mode-rgb),0.24)] bg-[rgba(6,18,30,0.55)] px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] shadow-[0_0_18px_rgba(var(--mode-rgb),0.1),inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:border-[rgba(var(--mode-rgb),0.4)] hover:bg-[rgba(8,26,42,0.65)] hover:text-[var(--text-primary)]"
          >
            ← HQ
          </Link>
        </header>
        {children}
      </div>
    </div>
  );
}
