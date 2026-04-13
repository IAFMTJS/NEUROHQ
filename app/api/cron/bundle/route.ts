import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadCronUserPrefsBundle } from "@/lib/server/cron-user-prefs-bundle";
import { runHourlyCronExecution } from "@/lib/server/cron-hourly-execution";
import { runDailyCronExecution } from "@/lib/server/cron-daily-execution";
import { runWeeklyCronExecution } from "@/lib/server/cron-weekly-execution";
import { runQuarterlyCronExecution } from "@/lib/server/cron-quarterly-execution";
import { runStrategyGrowthMonthlyCron } from "@/lib/strategy-growth-cron";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Same UTC slots as legacy GitHub workflows (see README). */
const DAILY_UTC_HOUR = 6;
const WEEKLY_UTC = { dow: 1, hour: 9 } as const; // Monday 09:00 UTC
const MONTHLY_UTC = { dom: 1, hour: 10 } as const; // 1st 10:00 UTC
/** Jan/Apr/Jul/Oct 1st 06:00 UTC — matches `cron-quarterly.yml`. */
const QUARTERLY_UTC_MONTHS = [0, 3, 6, 9] as const;

function hourlyProxyRequest(original: Request): Request {
  const u = new URL(original.url);
  u.pathname = "/api/cron/hourly";
  return new Request(u.toString(), { headers: original.headers });
}

/**
 * Single hourly tick: runs `/api/cron/hourly` work plus scheduled daily / weekly / … jobs
 * when UTC matches the former GitHub schedules. One `users` + `user_preferences` prefetch
 * per invocation for hourly + daily + weekly (when those run).
 *
 * GitHub: point `cron-hourly.yml` at this path; disable scheduled runs on the split workflows
 * to avoid duplicate jobs.
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
  const prefetch = await loadCronUserPrefsBundle(supabase, userIdFilter);

  const now = new Date();
  const utcHour = now.getUTCHours();
  const utcDow = now.getUTCDay();
  const utcDate = now.getUTCDate();
  const utcMonth = now.getUTCMonth();

  const hourly = await runHourlyCronExecution({
    supabase,
    request: hourlyProxyRequest(request),
    prefetched: prefetch,
  });

  const ran = ["hourly"] as string[];
  const extra: Record<string, unknown> = {};

  if (utcHour === DAILY_UTC_HOUR) {
    extra.daily = await runDailyCronExecution({
      supabase,
      userIdFilter,
      prefetchedUsers: prefetch.users,
    });
    ran.push("daily");
  }

  if (utcDow === WEEKLY_UTC.dow && utcHour === WEEKLY_UTC.hour) {
    extra.weekly = await runWeeklyCronExecution({
      supabase,
      userIdFilter,
      prefetched: prefetch,
    });
    ran.push("weekly");
  }

  if (utcDate === MONTHLY_UTC.dom && utcHour === MONTHLY_UTC.hour) {
    if (!process.env.VAPID_PRIVATE_KEY || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
      extra.monthly = { ok: false, error: "VAPID not configured", skipped: true };
    } else {
      extra.monthly = await runStrategyGrowthMonthlyCron(supabase, { userIdFilter, now });
    }
    ran.push("monthly");
  }

  if (
    utcDate === 1 &&
    utcHour === DAILY_UTC_HOUR &&
    (QUARTERLY_UTC_MONTHS as readonly number[]).includes(utcMonth)
  ) {
    extra.quarterly = await runQuarterlyCronExecution({
      supabase,
      userIds: prefetch.users.map((u) => u.id),
      userIdFilter,
    });
    ran.push("quarterly");
  }

  return NextResponse.json({
    ok: true,
    job: "bundle",
    utcHour,
    utcDow,
    utcDate,
    utcMonth,
    ran,
    hourly,
    ...extra,
  });
}
