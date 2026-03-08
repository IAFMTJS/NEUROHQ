import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { todayDateString } from "@/lib/utils/timezone";
import { getDashboardPayload } from "@/app/actions/dashboard-data";

/** Simple in-process cache for full dashboard payloads (per user + date). */
const DASHBOARD_CACHE_TTL_MS = 60_000;
const dashboardAllCache = new Map<
  string,
  { payload: { critical: unknown; secondary: unknown }; createdAt: number }
>();

/** GET /api/dashboard/data?part=critical|secondary|all — dashboard data for client. Use part=all for one round-trip. */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const part = request.nextUrl.searchParams.get("part");
    if (part === "all") {
      const dateStr = todayDateString();
      const cacheKey = `${user.id}:${dateStr}:all`;
      const cached = dashboardAllCache.get(cacheKey);
      if (cached && Date.now() - cached.createdAt < DASHBOARD_CACHE_TTL_MS) {
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.log("[dashboard] cache hit for %s", cacheKey);
        }
        return NextResponse.json(cached.payload);
      }

      const payload = await getDashboardPayload();
      if (!payload) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const out = { critical: payload.critical, secondary: payload.secondary };
      dashboardAllCache.set(cacheKey, { payload: out, createdAt: Date.now() });

      const res = NextResponse.json(out);
      res.headers.set("Cache-Control", "private, max-age=30, stale-while-revalidate=60");
      return res;
    }
    if (part === "critical" || part === "secondary") {
      const payload = await getDashboardPayload();
      if (!payload) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.json(part === "critical" ? payload.critical : payload.secondary);
    }
    return NextResponse.json(
      { error: "Missing or invalid part. Use ?part=critical, ?part=secondary, or ?part=all" },
      { status: 400 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[API dashboard/data]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
