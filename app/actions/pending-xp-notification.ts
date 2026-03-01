"use server";

import { createClient } from "@/lib/supabase/server";

export type PendingXpSource = { label: string; xp: number };

export type PendingXpNotification = {
  totalXp: number;
  sources: PendingXpSource[];
  forDate: string;
};

/** Returns pending XP summary to show once on next load (e.g. after automatic XP). Cleared after read. */
export async function getAndClearPendingXpNotification(): Promise<PendingXpNotification | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("pending_xp_notifications")
      .select("total_xp, sources, for_date")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;

    const row = data as { total_xp: number; sources: unknown; for_date: string };
    const sources = Array.isArray(row.sources)
      ? (row.sources as { label?: string; xp?: number }[]).map((s) => ({
          label: s.label ?? "XP",
          xp: typeof s.xp === "number" ? s.xp : 0,
        }))
      : [];

    await supabase.from("pending_xp_notifications").delete().eq("user_id", user.id);

    return {
      totalXp: row.total_xp ?? 0,
      sources,
      forDate: row.for_date ?? "",
    };
  } catch {
    return null;
  }
}

/** Saves a pending XP summary to show once on next login (e.g. after automatic end-of-day XP). */
export async function savePendingXpNotification(notification: PendingXpNotification): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("pending_xp_notifications").insert({
      user_id: user.id,
      total_xp: notification.totalXp,
      sources: notification.sources,
      for_date: notification.forDate,
      created_at: new Date().toISOString(),
    });
  } catch {
    // Table may not exist yet
  }
}
