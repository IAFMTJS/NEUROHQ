import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { exchangeGoogleCode } from "@/lib/calendar-google";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!code || !state) {
    return NextResponse.redirect(new URL("/settings?error=google_callback_missing", baseUrl));
  }
  let userId: string;
  try {
    userId = JSON.parse(Buffer.from(state, "base64url").toString()).userId;
  } catch {
    return NextResponse.redirect(new URL("/settings?error=google_invalid_state", baseUrl));
  }
  const redirectUri = `${baseUrl}/api/auth/google/callback`;
  try {
    const tokens = await exchangeGoogleCode(code, redirectUri);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
    const supabase = createAdminClient();
    await supabase.from("user_google_tokens").upsert(
      {
        user_id: userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
  } catch (e) {
    console.error("Google token exchange:", e);
    return NextResponse.redirect(new URL("/settings?error=google_token_failed", baseUrl));
  }
  return NextResponse.redirect(new URL("/settings?google=connected", baseUrl));
}
