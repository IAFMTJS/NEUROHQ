import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Record that the user opened the app from a push notification (click tracking).
 * Called by the client when URL has from_push=1 and tag=.
 * Used for fatigue-based daily cap (fewer pushes when user rarely opens from push).
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const tag = typeof body.tag === "string" ? body.tag.trim() : null;
    if (!tag) {
      return NextResponse.json({ error: "Missing tag" }, { status: 400 });
    }

    const { error } = await supabase.from("push_engagement").insert({
      user_id: user.id,
      event_type: "clicked",
      tag,
      created_at: new Date().toISOString(),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to record push click.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
