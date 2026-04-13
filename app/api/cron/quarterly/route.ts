import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runQuarterlyCronExecution } from "@/lib/server/cron-quarterly-execution";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Quarterly strategy row seed. Prefer `/api/cron/bundle` on quarter 1st 06:00 UTC.
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
  const body = await runQuarterlyCronExecution({ supabase, userIds: null, userIdFilter });
  return NextResponse.json(body);
}
