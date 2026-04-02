/**
 * Shown while the Routine tab server component streams (Supabase + suggestions).
 * Matches command-deck card rhythm so the switch doesn’t feel like a dead panel.
 */
export function TasksRoutineTabFallback() {
  return (
    <div
      className="space-y-4"
      aria-busy="true"
      aria-label="Routine laden"
    >
      <div className="rounded-xl border border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(6,18,30,0.35)] p-3">
        <div className="h-2.5 w-24 animate-pulse rounded bg-[rgba(var(--mode-rgb),0.12)]" />
        <div className="mt-3 h-3 w-full max-w-md animate-pulse rounded bg-[rgba(var(--mode-rgb),0.08)]" />
      </div>
      <div className="h-[4.5rem] animate-pulse rounded-xl border border-[rgba(var(--mode-rgb),0.1)] bg-[rgba(var(--mode-rgb),0.06)]" />
      <div className="h-[4.5rem] animate-pulse rounded-xl border border-[rgba(var(--mode-rgb),0.1)] bg-[rgba(var(--mode-rgb),0.06)]" />
      <div className="h-[4.5rem] animate-pulse rounded-xl border border-[rgba(var(--mode-rgb),0.1)] bg-[rgba(var(--mode-rgb),0.06)]" />
    </div>
  );
}
