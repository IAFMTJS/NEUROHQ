import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Vercel Cron: runs daily at 00:00 UTC.
 * - Task rollover: move yesterday's incomplete tasks to today (UTC), increment carry_over_count.
 * - Quote dispatch (push) can be added later.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  const todayStr = today.toISOString().slice(0, 10);

  const { data: users } = await supabase.from("users").select("id");
  if (!users?.length) {
    return NextResponse.json({ ok: true, job: "daily", rolled: 0, users: 0 });
  }

  let totalRolled = 0;
  for (const { id: userId } of users) {
    const { data: tasks } = await supabase
      .from("tasks")
      .select("id, carry_over_count")
      .eq("user_id", userId)
      .eq("due_date", yesterdayStr)
      .eq("completed", false);

    for (const t of tasks ?? []) {
      const { error } = await supabase
        .from("tasks")
        .update({
          due_date: todayStr,
          carry_over_count: (t.carry_over_count ?? 0) + 1,
        })
        .eq("id", t.id);
      if (!error) totalRolled++;
    }
  }

  return NextResponse.json({
    ok: true,
    job: "daily",
    rolled: totalRolled,
    users: users.length,
    from: yesterdayStr,
    to: todayStr,
  });
}
