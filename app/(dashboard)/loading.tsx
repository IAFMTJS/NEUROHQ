/**
 * Shown immediately on client navigations between (dashboard) pages while the server
 * segment resolves. Shell layout stays mounted; only this replaces the page slot.
 */
export default function DashboardLoading() {
  return (
    <div
      className="container page page-wide px-4 py-6"
      aria-busy
      aria-label="Pagina laden"
    >
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="h-9 w-56 max-w-[70%] animate-pulse rounded-xl bg-[var(--card-border)]/40" />
        <div className="h-36 w-full animate-pulse rounded-2xl bg-[var(--card-border)]/25" />
        <div className="h-28 w-full animate-pulse rounded-2xl bg-[var(--card-border)]/20" />
        <div className="h-28 w-full animate-pulse rounded-2xl bg-[var(--card-border)]/20" />
      </div>
    </div>
  );
}
