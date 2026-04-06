import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTasksForDate } from "@/app/actions/tasks";
import { SUPABASE_FIRST_CONTRACT_VERSION } from "@/lib/mobile/supabase-first-contract";

/**
 * GET /api/tasks?date=YYYY-MM-DD — full task list for that due_date (completed + incomplete).
 * Used by useTasksBootstrap to merge server truth into the client store (multi-device sync).
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  const date = url.searchParams.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid or missing date" }, { status: 400 });
  }
  const tasks = await getTasksForDate(date);
  const res = NextResponse.json(tasks);
  res.headers.set("Cache-Control", "no-store, max-age=0");
  res.headers.set("x-neurohq-source-of-truth", "supabase");
  res.headers.set("x-neurohq-sync-contract", SUPABASE_FIRST_CONTRACT_VERSION);
  return res;
}
