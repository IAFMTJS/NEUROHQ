/**
 * NEUROHQ – iCal feed voor iOS / Apple Kalender (subscribe-URL).
 * GET /api/calendar/feed?token=xxx → text/calendar
 * Apple Kalender: Abonnement toevoegen → URL invoeren.
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { toIcal } from "@/lib/ical";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token")?.trim();
  if (!token) {
    return new NextResponse("token required", { status: 400 });
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return new NextResponse("Calendar feed not configured", { status: 503 });
  }
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: rows, error } = await supabase.rpc("get_calendar_feed_events", {
    p_token: token,
  });
  if (error) {
    console.error("[calendar/feed]", error.message);
    return new NextResponse("Feed error", { status: 500 });
  }
  const events = (rows ?? []).map((r: { id: string; title: string | null; start_at: string; end_at: string }) => ({
    id: r.id,
    title: r.title ?? "Agenda",
    start_at: r.start_at,
    end_at: r.end_at,
  }));
  const ical = toIcal(events, { title: "NEUROHQ Agenda" });
  return new NextResponse(ical, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "private, max-age=300",
    },
  });
}
