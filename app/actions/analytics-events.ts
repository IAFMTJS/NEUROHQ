"use server";

import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database.types";

/** Record a named analytics event (funnel: mission_completed, CTA_clicked, etc.). */
export async function trackEvent(eventName: string, payload: Record<string, unknown> = {}): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("analytics_events").insert({
    user_id: user.id,
    event_name: eventName,
    payload: payload as Json,
  });
}

export type AnalyticsEventSummaryItem = { event_name: string; count: number };

/** Count by event_name for last 7 days (for Insights page). */
export async function getAnalyticsEventsSummaryLast7(): Promise<AnalyticsEventSummaryItem[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const since = new Date();
  since.setDate(since.getDate() - 7);
  const sinceStr = since.toISOString();
  const { data: rows } = await supabase
    .from("analytics_events")
    .select("event_name")
    .eq("user_id", user.id)
    .gte("created_at", sinceStr);
  const byName = new Map<string, number>();
  for (const row of rows ?? []) {
    const name = (row as { event_name: string }).event_name ?? "unknown";
    byName.set(name, (byName.get(name) ?? 0) + 1);
  }
  return Array.from(byName.entries())
    .map(([event_name, count]) => ({ event_name, count }))
    .sort((a, b) => b.count - a.count);
}
