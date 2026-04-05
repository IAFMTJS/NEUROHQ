import { NextResponse } from "next/server";
import { getPlatformGamesForCurrentUser } from "@/app/actions/profile-special-events";

export const dynamic = "force-dynamic";

/**
 * GET /api/platform-games
 * Live games met voortgang (checklist / answer / auto), zelfde logica als profiel — inclusief auto-sync en XP.
 */
export async function GET() {
  try {
    const games = await getPlatformGamesForCurrentUser();
    return NextResponse.json({ games });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Onbekende fout";
    return NextResponse.json({ games: [] as const, error: msg }, { status: 500 });
  }
}
