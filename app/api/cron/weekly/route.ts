import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runWeeklyCronExecution } from "@/lib/server/cron-weekly-execution";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Weekly Monday 09:00 UTC. Prefer `/api/cron/bundle` to share prefetch with hourly tick.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const userIdParam = url.searchParams.get("userId");
  const userIdFilter = userIdParam ? String(userIdParam) : null;

  const supabase = createAdminClient();
  const body = await runWeeklyCronExecution({ supabase, userIdFilter, prefetched: null });
  return NextResponse.json(body);
}
