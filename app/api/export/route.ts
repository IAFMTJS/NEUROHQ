import { NextResponse } from "next/server";
import { exportUserData } from "@/app/actions/export";

export async function GET() {
  try {
    const json = await exportUserData();
    return new NextResponse(json, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": "attachment; filename=neurohq-export.json",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: "Export failed" }, { status: 401 });
  }
}
