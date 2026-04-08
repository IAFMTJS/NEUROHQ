import { getLoadingMascotSrc } from "@/lib/mascots";

/**
 * Shown during RSC resolution for `/budget` so the route paints before the full data batch streams.
 * Mirrors the deck + tab chrome pattern used on the live page (simplified and full layouts).
 */
export default function BudgetLoading() {
  return (
    <div className="hq-page-surface-clear relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="relative z-10 flex min-h-[calc(100svh-7rem)] w-full max-w-none flex-1 flex-col pb-6 sm:min-h-[calc(100svh-6.5rem)] dashboard-cinematic">
        <div className="hq-frosted-main-shell flex min-h-0 flex-1 flex-col">
          <div className="container page page-wide relative z-10 flex min-h-0 flex-1 flex-col gap-4 bg-transparent pt-4 sm:pt-5">
            <div className="flex justify-end">
              <div className="h-16 w-16 rounded-full border border-[rgba(var(--mode-rgb),0.24)] bg-[rgba(4,12,22,0.45)] p-2 shadow-[0_0_26px_rgba(var(--mode-rgb),0.14)]">
                <img src={getLoadingMascotSrc()} alt="" aria-hidden className="h-full w-full object-contain" />
              </div>
            </div>
            <div className="mt-1 flex gap-1 rounded-xl border border-[rgba(var(--mode-rgb),0.2)] bg-[rgba(4,12,22,0.5)] p-1">
              <div className="h-9 flex-1 animate-pulse rounded-lg bg-[rgba(var(--mode-rgb),0.1)]" />
              <div className="h-9 flex-1 animate-pulse rounded-lg bg-[rgba(var(--mode-rgb),0.14)]" />
              <div className="h-9 flex-1 animate-pulse rounded-lg bg-[rgba(var(--mode-rgb),0.1)]" />
              <div className="h-9 flex-1 animate-pulse rounded-lg bg-[rgba(var(--mode-rgb),0.1)]" />
            </div>
            <div className="h-36 w-full animate-pulse rounded-2xl border border-[rgba(var(--mode-rgb),0.24)] bg-[rgba(6,18,30,0.45)] shadow-[0_0_40px_rgba(var(--mode-rgb),0.08)]" />
            <div className="min-h-[min(22rem,42vh)] w-full flex-1 animate-pulse rounded-2xl border border-[rgba(var(--mode-rgb),0.2)] bg-[rgba(6,18,30,0.35)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
