/**
 * Routes warmed during bootstrap (`preloadPages`) and by `RoutePrefetcher`.
 * Must use `router.prefetch` — a plain `fetch(href)` does not fill the App Router RSC cache.
 */
export const BOOTSTRAP_PREFETCH_ROUTES: readonly string[] = [
  "/dashboard",
  "/tasks",
  "/profile?view=insights&tab=overview",
  "/analytics",
  "/strategy",
  "/learning",
  "/learning/analytics",
  "/budget",
  "/settings",
  "/profile",
  "/help",
  "/assistant",
];
