import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runStrategyGrowthWeeklyCron } from "@/lib/strategy-growth-cron";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Manual / legacy: same pass as weekly cron (growth protocol unset, learning idle only).
 * Strategy check-in, quarter incomplete, monthly tip: `/api/cron/monthly` + `cron-monthly.yml`.
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
  const { sent, skipped, users } = await runStrategyGrowthWeeklyCron(supabase, { userIdFilter, now });

  return NextResponse.json({
    ok: true,
    job: "strategy-growth",
    sent,
    skipped,
    users,
    ...(userIdFilter && { userId: userIdFilter }),
    note: "Weekly growth/idle only; strategy check-in, quarter, monthly tip via /api/cron/monthly.",
  });
}
