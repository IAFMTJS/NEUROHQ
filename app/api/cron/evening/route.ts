import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push";

/**
 * Vercel Cron: runs daily at 21:00 UTC (evening).
 * Sends "wind down" / shutdown reminder to users with push enabled (respects max 3/day).
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: users } = await supabase
    .from("users")
    .select("id")
    .not("push_subscription_json", "is", null);

  let sent = 0;
  if (process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    for (const { id: uid } of users ?? []) {
      try {
        const ok = await sendPushToUser(supabase, uid, {
          title: "NEUROHQ",
          body: "Time to wind down. Rest well.",
          tag: "shutdown-reminder",
          url: "/dashboard",
        });
        if (ok) sent++;
      } catch {
        // skip
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
