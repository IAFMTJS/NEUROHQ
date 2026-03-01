import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Vercel Cron: runs quarterly (1st of Jan, Apr, Jul, Oct at 06:00 UTC).
 * Ensures each user has a quarterly_strategy row for the current quarter so the Strategy form appears.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const d = new Date();
  const year = d.getFullYear();
  const quarter = Math.floor(d.getMonth() / 3) + 1;

  const { data: users } = await supabase.from("users").select("id");
  if (!users?.length) {
    return NextResponse.json({ ok: true, job: "quarterly", ensured: 0 });
  }

  let ensured = 0;
  for (const { id: userId } of users) {
    const { data: existing } = await supabase
      .from("quarterly_strategy")
      .select("id")
      .eq("user_id", userId)
      .eq("year", year)
      .eq("quarter", quarter)
      .maybeSingle();
    if (!existing) {
      const { error } = await supabase.from("quarterly_strategy").insert({
        user_id: userId,
        year,
        quarter,
        primary_theme: null,
        secondary_theme: null,
        savings_goal_id: null,
        identity_statement: null,
      });
      if (!error) ensured++;
    }
  }

  return NextResponse.json({ ok: true, job: "quarterly", year, quarter, ensured, users: users.length });
}
