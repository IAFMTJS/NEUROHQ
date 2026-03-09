import { NextResponse } from "next/server";
import { getDailyStateForAllocator, ensureMasterMissionsForToday } from "@/app/actions/master-missions";
import { ensureReadingMissionForToday } from "@/app/actions/reading-missions";

export async function POST() {
  try {
    const dailyState = await getDailyStateForAllocator();
    const [masterResult, readingResult] = await Promise.all([
      ensureMasterMissionsForToday(dailyState ?? undefined),
      ensureReadingMissionForToday().catch(() => ({ created: false, debug: "error" })),
    ]);

    return NextResponse.json({
      ok: true,
      masterCreated: masterResult.created,
      masterDebug: masterResult.debug,
      readingCreated: readingResult.created,
      readingDebug: readingResult.debug,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bootstrap failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
