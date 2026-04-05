import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isPlatformGameLive } from "@/lib/platform-games";

/**
 * GET /api/platform-games
 * Actieve spellen binnen het tijdvenster voor de ingelogde gebruiker.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ games: [] as const });
  }

  const { data, error } = await supabase
    .from("platform_games")
    .select("id, title, body, starts_at, ends_at, active, config")
    .order("starts_at", { ascending: false });

  if (error) {
    return NextResponse.json({ games: [], error: error.message }, { status: 500 });
  }

  const now = Date.now();
  const games = (data ?? []).filter((row) =>
    isPlatformGameLive(
      {
        active: row.active ?? true,
        starts_at: row.starts_at,
        ends_at: row.ends_at,
      },
      now
    )
  );

  return NextResponse.json({
    games: games.map(({ id, title, body, starts_at, ends_at, config }) => ({
      id,
      title,
      body,
      starts_at,
      ends_at,
      config,
    })),
  });
}
