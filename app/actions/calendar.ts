"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  fetchGoogleCalendarEventsForDate,
  createGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
} from "@/lib/calendar-google";

export async function getCalendarEventsForDate(date: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const start = `${date}T00:00:00`;
  const end = `${date}T23:59:59`;
  const { data } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("user_id", user.id)
    .gte("start_at", start)
    .lte("start_at", end)
    .order("start_at", { ascending: true });
  return data ?? [];
}

/** Events from startDate through startDate + (numDays - 1), for showing "Today" and upcoming days. */
export async function getUpcomingCalendarEvents(startDate: string, numDays: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const start = `${startDate}T00:00:00`;
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + numDays);
  const endStr = endDate.toISOString().slice(0, 10) + "T00:00:00";
  const { data } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("user_id", user.id)
    .gte("start_at", start)
    .lt("start_at", endStr)
    .order("start_at", { ascending: true });
  return data ?? [];
}

export async function addManualEvent(params: {
  title: string;
  start_at: string;
  end_at: string;
  is_social?: boolean;
  sync_to_google?: boolean;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const start = new Date(params.start_at);
  const end = new Date(params.end_at);
  const duration_hours = (end.getTime() - start.getTime()) / (60 * 60 * 1000);
  let source: string = "manual";
  let external_id: string | null = null;

  if (params.sync_to_google) {
    const { data: tokenRow } = await supabase
      .from("user_google_tokens")
      .select("access_token, expires_at")
      .eq("user_id", user.id)
      .maybeSingle();
    if (tokenRow && new Date(tokenRow.expires_at) > new Date()) {
      const googleId = await createGoogleCalendarEvent(tokenRow.access_token, {
        summary: params.title,
        start: params.start_at,
        end: params.end_at,
      });
      if (googleId) {
        source = "neurohq";
        external_id = googleId;
      }
    }
  }

  const { error } = await supabase.from("calendar_events").insert({
    user_id: user.id,
    title: params.title,
    start_at: params.start_at,
    end_at: params.end_at,
    duration_hours: Math.round(duration_hours * 100) / 100,
    is_social: params.is_social ?? false,
    source,
    external_id,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/tasks");
  revalidatePath("/budget");
}

export async function deleteCalendarEvent(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: row } = await supabase
    .from("calendar_events")
    .select("source, external_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (row?.source === "neurohq" && row?.external_id) {
    const { data: tokenRow } = await supabase
      .from("user_google_tokens")
      .select("access_token, expires_at")
      .eq("user_id", user.id)
      .maybeSingle();
    if (tokenRow && new Date(tokenRow.expires_at) > new Date()) {
      await deleteGoogleCalendarEvent(tokenRow.access_token, row.external_id);
    }
  }
  const { error } = await supabase.from("calendar_events").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/tasks");
  revalidatePath("/budget");
}

/** Genereert of haalt calendar_feed_token op voor iOS / Apple Kalender subscribe-URL. */
export async function getOrCreateCalendarFeedToken(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: row } = await supabase
    .from("users")
    .select("calendar_feed_token")
    .eq("id", user.id)
    .single();
  const existing = (row as { calendar_feed_token?: string } | null)?.calendar_feed_token;
  if (existing) return existing;
  const token = crypto.randomUUID() + "-" + crypto.randomUUID().replace(/-/g, "");
  const { error } = await supabase
    .from("users")
    .update({ calendar_feed_token: token })
    .eq("id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  return token;
}

/** Haalt feed-URL op (of genereert token). Geef baseUrl voor volledige URL; anders alleen path (voor client: origin + path). */
export async function getCalendarFeedUrl(baseUrl?: string): Promise<string | null> {
  try {
    const token = await getOrCreateCalendarFeedToken();
    const path = `/api/calendar/feed?token=${encodeURIComponent(token)}`;
    if (baseUrl) return baseUrl.replace(/\/$/, "") + path;
    return path;
  } catch {
    return null;
  }
}

export async function hasGoogleCalendarToken(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("user_google_tokens")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  return !!data;
}

export async function syncGoogleCalendarForDate(dateStr: string): Promise<{ synced: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: tokenRow } = await supabase
    .from("user_google_tokens")
    .select("access_token, expires_at")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!tokenRow || new Date(tokenRow.expires_at) <= new Date()) return { synced: 0 };
  const events = await fetchGoogleCalendarEventsForDate(tokenRow.access_token, dateStr);
  const startOfDay = `${dateStr}T00:00:00Z`;
  const endOfDay = `${dateStr}T23:59:59Z`;
  await supabase
    .from("calendar_events")
    .delete()
    .eq("user_id", user.id)
    .eq("source", "google")
    .gte("start_at", startOfDay)
    .lte("start_at", endOfDay);
  let synced = 0;
  for (const ev of events) {
    const start = ev.start?.dateTime ?? ev.start?.date ?? startOfDay;
    const end = ev.end?.dateTime ?? ev.end?.date ?? endOfDay;
    const startAt = new Date(start);
    const endAt = new Date(end);
    const duration_hours = (endAt.getTime() - startAt.getTime()) / (60 * 60 * 1000);
    const { error } = await supabase.from("calendar_events").insert({
      user_id: user.id,
      external_id: ev.id,
      title: ev.summary ?? "(No title)",
      start_at: start,
      end_at: end,
      duration_hours: Math.round(duration_hours * 100) / 100,
      is_social: false,
      source: "google",
    });
    if (!error) synced++;
  }
  revalidatePath("/dashboard");
  return { synced };
}
