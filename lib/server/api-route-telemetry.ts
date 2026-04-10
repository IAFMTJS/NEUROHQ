import type { NextResponse } from "next/server";

export function startApiRouteTimer(): number {
  return Date.now();
}

/** Optional `Server-Timing` + `x-neurohq-duration-ms` for dashboards and Supabase tuning. */
export function applyApiRouteTiming(res: NextResponse, startedAt: number, metricName: string): void {
  const ms = Math.max(0, Date.now() - startedAt);
  res.headers.set("x-neurohq-duration-ms", String(ms));
  const safeName = metricName.replace(/[^a-zA-Z0-9_-]/g, "_");
  res.headers.set("Server-Timing", `${safeName};dur=${ms}`);
}
