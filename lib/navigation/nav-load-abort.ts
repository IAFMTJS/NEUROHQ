/**
 * Shared AbortController for in-flight client loads. Priority shell navigation
 * (bottom nav, settings, help) calls {@link abortNavLoads} so fetches tied to
 * {@link getNavLoadAbortSignal} stop immediately before the next route runs.
 */
let navLoadController = new AbortController();

export function getNavLoadAbortSignal(): AbortSignal {
  return navLoadController.signal;
}

export function abortNavLoads(): void {
  navLoadController.abort();
  navLoadController = new AbortController();
}
