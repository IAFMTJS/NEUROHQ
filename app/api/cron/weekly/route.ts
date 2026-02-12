import { NextResponse } from "next/server";

/**
 * Vercel Cron: runs weekly (e.g. Monday 09:00 UTC).
 * - Reality report generation
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // TODO: generate and store/send weekly reality report per user
  return NextResponse.json({ ok: true, job: "weekly" });
}
