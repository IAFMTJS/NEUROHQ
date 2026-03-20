import { NextResponse } from "next/server";
import { confirmStartMission } from "@/app/actions/dcic/missions";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const missionId = typeof body?.missionId === "string" ? body.missionId : undefined;
    const modeOverrideRaw = typeof body?.modeOverride === "string" ? body.modeOverride : undefined;
    if (!missionId) {
      return NextResponse.json({ success: false, error: "Missing missionId" }, { status: 400 });
    }

    const validModes = ["focus", "war", "recovery"] as const;
    const modeOverride = modeOverrideRaw && validModes.includes(modeOverrideRaw as any)
      ? (modeOverrideRaw as (typeof validModes)[number])
      : null;

    const result = await confirmStartMission(missionId, { modeOverride });
    const status = result.success ? 200 : 400;
    return NextResponse.json(result, { status });
  } catch (error) {
    console.error("DCIC confirm-start API error:", error);
    return NextResponse.json({ success: false, error: "Failed to start mission" }, { status: 500 });
  }
}

