import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runStrategyGrowthMonthlyCron } from "@/lib/strategy-growth-cron";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * First of month (UTC): strategy monthly tip, strategy check-in nudges, quarter-incomplete nudge (one prioritized push per user).
 * GitHub: `.github/workflows/cron-monthly.yml`.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.VAPID_PRIVATE_KEY || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    return NextResponse.json({ ok: false, error: "VAPID not configured" }, { status: 503 });
  }

  const url = new URL(request.url);
  const userIdParam = url.searchParams.get("userId");
  const userIdFilter = userIdParam ? String(userIdParam) : null;

  const supabase = createAdminClient();
  const now = new Date();
  const { sent, skipped, users } = await runStrategyGrowthMonthlyCron(supabase, { userIdFilter, now });

  return NextResponse.json({
    ok: true,
    job: "monthly",
    sent,
    skipped,
    users,
    ...(userIdFilter && { userId: userIdFilter }),
  });
}
