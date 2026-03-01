"use client";

/**
 * Commander version bar: zichtbaar op elke dashboardpagina.
 * Maakt duidelijk dat dit de Commander-ervaring is.
 */
export function CommanderBar() {
  return (
    <div
      className="commander-bar flex items-center justify-center gap-2 border-b border-[var(--card-border)]/60 bg-[var(--bg-surface)]/80 px-3 py-2 backdrop-blur-sm"
      role="banner"
      aria-label="NEUROHQ Commander"
    >
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">
        NEUROHQ
      </span>
      <span className="rounded-full bg-[var(--accent-focus)]/20 px-2.5 py-0.5 text-xs font-semibold text-[var(--accent-focus)] ring-1 ring-[var(--accent-focus)]/40">
        Commander
      </span>
      <span className="text-[10px] font-medium text-[var(--text-muted)]/80">v2</span>
    </div>
  );
}
