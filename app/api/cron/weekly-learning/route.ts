import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runWeeklyLearningReminderPass } from "@/lib/weekly-learning-reminder-cron";

/**
 * Thursday (per-user local calendar): learning-under-target push + optional email.
 * GitHub: `.github/workflows/cron-weekly-learning.yml`.
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
  const now = new Date();
  const { learningReminderSent, learningReminderEmailSent, users } = await runWeeklyLearningReminderPass(supabase, {
    userIdFilter,
    now,
  });

  return NextResponse.json({
    ok: true,
    job: "weekly-learning",
    learningReminderSent,
    learningReminderEmailSent,
    users,
    ...(userIdFilter && { userId: userIdFilter }),
  });
}
