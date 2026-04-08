/**
 * Shown during RSC resolution for `/tasks` so the route paints before the full tree streams.
 * Aligns with the live route: no extra frosted shell (deck frame provides chrome).
 */
export default function TasksLoading() {
  return (
    <main className="tasks-page-root relative isolate overflow-x-hidden min-h-screen min-h-[100dvh]">
      <div className="tasks-page-column container page page-wide relative z-10 bg-transparent pt-4 sm:pt-5 dashboard-cinematic">
        <div className="space-y-4">
          <div className="mt-4 flex gap-1 rounded-xl border border-[rgba(var(--mode-rgb),0.2)] bg-[rgba(4,12,22,0.5)] p-1">
            <div className="h-9 flex-1 animate-pulse rounded-lg bg-[rgba(var(--mode-rgb),0.1)]" />
            <div className="h-9 flex-1 animate-pulse rounded-lg bg-[rgba(var(--mode-rgb),0.14)]" />
            <div className="h-9 flex-1 animate-pulse rounded-lg bg-[rgba(var(--mode-rgb),0.1)]" />
          </div>
          <div className="h-[min(28rem,55vh)] w-full animate-pulse rounded-2xl border border-[rgba(var(--mode-rgb),0.24)] bg-[rgba(6,18,30,0.45)] shadow-[0_0_40px_rgba(var(--mode-rgb),0.08)]" />
        </div>
      </div>
    </main>
  );
}
