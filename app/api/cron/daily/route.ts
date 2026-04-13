import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runDailyCronExecution } from "@/lib/server/cron-daily-execution";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Daily 06:00 UTC job. Prefer `/api/cron/bundle` (same schedule) to avoid duplicate `users` fetch.
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
  const body = await runDailyCronExecution({ supabase, userIdFilter, prefetchedUsers: null });
  return NextResponse.json(body);
}
