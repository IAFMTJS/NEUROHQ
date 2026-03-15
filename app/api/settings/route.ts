/**
 * GET /api/settings – Server source of truth for preferences and payday.
 * Used by SettingsProvider for client read-through; invalidate after mutations.
 */

import { NextResponse } from "next/server";
import { getUserPreferencesOrDefaults } from "@/app/actions/preferences";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [preferences, userRow] = await Promise.all([
    getUserPreferencesOrDefaults(),
    supabase.from("users").select("last_payday_date, payday_day_of_month").eq("id", user.id).single(),
  ]);

  const row = (userRow.data ?? {}) as { last_payday_date?: string | null; payday_day_of_month?: number | null };
  return NextResponse.json({
    preferences,
    payday: {
      last_payday_date: row.last_payday_date ?? null,
      payday_day_of_month: row.payday_day_of_month ?? null,
    },
  });
}
