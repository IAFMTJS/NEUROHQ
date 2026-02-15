/**
 * NEUROHQ – .ics export (session auth) voor "Exporteer vandaag" / "Download agenda".
 * GET /api/calendar/export?from=YYYY-MM-DD&to=YYYY-MM-DD → download .ics
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { toIcal } from "@/lib/ical";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const fromParam = searchParams.get("from") ?? new Date().toISOString().slice(0, 10);
  const toParam = searchParams.get("to") ?? fromParam;
  const from = `${fromParam}T00:00:00`;
  const to = `${toParam}T23:59:59`;
  const { data: rows } = await supabase
    .from("calendar_events")
    .select("id, title, start_at, end_at")
    .eq("user_id", user.id)
    .gte("start_at", from)
    .lte("start_at", to)
    .order("start_at", { ascending: true });
  const events = (rows ?? []).map((r) => ({
    id: r.id,
    title: r.title ?? "Agenda",
    start_at: r.start_at,
    end_at: r.end_at,
  }));
  const ical = toIcal(events, { title: "NEUROHQ Agenda " + fromParam });
  return new NextResponse(ical, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="neurohq-agenda-${fromParam}.ics"`,
    },
  });
}
