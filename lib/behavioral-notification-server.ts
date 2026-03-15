import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserNotificationContext, AppModeForPush } from "@/lib/behavioral-notifications";
import type { TriggerType } from "@/lib/behavioral-notifications";
import { getModeFromState } from "@/lib/app-mode";
import { getWeekBounds } from "@/lib/utils/timezone";

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
 * When options.dateStr is provided, also loads rich context (daily_state, task/calendar count, mode, streak, weekly missions).
 */
export async function loadUserNotificationContextForUser(
  supabase: SupabaseClient,
  userId: string,
  options?: { dateStr?: string }
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

  const base: UserNotificationContext = {
    consistencyScore,
    personalityMode: personality,
  };

  const dateStr = options?.dateStr;
  if (!dateStr) return base;

  const [dailyState, taskCount, calendarCount, streakRow, weekMissions] = await Promise.all([
    supabase
      .from("daily_state")
      .select("energy, focus, sensory_load")
      .eq("user_id", userId)
      .eq("date", dateStr)
      .maybeSingle(),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("due_date", dateStr)
      .is("deleted_at", null),
    supabase
      .from("calendar_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("start_at", `${dateStr}T00:00:00`)
      .lte("start_at", `${dateStr}T23:59:59`),
    supabase
      .from("user_streak")
      .select("current_streak")
      .eq("user_id", userId)
      .maybeSingle(),
    (async () => {
      const now = new Date();
      const { start, end } = getWeekBounds(now);
      const { data: weekRows } = await supabase
        .from("user_analytics_daily")
        .select("missions_completed")
        .eq("user_id", userId)
        .gte("date", start)
        .lte("date", end);
      return (weekRows ?? []).reduce(
        (acc, r) => acc + ((r as { missions_completed?: number }).missions_completed ?? 0),
        0
      );
    })(),
  ]);

  const ds = dailyState.data as { energy?: number | null; focus?: number | null; sensory_load?: number | null } | null;
  const carryOver = await (async () => {
    const { data } = await supabase
      .from("tasks")
      .select("carry_over_count")
      .eq("user_id", userId)
      .eq("due_date", dateStr)
      .eq("completed", false);
    const max = Math.max(0, ...(data ?? []).map((r) => (r as { carry_over_count?: number }).carry_over_count ?? 0));
    return max;
  })();

  const mode: AppModeForPush = getModeFromState(ds, carryOver);
  const taskCountToday = taskCount.count ?? 0;
  const calendarEventCountToday = calendarCount.count ?? 0;
  const currentStreak = (streakRow.data as { current_streak?: number | null } | null)?.current_streak ?? 0;

  return {
    ...base,
    mode,
    energy: ds?.energy ?? null,
    focus: ds?.focus ?? null,
    sensory_load: ds?.sensory_load ?? null,
    taskCountToday,
    calendarEventCountToday,
    currentStreak,
    missionsCompletedThisWeek: weekMissions,
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

const REENGAGEMENT_TRIGGERS = [
  "inactivity_24h",
  "inactivity_3d",
  "inactivity_7d",
  "inactivity_14d",
] as const;

/** Count re-engagement (inactivity) pushes sent to this user in the last 7 days. Used for backoff (max 2/week). */
export async function getReengagementSendsInLast7Days(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("push_sends_log")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("trigger_type", [...REENGAGEMENT_TRIGGERS])
    .gte("sent_at", since);
  return count ?? 0;
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

