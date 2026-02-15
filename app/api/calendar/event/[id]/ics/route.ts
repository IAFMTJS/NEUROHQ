/**
 * NEUROHQ – .ics voor één event (bv. "Toevoegen aan Apple Kalender").
 * GET /api/calendar/event/[id]/ics → download .ics
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { toIcal } from "@/lib/ical";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return new NextResponse("Not found", { status: 404 });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const { data: row } = await supabase
    .from("calendar_events")
    .select("id, title, start_at, end_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (!row) return new NextResponse("Not found", { status: 404 });
  const events = [
    {
      id: row.id,
      title: row.title ?? "Agenda",
      start_at: row.start_at,
      end_at: row.end_at,
    },
  ];
  const ical = toIcal(events, { title: row.title ?? "NEUROHQ" });
  return new NextResponse(ical, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="event-${id.slice(0, 8)}.ics"`,
    },
  });
}
