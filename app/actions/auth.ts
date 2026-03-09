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

/** Whether the user has an active push subscription (persisted in DB; survives cache clear / navigation). */
export async function getPushSubscriptionEnabled(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from("users").select("push_subscription_json").eq("id", user.id).single();
  const json = (data as { push_subscription_json?: unknown } | null)?.push_subscription_json;
  return json != null && typeof json === "object";
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

function normalizeTimeInput(time: string | null): string | null {
  if (!time) return null;
  const trimmed = time.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return null;
  const hour = Math.min(23, Math.max(0, Number(match[1])));
  const minute = Math.min(59, Math.max(0, Number(match[2])));
  const hh = hour.toString().padStart(2, "0");
  const mm = minute.toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

/** Returns the normalized time actually written (HH:MM or null). */
export async function updatePushQuoteTime(time: string | null): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Niet ingelogd.");
  const value = normalizeTimeInput(time);
  const { error } = await supabase.from("users").update({ push_quote_time: value }).eq("id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  return value;
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

/** Returns the normalized quiet hours actually written. */
export async function updatePushQuietHours(start: string | null, end: string | null): Promise<QuietHours> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Niet ingelogd.");
  const startVal = normalizeTimeInput(start);
  const endVal = normalizeTimeInput(end);
  const { error } = await supabase.from("users").update({
    push_quiet_hours_start: startVal,
    push_quiet_hours_end: endVal,
  }).eq("id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  return { start: startVal, end: endVal };
}
