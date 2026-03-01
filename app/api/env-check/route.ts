import { NextResponse } from "next/server";

/**
 * GET /api/env-check — Returns whether required env vars are set (no secrets).
 * Use on Vercel to confirm NEXT_PUBLIC_SUPABASE_* are configured.
 */
export async function GET() {
  const supabaseUrlSet = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKeySet = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const ok = supabaseUrlSet && supabaseKeySet;
  return NextResponse.json({
    ok,
    env: { supabaseUrlSet, supabaseKeySet },
  });
}
