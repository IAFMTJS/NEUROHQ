import { NextResponse } from "next/server";
import { getGameState } from "@/app/actions/dcic/game-state";

export async function GET() {
  try {
    const state = await getGameState();
    if (!state) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(state, { status: 200 });
  } catch (error) {
    console.error("DCIC game-state API error:", error);
    return NextResponse.json({ error: "Failed to load game state" }, { status: 500 });
  }
}

