import type { NextResponse } from "next/server";

/**
 * Short private caching for authenticated JSON snapshots (PWA + browser).
 * Safe with user-specific data: must not be shared across users (private).
 */
export function applyPrivateSnapshotCacheHeaders(res: NextResponse): void {
  res.headers.set("Cache-Control", "private, max-age=30, stale-while-revalidate=120");
}
