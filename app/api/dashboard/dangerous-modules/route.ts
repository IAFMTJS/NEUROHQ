import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDangerousModulesContext } from "@/app/actions/dangerous-modules-context";
import { setWeeklyTacticalModeOverride } from "@/app/actions/weekly-tactical-mode-action";
import type { WeeklyTacticalMode } from "@/lib/weekly-tactical-mode";

/** GET ?date=YYYY-MM-DD — dangerous modules context (avoids Server Action response format). */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const dateStr = request.nextUrl.searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
    const ctx = await getDangerousModulesContext(dateStr);
    return NextResponse.json(ctx);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[API dashboard/dangerous-modules GET]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** POST { date, mode } — set weekly tactical mode override. */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const dateStr = typeof body?.date === "string" ? body.date : new Date().toISOString().slice(0, 10);
    const mode = body?.mode as WeeklyTacticalMode | undefined;
    const validModes: WeeklyTacticalMode[] = ["stability", "push", "recovery", "expansion"];
    if (!mode || !validModes.includes(mode)) {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }
    const result = await setWeeklyTacticalModeOverride(dateStr, mode);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[API dashboard/dangerous-modules POST]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
