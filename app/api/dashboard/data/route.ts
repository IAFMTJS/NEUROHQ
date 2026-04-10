import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getDashboardCriticalPayload,
  getDashboardPayload,
  getDashboardSecondaryPayload,
} from "@/app/actions/dashboard-data";
import { SUPABASE_FIRST_CONTRACT_VERSION } from "@/lib/mobile/supabase-first-contract";
import { applyPrivateSnapshotCacheHeaders } from "@/lib/server/api-snapshot-headers";
import { applyApiRouteTiming, startApiRouteTimer } from "@/lib/server/api-route-telemetry";

function attachSnapshotMeta(res: NextResponse, startedAt: number, timingName: string) {
  applyPrivateSnapshotCacheHeaders(res);
  res.headers.set("x-neurohq-source-of-truth", "supabase");
  res.headers.set("x-neurohq-sync-contract", SUPABASE_FIRST_CONTRACT_VERSION);
  applyApiRouteTiming(res, startedAt, timingName);
}

/** GET /api/dashboard/data?part=critical|secondary|all — dashboard data for client. Use part=all for one round-trip. */
export async function GET(request: NextRequest) {
  const startedAt = startApiRouteTimer();
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const part = request.nextUrl.searchParams.get("part");
    if (part === "all") {
      const payload = await getDashboardPayload();
      if (!payload) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const out = { critical: payload.critical, secondary: payload.secondary };

      const res = NextResponse.json(out);
      attachSnapshotMeta(res, startedAt, "dashboard_data_all");
      return res;
    }
    if (part === "critical") {
      const critical = await getDashboardCriticalPayload();
      if (!critical) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const res = NextResponse.json(critical);
      attachSnapshotMeta(res, startedAt, "dashboard_data_critical");
      return res;
    }
    if (part === "secondary") {
      const secondary = await getDashboardSecondaryPayload();
      if (!secondary) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const res = NextResponse.json(secondary);
      attachSnapshotMeta(res, startedAt, "dashboard_data_secondary");
      return res;
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
