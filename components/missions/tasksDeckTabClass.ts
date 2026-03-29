/**
 * Segmented tab rail for /tasks command deck — shared by TasksTabsShell and visual-lab parity.
 */
export function tasksDeckTabClass(active: boolean): string {
  return [
    "inline-flex min-h-[40px] flex-1 items-center justify-center rounded-lg px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.1em] transition sm:min-h-0 sm:flex-none sm:px-4 sm:text-xs",
    active
      ? "border border-[rgba(var(--mode-rgb),0.38)] bg-[rgba(var(--mode-rgb),0.14)] text-[var(--accent-focus)] shadow-[0_0_20px_rgba(var(--mode-rgb),0.18),inset_0_1px_0_rgba(255,255,255,0.06)]"
      : "border border-transparent text-[var(--text-muted)] hover:border-[rgba(var(--mode-rgb),0.22)] hover:bg-[rgba(6,18,30,0.55)] hover:text-[var(--text-primary)]",
  ].join(" ");
}
