import type { SupabaseClient } from "@supabase/supabase-js";
import { sendPushToUser } from "@/lib/push";
import { todayDateString } from "@/lib/utils/timezone";

/** YYYY-MM-DD embedded in dashboard-synced inbox tags, if any. */
function embeddedDateInDashboardPushTag(pushTag: string | null): string | null {
  if (!pushTag) return null;
  const unified = pushTag.match(/^hq-inbox-unified-(\d{4}-\d{2}-\d{2})-/);
  if (unified) return unified[1];
  const streak = pushTag.match(/^hq-inbox-streak-(\d{4}-\d{2}-\d{2})$/);
  if (streak) return streak[1];
  const burnout = pushTag.match(/^hq-inbox-burnout-(\d{4}-\d{2}-\d{2})$/);
  if (burnout) return burnout[1];
  return null;
}

type PendingRow = {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  link_path: string | null;
  push_tag: string | null;
  severity: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDb = { from: (t: string) => any };

/**
 * Sends push for alerts that were created but not yet delivered (e.g. immediate send failed).
 * Called from hourly cron with service/admin client. Respects normal sendPushToUser caps.
 */
export async function dispatchPendingUserAlertPushes(supabase: SupabaseClient): Promise<number> {
  const db = supabase as unknown as AnyDb;
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const { data: rows, error } = await db
    .from("user_alerts")
    .select("id, user_id, title, body, link_path, push_tag, severity")
    .is("push_sent_at", null)
    .is("read_at", null)
    .gte("created_at", since)
    .order("created_at", { ascending: true })
    .limit(80);

  if (error || !rows?.length) return 0;

  const appToday = todayDateString();
  let sent = 0;
  for (const raw of rows as PendingRow[]) {
    const embedded = embeddedDateInDashboardPushTag(raw.push_tag);
    if (embedded && embedded < appToday) {
      const now = new Date().toISOString();
      await db.from("user_alerts").update({ read_at: now, push_sent_at: now }).eq("id", raw.id);
      continue;
    }

    const { data: prefRow } = await supabase
      .from("user_preferences")
      .select("push_reminders_enabled")
      .eq("user_id", raw.user_id)
      .maybeSingle();
    if ((prefRow as { push_reminders_enabled?: boolean } | null)?.push_reminders_enabled === false) {
      continue;
    }

    const claimedAt = new Date().toISOString();
    const { data: claimed } = await db
      .from("user_alerts")
      .update({ push_sent_at: claimedAt })
      .eq("id", raw.id)
      .is("push_sent_at", null)
      .select("id")
      .maybeSingle();
    if (!claimed) {
      continue;
    }

    const path = raw.link_path?.trim() || "/dashboard";
    const url = path.startsWith("/") ? path : `/${path}`;
    const ok = await sendPushToUser(supabase, raw.user_id, {
      title: raw.title,
      body: raw.body ?? undefined,
      url,
      tag: raw.push_tag ?? `hq-alert-${raw.id}`,
      priority: raw.severity === "urgent" ? "high" : "normal",
    });
    if (ok) {
      sent++;
    } else {
      await db.from("user_alerts").update({ push_sent_at: null }).eq("id", raw.id);
    }
  }
  return sent;
}
