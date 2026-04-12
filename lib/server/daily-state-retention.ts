/**
 * Data retention helpers (cron).
 *
 * Tasks — verkleinen van Supabase-data:
 * 1) DATA_RETENTION_COMPLETED_TASKS_DAYS — soft-delete (deleted_at) op voltooide taken met due_date ouder dan N dagen.
 * 2) DATA_RETENTION_HARD_PURGE_SOFT_DELETED_AFTER_DAYS — permanente DELETE van voltooide taken die al soft-deleted zijn
 *    en waarvan deleted_at minstens N dagen geleden is (cascade o.a. task_events).
 * 3) DATA_RETENTION_DIRECT_HARD_PURGE_COMPLETED_DAYS — permanente DELETE van alle voltooide taken met due_date ouder dan N dagen,
 *    ook zonder soft-delete (agressief; combineer niet lichtvaardig met (2)).
 *
 * XP-ledger (xp_events):
 * - XP_EVENTS_RETENTION_DAYS — verwijder events ouder dan N dagen (default 30). Totaal staat in user_xp.total_xp.
 *   Zet op 0 om uit te zetten.
 *
 * Analytics / audit (created_at):
 * - ANALYTICS_EVENTS_RETENTION_DAYS — verwijder analytics_events ouder dan N dagen (default 90; 0 = uit).
 * - USER_ACTIONS_AUDIT_RETENTION_DAYS — verwijder user_actions_audit ouder dan N dagen (default 90; 0 = uit).
 *
 * Push sends (sent_at):
 * - PUSH_SENDS_LOG_RETENTION_DAYS — verwijder push_sends_log ouder dan N dagen (default 90; 0 = uit).
 *   Niet korter dan ~31 dagen aanbevolen: badge/unread-logica telt tot 30 dagen terug als er geen click is.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { getLocalDateHour } from "@/lib/utils/timezone";
import {
  computeBrainCompositePctFromDailyState,
  type DailyStateSnapshotRow,
} from "@/lib/user-analytics-brain-snapshot";

type AdminClient = SupabaseClient;

async function snapshotStaleDailyStateForUser(
  supabase: AdminClient,
  userId: string,
  localToday: string
): Promise<{ snapshotted: number; deleted: number }> {
  const { data: stale, error: selErr } = await supabase
    .from("daily_state")
    .select(
      "user_id, date, energy, focus, sensory_load, mental_battery, physical_health, load, sleep_hours, is_rest_day, emotional_state, dcic_overdrive_trigger_reason"
    )
    .eq("user_id", userId)
    .lt("date", localToday);

  if (selErr) throw selErr;
  if (!stale?.length) return { snapshotted: 0, deleted: 0 };

  for (const raw of stale) {
    const row = raw as DailyStateSnapshotRow;
    const { data: existing } = await supabase
      .from("user_analytics_daily")
      .select(
        "xp_earned, missions_completed, active_seconds, carry_over_count, tasks_completed, tasks_planned, learning_minutes, session_count, total_session_time_seconds, brain_status_logged, dcic_overdrive_weekly_slot"
      )
      .eq("user_id", userId)
      .eq("date", row.date)
      .maybeSingle();

    const ex = existing as Record<string, number | boolean | null | undefined> | null;
    const brainPct = computeBrainCompositePctFromDailyState(row);

    const { error: upErr } = await supabase.from("user_analytics_daily").upsert(
      {
        user_id: userId,
        date: row.date,
        energy_avg: row.energy ?? null,
        focus_avg: row.focus ?? null,
        sensory_load_avg: row.sensory_load ?? null,
        mental_battery_avg: row.mental_battery ?? null,
        physical_health_avg: row.physical_health ?? null,
        load_avg: row.load != null ? Number(row.load) : null,
        sleep_hours_avg: row.sleep_hours != null ? Number(row.sleep_hours) : null,
        is_rest_day: row.is_rest_day ?? null,
        emotional_state: row.emotional_state ?? null,
        brain_composite_pct: brainPct,
        brain_status_logged: !!(row.energy != null) || !!ex?.brain_status_logged,
        dcic_overdrive_weekly_slot:
          (raw as { dcic_overdrive_trigger_reason?: string | null }).dcic_overdrive_trigger_reason ===
            "weekly_slot" || ex?.dcic_overdrive_weekly_slot === true,
        xp_earned: (ex?.xp_earned as number) ?? 0,
        missions_completed: (ex?.missions_completed as number) ?? 0,
        active_seconds: (ex?.active_seconds as number) ?? 0,
        carry_over_count: (ex?.carry_over_count as number) ?? 0,
        tasks_completed: (ex?.tasks_completed as number) ?? 0,
        tasks_planned: (ex?.tasks_planned as number) ?? 0,
        learning_minutes: (ex?.learning_minutes as number) ?? 0,
        session_count: (ex?.session_count as number) ?? 0,
        total_session_time_seconds: (ex?.total_session_time_seconds as number) ?? 0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,date" }
    );
    if (upErr) throw upErr;
  }

  const { error: delErr } = await supabase
    .from("daily_state")
    .delete()
    .eq("user_id", userId)
    .lt("date", localToday);

  if (delErr) throw delErr;

  return { snapshotted: stale.length, deleted: stale.length };
}

/**
 * Keeps only daily_state for the user's current local calendar day; older rows are
 * snapshotted into user_analytics_daily then removed.
 */
