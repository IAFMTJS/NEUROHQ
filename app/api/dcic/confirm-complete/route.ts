import { NextResponse } from "next/server";
import { confirmCompleteMission } from "@/app/actions/dcic/missions";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const missionId = typeof body?.missionId === "string" ? body.missionId : undefined;
    if (!missionId) {
      return NextResponse.json({ success: false, error: "Missing missionId" }, { status: 400 });
    }

    const result = await confirmCompleteMission(missionId);
    const status = result.success ? 200 : 400;
    return NextResponse.json(result, { status });
  } catch (error) {
    console.error("DCIC confirm-complete API error:", error);
    return NextResponse.json({ success: false, error: "Failed to complete mission" }, { status: 500 });
  }
}

