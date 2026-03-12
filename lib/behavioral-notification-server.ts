import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserNotificationContext } from "@/lib/behavioral-notifications";
import type { TriggerType } from "@/lib/behavioral-notifications";

type ConsistencyRow = {
  date: string;
  missions_completed?: number | null;
};

async function computeConsistencyScore(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 14);
  const sinceStr = since.toISOString().slice(0, 10);

  const { data } = await supabase
    .from("user_analytics_daily")
    .select("date, missions_completed")
    .eq("user_id", userId)
    .gte("date", sinceStr);

  const rows = (data ?? []) as ConsistencyRow[];
  if (!rows.length) return 0;

  let sum = 0;
  for (const r of rows) {
    const missions = r.missions_completed ?? 0;
    sum += missions > 0 ? 100 : 0;
  }
  const avg = sum / rows.length;
  return Math.max(0, Math.min(100, Math.round(avg)));
}

/**
 * Server-side helper for cron/admin: load UserNotificationContext for a given user id.
 */
export async function loadUserNotificationContextForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<UserNotificationContext> {
  const { data: prefs } = await supabase
    .from("user_preferences")
    .select("push_personality_mode")
    .eq("user_id", userId)
    .maybeSingle();

  const personality =
    (prefs as { push_personality_mode?: UserNotificationContext["personalityMode"] | null } | null)
      ?.push_personality_mode ?? "auto";

  const consistencyScore = await computeConsistencyScore(supabase, userId);

  return {
    consistencyScore,
    personalityMode: personality,
  };
}

type NotificationLogRow = {
  id: string;
  user_id: string;
  trigger_type: string;
  last_sent_at: string;
  ignored_count: number;
};

const TRIGGER_COOLDOWN_HOURS: Partial<Record<TriggerType, number>> = {
  inactivity_24h: 12,
  inactivity_3d: 24,
  inactivity_7d: 24,
  inactivity_14d: 24,
  streak_protection: 12,
  streak_growth: 24,
  brain_status_reminder: 6,
};

/**
 * Check per-trigger cooldown + escalation state for a given user/trigger.
 * Returns whether we can send now, and the current ignored_count.
 */
export async function canSendBehavioralNotification(
  supabase: SupabaseClient,
  userId: string,
  trigger: TriggerType,
  now: Date
): Promise<{ canSend: boolean; ignoredCount: number; logRow: NotificationLogRow | null }> {
  const { data } = await supabase
    .from("behavioral_notifications")
    .select("*")
    .eq("user_id", userId)
    .eq("trigger_type", trigger)
    .maybeSingle();

  if (!data) {
    return { canSend: true, ignoredCount: 0, logRow: null };
  }

  const row = data as NotificationLogRow;
  const cooldownHours = TRIGGER_COOLDOWN_HOURS[trigger] ?? 6;
  const last = new Date(row.last_sent_at);
  const diffMs = now.getTime() - last.getTime();
  const diffHours = diffMs / (60 * 60 * 1000);

  if (diffHours < cooldownHours) {
    return { canSend: false, ignoredCount: row.ignored_count, logRow: row };
  }

  return { canSend: true, ignoredCount: row.ignored_count, logRow: row };
}

/**
 * Persist that we sent (or reset) a behavioural notification.
 * - On send: increment ignored_count.
 * - On reset (e.g. user action): set ignored_count = 0.
 */
export async function markBehavioralNotificationSent(
  supabase: SupabaseClient,
  userId: string,
  trigger: TriggerType,
  opts: { resetIgnored?: boolean } = {}
): Promise<void> {
  const nowIso = new Date().toISOString();
  const { data } = await supabase
    .from("behavioral_notifications")
    .select("*")
    .eq("user_id", userId)
    .eq("trigger_type", trigger)
    .maybeSingle();

  const row = data as NotificationLogRow | null;
  const nextIgnored =
    opts.resetIgnored === true ? 0 : ((row?.ignored_count ?? 0) + 1);

  await supabase
    .from("behavioral_notifications")
    .upsert(
      {
        id: row?.id,
        user_id: userId,
        trigger_type: trigger,
        last_sent_at: nowIso,
        ignored_count: nextIgnored,
        updated_at: nowIso,
      },
      { onConflict: "user_id,trigger_type" }
    );
}