export async function runDailyStateRetentionForAllUsers(
  supabase: AdminClient,
  options?: { userId?: string | null }
): Promise<{ users: number; snapshotted: number; deleted: number; errors: string[] }> {
  let q = supabase.from("users").select("id, timezone");
  if (options?.userId) q = q.eq("id", options.userId);
  const { data: users, error } = await q;
  if (error) throw error;

  let snapshotted = 0;
  let deleted = 0;
  const errors: string[] = [];

  for (const u of users ?? []) {
    const uid = (u as { id: string }).id;
    const tz = (u as { timezone?: string | null }).timezone ?? "UTC";
    try {
      const { date: localToday } = getLocalDateHour(tz);
      const r = await snapshotStaleDailyStateForUser(supabase, uid, localToday);
      snapshotted += r.snapshotted;
      deleted += r.deleted;
    } catch (e) {
      errors.push(`${uid}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { users: users?.length ?? 0, snapshotted, deleted, errors };
}

/**
 * Soft-delete completed tasks with due_date before cutoff (YYYY-MM-DD). Optional env-driven retention.
 */
export async function runCompletedTasksRetention(
  supabase: AdminClient,
  cutoffDate: string
): Promise<{ updated: number }> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("tasks")
    .update({ deleted_at: now })
    .eq("completed", true)
    .is("deleted_at", null)
    .lt("due_date", cutoffDate)
    .select("id");
  if (error) throw error;
  return { updated: data?.length ?? 0 };
}

/**
 * Permanently delete completed tasks that were soft-deleted at least `graceDays` ago.
 * CASCADE removes related task_events (and other ON DELETE CASCADE children).
 */
export async function runHardPurgeSoftDeletedCompletedTasks(
  supabase: AdminClient,
  graceDays: number
): Promise<{ deleted: number }> {
  if (graceDays < 1) return { deleted: 0 };
  const cutoffMs = Date.now() - graceDays * 86400000;
  const cutoffIso = new Date(cutoffMs).toISOString();
  const { data, error } = await supabase
    .from("tasks")
    .delete()
    .eq("completed", true)
    .not("deleted_at", "is", null)
    .lt("deleted_at", cutoffIso)
    .select("id");
  if (error) throw error;
  return { deleted: data?.length ?? 0 };
}

/**
 * Permanently delete completed tasks with due_date strictly before cutoff, regardless of soft-delete.
 * Aggressive: use only if you accept losing rows without a soft-delete grace period.
 */
export async function runHardPurgeCompletedTasksByDueDate(
  supabase: AdminClient,
  cutoffDate: string
): Promise<{ deleted: number }> {
  const { data, error } = await supabase
    .from("tasks")
    .delete()
    .eq("completed", true)
    .lt("due_date", cutoffDate)
    .select("id");
  if (error) throw error;
  return { deleted: data?.length ?? 0 };
}

/**
 * Drop xp_events older than retentionDays (by created_at). user_xp.total_xp is unchanged.
 */
export async function runXpEventsRetention(
  supabase: AdminClient,
  retentionDays: number
): Promise<{ deleted: number }> {
  if (retentionDays < 1) return { deleted: 0 };
  const cutoffIso = new Date(Date.now() - retentionDays * 86400000).toISOString();
  const { count, error: countErr } = await supabase
    .from("xp_events")
    .select("id", { count: "exact", head: true })
    .lt("created_at", cutoffIso);
  if (countErr) throw countErr;
  const n = count ?? 0;
  if (n === 0) return { deleted: 0 };
  const { error: delErr } = await supabase.from("xp_events").delete().lt("created_at", cutoffIso);
  if (delErr) throw delErr;
  return { deleted: n };
}

async function deleteRowsOlderThanCreatedAt(
  supabase: AdminClient,
  table: "analytics_events" | "user_actions_audit",
  retentionDays: number
): Promise<{ deleted: number }> {
  if (retentionDays < 1) return { deleted: 0 };
  const cutoffIso = new Date(Date.now() - retentionDays * 86400000).toISOString();
  const { count, error: countErr } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .lt("created_at", cutoffIso);
  if (countErr) throw countErr;
  const n = count ?? 0;
  if (n === 0) return { deleted: 0 };
  const { error: delErr } = await supabase.from(table).delete().lt("created_at", cutoffIso);
  if (delErr) throw delErr;
  return { deleted: n };
}

/** Funnel / client analytics events — TTL op created_at. */
export async function runAnalyticsEventsRetention(
  supabase: AdminClient,
  retentionDays: number
): Promise<{ deleted: number }> {
  return deleteRowsOlderThanCreatedAt(supabase, "analytics_events", retentionDays);
}

/** User action audit log — TTL op created_at. */
export async function runUserActionsAuditRetention(
  supabase: AdminClient,
  retentionDays: number
): Promise<{ deleted: number }> {
  return deleteRowsOlderThanCreatedAt(supabase, "user_actions_audit", retentionDays);
}

/** push_sends_log uses sent_at (not created_at). */
export async function runPushSendsLogRetention(
  supabase: AdminClient,
  retentionDays: number
): Promise<{ deleted: number }> {
  if (retentionDays < 1) return { deleted: 0 };
  const cutoffIso = new Date(Date.now() - retentionDays * 86400000).toISOString();
  const { count, error: countErr } = await supabase
    .from("push_sends_log")
    .select("id", { count: "exact", head: true })
    .lt("sent_at", cutoffIso);
  if (countErr) throw countErr;
  const n = count ?? 0;
  if (n === 0) return { deleted: 0 };
  const { error: delErr } = await supabase.from("push_sends_log").delete().lt("sent_at", cutoffIso);
  if (delErr) throw delErr;
  return { deleted: n };
}
