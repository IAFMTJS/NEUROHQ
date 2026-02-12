import { NextResponse } from "next/server";

/**
 * Vercel Cron: runs quarterly (1st of Jan, Apr, Jul, Oct at 06:00 UTC).
 * - Strategy reset (prompt or clear quarterly theme/identity)
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // TODO: reset or archive quarterly strategy; optionally notify users to set new quarter
  return NextResponse.json({ ok: true, job: "quarterly" });
}
