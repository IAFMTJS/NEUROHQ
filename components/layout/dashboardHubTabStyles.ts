/** Shared cinematic hub tab chrome (Growth / Strategy hubs). */

export function dashboardHubTabStripClass(): string {
  return "flex flex-wrap items-center justify-center gap-1.5 border-b border-[rgba(var(--mode-rgb),0.1)] bg-[rgba(6,18,30,0.28)] px-2 py-1.5 backdrop-blur-sm sm:gap-2";
}

export function dashboardHubTabButtonClass(selected: boolean): string {
  return selected
    ? "min-h-[30px] rounded-full border border-[rgba(var(--mode-rgb),0.58)] bg-gradient-to-b from-[rgba(11,57,90,0.96)] to-[rgba(7,38,58,0.98)] px-2.5 py-1 text-center text-[10px] font-bold uppercase tracking-[0.07em] leading-tight text-[#e7f8ff] shadow-[0_0_16px_rgba(var(--mode-rgb),0.32),0_0_32px_rgba(var(--mode-rgb),0.1),inset_0_1px_0_rgba(255,255,255,0.12)] [text-shadow:0_0_10px_rgba(var(--mode-rgb),0.45)] ring-1 ring-[rgba(var(--mode-rgb),0.3)] transition-all duration-200 sm:px-3 sm:py-1.5"
    : "min-h-[30px] rounded-full border border-[rgba(var(--mode-rgb),0.32)] bg-gradient-to-b from-[rgba(10,36,58,0.88)] to-[rgba(6,22,38,0.92)] px-2 py-1 text-center text-[10px] font-semibold uppercase tracking-[0.06em] leading-tight text-[#c7efff]/90 opacity-[0.92] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all duration-200 hover:border-[rgba(var(--mode-rgb),0.5)] hover:text-[#eaf8ff] hover:opacity-100 hover:shadow-[0_0_12px_rgba(var(--mode-rgb),0.18)] sm:px-2.5 sm:py-1.5";
}
