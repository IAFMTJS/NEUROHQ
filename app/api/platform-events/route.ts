import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isPlatformEventLive } from "@/lib/platform-events";

/**
 * GET /api/platform-events
 * Actieve, binnen tijdvenster vallende events voor de ingelogde gebruiker (banner in app).
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ events: [] as const });
  }

  const { data, error } = await supabase
    .from("platform_events")
    .select("id, title, body, starts_at, ends_at, active")
    .order("starts_at", { ascending: false });

  if (error) {
    return NextResponse.json({ events: [], error: error.message }, { status: 500 });
  }

  const now = Date.now();
  const events = (data ?? []).filter((row) =>
    isPlatformEventLive(
      {
        active: row.active ?? true,
        starts_at: row.starts_at,
        ends_at: row.ends_at,
      },
      now
    )
  );

  return NextResponse.json({
    events: events.map(({ id, title, body, starts_at, ends_at }) => ({ id, title, body, starts_at, ends_at })),
  });
}
