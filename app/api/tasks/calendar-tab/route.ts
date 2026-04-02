import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCalendarTabData } from "@/app/actions/calendar-tab-data";

/**
 * GET /api/tasks/calendar-tab?month=YYYY-MM&anchorDate=YYYY-MM-DD
 * Used by daily snapshot merge/initialize (client fetch) and keeps one shape with getCalendarTabData.
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
  const month = url.searchParams.get("month");
  const anchorDate = url.searchParams.get("anchorDate");
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "Invalid or missing month" }, { status: 400 });
  }
  if (!anchorDate || !/^\d{4}-\d{2}-\d{2}$/.test(anchorDate)) {
    return NextResponse.json({ error: "Invalid or missing anchorDate" }, { status: 400 });
  }

  const payload = await getCalendarTabData(month, anchorDate);
  return NextResponse.json(payload);
}
