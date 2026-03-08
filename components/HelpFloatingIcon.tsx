"use client";

import Link from "next/link";

/**
 * Global help icon: fixed position, opens /help. Does not modify app state.
 * Rendered inside dashboard layout so it appears on every app page.
 */
export function HelpFloatingIcon() {
  return (
    <Link
      href="/help"
      aria-label="Open Help Center"
      className="help-floating-icon fixed bottom-[calc(var(--footer-height,60px)+env(safe-area-inset-bottom)+52px)] right-[max(1rem,env(safe-area-inset-right))] z-[100] flex h-10 w-10 items-center justify-center rounded-full border border-[var(--card-border)] bg-[var(--bg-primary)]/90 text-[var(--text-muted)] shadow-lg backdrop-blur-sm hover:border-[var(--accent-focus)] hover:text-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <path d="M12 17h.01" />
      </svg>
    </Link>
  );
}
