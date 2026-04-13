import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runHourlyCronExecution } from "@/lib/server/cron-hourly-execution";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Hourly scheduler (GitHub Actions). Prefer `/api/cron/bundle` in production to share one
 * `users` + `user_preferences` prefetch with daily/weekly when their UTC slots align.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const body = await runHourlyCronExecution({ supabase, request, prefetched: null });
  return NextResponse.json(body);
}
