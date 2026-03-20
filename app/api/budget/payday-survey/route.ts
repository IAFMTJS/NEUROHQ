import { NextResponse } from "next/server";
import { submitPaydayReflectionSurvey } from "@/app/actions/budget-intelligence";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      primaryReason?: string;
      trigger?: string;
      confidence?: number;
      note?: string;
    };
    await submitPaydayReflectionSurvey({
      primaryReason: String(body.primaryReason ?? ""),
      trigger: String(body.trigger ?? ""),
      confidence: Number(body.confidence ?? 3),
      note: typeof body.note === "string" ? body.note : "",
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save survey";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

