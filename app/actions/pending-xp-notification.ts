"use server";

import { emitUserAlert } from "@/app/actions/alerts";
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
      .select("id, total_xp, sources, for_date")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;

    const row = data as { id: string; total_xp: number; sources: unknown; for_date: string };
    const sources = Array.isArray(row.sources)
      ? (row.sources as { label?: string; xp?: number }[]).map((s) => ({
          label: s.label ?? "XP",
          xp: typeof s.xp === "number" ? s.xp : 0,
        }))
      : [];

    const { error: delErr } = await supabase.from("pending_xp_notifications").delete().eq("id", row.id);
    if (delErr) {
      const { error: delAllErr } = await supabase.from("pending_xp_notifications").delete().eq("user_id", user.id);
      if (delAllErr) {
        console.error("[getAndClearPendingXpNotification] delete failed", delAllErr.message);
        return null;
      }
    }

    const totalXp = row.total_xp ?? 0;
    const forDate = row.for_date ?? "";
    if (totalXp > 0) {
      const lines = sources.length
        ? sources.map((s) => `${s.label}: +${s.xp} XP`).join(" · ")
        : `+${totalXp} XP`;
      const body =
        forDate.length > 0
          ? `${lines} — Totaal +${totalXp} XP`.slice(0, 2000)
          : `XP verdiend: ${lines} — Totaal +${totalXp} XP`.slice(0, 2000);
      const title =
        forDate.length > 0 ? `Verdiend (${forDate})` : "XP verdiend";
      const tag = `hq-pending-xp-${forDate || "unknown"}`;
      try {
        await emitUserAlert({
          title: title.slice(0, 200),
          body,
          severity: "info",
          linkPath: "/profile",
          sendPush: false,
          pushTag: tag.slice(0, 120),
        });
      } catch {
        // Bell is best-effort; toast still shows from return value
      }
    }

    return {
      totalXp,
      sources,
      forDate,
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
