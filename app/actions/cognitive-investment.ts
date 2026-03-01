"use server";

import { createClient } from "@/lib/supabase/server";

/** Check if user can invest focus today (max 1 invested mission per day). */
export async function canInvestFocusToday(dateStr: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: row } = await supabase
    .from("daily_state")
    .select("focus_invested_today, invested_mission_id")
    .eq("user_id", user.id)
    .eq("date", dateStr)
    .maybeSingle();
  const invested = (row as { focus_invested_today?: number | null; invested_mission_id?: string | null } | null)
    ?.focus_invested_today;
  const missionId = (row as { invested_mission_id?: string | null } | null)?.invested_mission_id;
  return (invested == null || invested === 0) && missionId == null;
}

/** Set invested focus for today and link to mission (call when user starts mission with investment). */
export async function setInvestedFocus(
  dateStr: string,
  focusAmount: number,
  missionId: string
): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const can = await canInvestFocusToday(dateStr);
  if (!can || focusAmount <= 0) return false;

  const { error } = await supabase.from("daily_state").upsert(
    {
      user_id: user.id,
      date: dateStr,
      focus_invested_today: Math.min(100, focusAmount),
      invested_mission_id: missionId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,date" }
  );
  return !error;
}

/** Get invested focus for today (for double loss on fail). */
export async function getInvestedFocusForMission(
  dateStr: string,
  missionId: string
): Promise<{ amount: number; isInvested: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { amount: 0, isInvested: false };
  const { data: row } = await supabase
    .from("daily_state")
    .select("focus_invested_today, invested_mission_id")
    .eq("user_id", user.id)
    .eq("date", dateStr)
    .maybeSingle();
  const invested = (row as { focus_invested_today?: number | null } | null)?.focus_invested_today ?? 0;
  const linked = (row as { invested_mission_id?: string | null } | null)?.invested_mission_id === missionId;
  return { amount: invested, isInvested: linked && invested > 0 };
}

/** Clear invested focus after completion or abandon (so next mission can invest). Next day resets via new row. */
export async function clearInvestedFocusForDay(dateStr: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("daily_state")
    .update({
      focus_invested_today: 0,
      invested_mission_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .eq("date", dateStr);
}
