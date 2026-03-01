"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function ensureUserProfile(userId: string, email: string | undefined) {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .single();
  if (existing) return;
  await supabase.from("users").insert({
    id: userId,
    email: email ?? null,
    role: "user",
  });
}

/** Call after login so dashboard layout does not block on profile creation. Pass user when already available to avoid extra getUser(). */
export async function ensureUserProfileForSession(user?: { id: string; email?: string | null } | null) {
  if (user) {
    await ensureUserProfile(user.id, user.email ?? undefined);
    return;
  }
  const supabase = await createClient();
  const { data: { user: u } } = await supabase.auth.getUser();
  if (!u) return;
  await ensureUserProfile(u.id, u.email ?? undefined);
}

export async function getUserTimezone(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("users")
    .select("timezone")
    .eq("id", user.id)
    .single();
  return (data as { timezone?: string | null } | null)?.timezone ?? null;
}

export async function updateUserTimezone(timezone: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Niet ingelogd.");
  const { error } = await supabase.from("users").update({ timezone }).eq("id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/settings");
}

/** Push quote time (e.g. "08:00"); null = use default in cron. */
export async function getPushQuoteTime(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("users").select("push_quote_time").eq("id", user.id).single();
  const t = (data as { push_quote_time?: string | null } | null)?.push_quote_time;
  if (typeof t !== "string" || !t) return null;
  return t.slice(0, 5);
}

export async function updatePushQuoteTime(time: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Niet ingelogd.");
  const value = time && /^\d{1,2}:\d{2}$/.test(time) ? time : null;
  const { error } = await supabase.from("users").update({ push_quote_time: value }).eq("id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

export type QuietHours = { start: string | null; end: string | null };

export async function getPushQuietHours(): Promise<QuietHours> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { start: null, end: null };
  const { data } = await supabase.from("users").select("push_quiet_hours_start, push_quiet_hours_end").eq("id", user.id).single();
  const r = data as { push_quiet_hours_start?: string | null; push_quiet_hours_end?: string | null } | null;
  return {
    start: r?.push_quiet_hours_start ? String(r.push_quiet_hours_start).slice(0, 5) : null,
    end: r?.push_quiet_hours_end ? String(r.push_quiet_hours_end).slice(0, 5) : null,
  };
}

export async function updatePushQuietHours(start: string | null, end: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Niet ingelogd.");
  const startVal = start && /^\d{1,2}:\d{2}$/.test(start) ? start : null;
  const endVal = end && /^\d{1,2}:\d{2}$/.test(end) ? end : null;
  const { error } = await supabase.from("users").update({
    push_quiet_hours_start: startVal,
    push_quiet_hours_end: endVal,
  }).eq("id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}
