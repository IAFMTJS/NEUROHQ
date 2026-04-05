/**
 * Shared shell + tiles for Budget command deck (parity with RemainingBudgetHero).
 */

export const budgetDeckShellClass =
  "relative overflow-hidden rounded-xl border border-[rgba(var(--mode-rgb),0.2)] bg-gradient-to-br from-[rgba(8,26,42,0.92)] via-[var(--bg-elevated)]/88 to-[rgba(var(--mode-rgb-deep),0.12)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]";

export const budgetDeckHeaderDividerClass = "border-b border-[rgba(var(--mode-rgb),0.1)]";

export const budgetDeckFooterDividerClass = "border-t border-[rgba(var(--mode-rgb),0.1)]";

/** Section kicker — matches Budget command / hero labels */
export const budgetDeckSectionKickerClass =
  "text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--mode-text-soft)]";

/** Full-width row CTA (e.g. Cyclus & loon, Budget & discipline) */
export const budgetDeckRowButtonClass =
  "flex w-full items-center justify-between gap-3 rounded-xl border border-[rgba(var(--mode-rgb),0.14)] bg-[rgba(6,18,30,0.35)] px-3 py-2.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-colors hover:border-[rgba(var(--mode-rgb),0.28)] hover:bg-[rgba(6,18,30,0.5)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--mode-rgb),0.45)] focus-visible:ring-offset-0";

/** Primary savings row — keeps emerald lane for pay-yourself-first */
export const budgetDeckPrimarySavingsRowClass =
  "relative mt-3 flex w-full items-center justify-between gap-3 rounded-xl border border-emerald-400/35 bg-[linear-gradient(165deg,rgba(6,40,28,0.55),rgba(15,23,42,0.78))] px-3 py-3 text-left shadow-[0_0_24px_rgba(16,185,129,0.12),inset_0_1px_0_rgba(255,255,255,0.04)] transition-colors hover:border-emerald-400/55 hover:bg-[linear-gradient(165deg,rgba(8,50,32,0.62),rgba(15,23,42,0.85))] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/45 focus-visible:ring-offset-0";

/** Grid tile — default / disabled */
export function budgetDeckTileClass(disabled?: boolean): string {
  const base =
    "relative flex min-h-[5.5rem] flex-col items-center justify-center gap-1 rounded-xl border px-2 py-3 text-center transition-colors sm:min-h-[6rem]";
  if (disabled) {
    return `${base} cursor-not-allowed border-[rgba(var(--mode-rgb),0.08)] bg-[rgba(6,18,30,0.2)] opacity-50`;
  }
  return `${base} border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(6,18,30,0.45)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-[rgba(var(--mode-rgb),0.3)] hover:bg-[rgba(6,18,30,0.62)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--mode-rgb),0.45)] focus-visible:ring-offset-0`;
}

/** Inline notice (unplanned, history hint) */
export const budgetDeckNoticeClass =
  "rounded-xl border border-[rgba(var(--mode-rgb),0.16)] bg-[rgba(6,18,30,0.4)] px-4 py-2.5 text-sm text-[var(--text-secondary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]";
