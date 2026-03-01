import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push";
import { getLocalDateHour, isInQuietHours } from "@/lib/utils/timezone";
import { isHighSensoryDayForUser } from "@/lib/mode-admin";

/**
 * Vercel Cron: runs daily at 21:00 UTC (evening).
 * Sends "wind down" / shutdown reminder to users with push enabled.
 * Respects per-user quiet hours window (no push inside quiet window).
 * HIGH_SENSORY: skip non-critical shutdown push on high sensory days.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date();
  const utcHour = now.getUTCHours();

  const { data: users } = await supabase
    .from("users")
    .select("id, timezone, push_quiet_hours_start, push_quiet_hours_end")
    .not("push_subscription_json", "is", null);

  let sent = 0;
  if (process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    for (const u of users ?? []) {
      try {
        const tz = (u as { timezone?: string | null }).timezone ?? null;
        const { date: localDate, hour: localHour } = tz
          ? getLocalDateHour(tz)
          : { date: now.toISOString().slice(0, 10), hour: utcHour };
        const quietStart = u.push_quiet_hours_start ? String(u.push_quiet_hours_start).slice(0, 5) : null;
        const quietEnd = u.push_quiet_hours_end ? String(u.push_quiet_hours_end).slice(0, 5) : null;
        if (isInQuietHours(localHour, quietStart, quietEnd)) continue;

        // HIGH_SENSORY: skip shutdown reminder on high sensory days
        const highSensory = await isHighSensoryDayForUser(supabase, u.id as string, localDate);
        if (highSensory) continue;

        const uid = u.id as string;
        const ok = await sendPushToUser(supabase, uid, {
          title: "NEUROHQ",
          body: "Time to wind down. Rest well.",
          tag: "shutdown-reminder",
          url: "/dashboard",
        });
        if (ok) sent++;
      } catch {
        // skip this user on error
      }
    }
  }

  return NextResponse.json({
    ok: true,
    job: "evening",
    shutdownReminderSent: sent,
    users: users?.length ?? 0,
  });
}
