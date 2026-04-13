import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push";
import { getLocalDateHour, isInQuietHours } from "@/lib/utils/timezone";
import { isHighSensoryDayForUser } from "@/lib/mode-admin";
import { loadUserNotificationContextForUser } from "@/lib/behavioral-notification-server";
import { runDailyHobbyCommitmentDecay } from "@/app/actions/hobby-commitment-decay";
import { applyPersonalityToPayload } from "@/lib/push-personality";
import { evaluateAcceptanceRulesForUser } from "@/lib/acceptance-rules-evaluator";
import {
  runAnalyticsEventsRetention,
  runCompletedTasksRetention,
  runDailyStateRetentionForAllUsers,
  runHardPurgeCompletedTasksByDueDate,
  runHardPurgeSoftDeletedCompletedTasks,
  runPushSendsLogRetention,
  runUserActionsAuditRetention,
  runXpEventsRetention,
} from "@/lib/server/daily-state-retention";
import {
  fetchAllCronUsersForSelect,
  type CronBundleUserRow,
} from "@/lib/server/cron-user-prefs-bundle";

type AdminClient = ReturnType<typeof createAdminClient>;

export type RunDailyCronInput = {
  supabase: AdminClient;
  userIdFilter: string | null;
  /** When set (cron bundle), skips `users` list fetch — must include timezone + quiet hour columns. */
  prefetchedUsers: CronBundleUserRow[] | null;
};

/**
 * Daily job: avoidance push, hobby decay, acceptance rules, retention (see `/api/cron/daily` docstring).
 */
export async function runDailyCronExecution(input: RunDailyCronInput): Promise<Record<string, unknown>> {
  const { supabase, userIdFilter, prefetchedUsers } = input;
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const utcHour = today.getUTCHours();

  let users: CronBundleUserRow[];
  if (prefetchedUsers != null) {
    users = prefetchedUsers;
  } else {
    users = await fetchAllCronUsersForSelect(
      supabase,
      "id, timezone, push_quiet_hours_start, push_quiet_hours_end",
      userIdFilter
    );
  }

  const userMetaById = new Map(
    users.map((user) => [
      user.id,
      {
        timezone: user.timezone ?? null,
        quietStart: user.push_quiet_hours_start
          ? String(user.push_quiet_hours_start).slice(0, 5)
          : null,
        quietEnd: user.push_quiet_hours_end ? String(user.push_quiet_hours_end).slice(0, 5) : null,
      },
    ])
  );

  let avoidanceSent = 0;
  if (process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    for (const { id: uid } of users) {
      const meta = userMetaById.get(uid);
      const local = meta?.timezone ? getLocalDateHour(meta.timezone) : { date: todayStr, hour: utcHour };
      if (isInQuietHours(local.hour, meta?.quietStart ?? null, meta?.quietEnd ?? null)) continue;
      const { data: todaysIncomplete } = await supabase
        .from("tasks")
        .select("carry_over_count")
        .eq("user_id", uid)
        .eq("due_date", local.date)
        .eq("completed", false);
      const carriedOverTasksCount = (todaysIncomplete ?? []).filter(
        (t) => (t.carry_over_count ?? 0) > 0
      ).length;
      if (carriedOverTasksCount >= 3) {
        try {
          const ctx = await loadUserNotificationContextForUser(supabase, uid);
          const basePayload = {
            title: "NEUROHQ",
            body: `${carriedOverTasksCount} task(s) carried over. Pick one to focus on.`,
            tag: "avoidance-alert",
            url: "/dashboard",
            priority: "high" as const,
          };
          const payload = applyPersonalityToPayload(
            basePayload,
            ctx.personalityMode,
            "avoidance_alert",
            `${uid}:${local.date}`
          );
          const highSensory = await isHighSensoryDayForUser(supabase, uid, local.date);
          if (highSensory) continue;
          const ok = await sendPushToUser(supabase, uid, payload);
          if (ok) avoidanceSent++;
        } catch {
          // skip
        }
      }
    }
  }

  let hobbyDecayUsers = 0;
  try {
    const result = await runDailyHobbyCommitmentDecay();
    hobbyDecayUsers = result.usersUpdated;
  } catch {
    hobbyDecayUsers = 0;
  }

  let acceptanceRulesUsers = 0;
  let acceptanceGatesOpened = 0;
  try {
    for (const row of users) {
      acceptanceRulesUsers++;
      const r = await evaluateAcceptanceRulesForUser(supabase, row.id, todayStr);
      if (r.opened) acceptanceGatesOpened++;
    }
  } catch {
    acceptanceRulesUsers = 0;
    acceptanceGatesOpened = 0;
  }

  let retentionSnapshotted = 0;
  let retentionDeleted = 0;
  let retentionErrors: string[] = [];
  try {
    const r = await runDailyStateRetentionForAllUsers(supabase, { userId: userIdFilter });
    retentionSnapshotted = r.snapshotted;
    retentionDeleted = r.deleted;
    retentionErrors = r.errors;
  } catch (e) {
    retentionErrors = [e instanceof Error ? e.message : String(e)];
  }

  let tasksRetentionUpdated = 0;
  let tasksHardPurgedAfterSoft = 0;
  let tasksHardPurgedByDueDate = 0;
  try {
    const days = Number(process.env.DATA_RETENTION_COMPLETED_TASKS_DAYS ?? 0);
    if (days > 0) {
      const cutoff = new Date();
      cutoff.setUTCDate(cutoff.getUTCDate() - days);
      const cutoffStr = cutoff.toISOString().slice(0, 10);
      const tr = await runCompletedTasksRetention(supabase, cutoffStr);
      tasksRetentionUpdated = tr.updated;
    }
    const softDeletedGraceDays = Number(
      process.env.DATA_RETENTION_HARD_PURGE_SOFT_DELETED_AFTER_DAYS ?? 0
    );
    if (softDeletedGraceDays > 0) {
      const hp = await runHardPurgeSoftDeletedCompletedTasks(supabase, softDeletedGraceDays);
      tasksHardPurgedAfterSoft = hp.deleted;
    }
    const directHardDays = Number(process.env.DATA_RETENTION_DIRECT_HARD_PURGE_COMPLETED_DAYS ?? 0);
    if (directHardDays > 0) {
      const cutoff = new Date();
      cutoff.setUTCDate(cutoff.getUTCDate() - directHardDays);
      const cutoffStr = cutoff.toISOString().slice(0, 10);
      const hp2 = await runHardPurgeCompletedTasksByDueDate(supabase, cutoffStr);
      tasksHardPurgedByDueDate = hp2.deleted;
    }
  } catch {
    tasksRetentionUpdated = 0;
  }

  let xpEventsDeleted = 0;
  let analyticsEventsDeleted = 0;
  let userActionsAuditDeleted = 0;
  let pushSendsLogDeleted = 0;
  try {
    const raw = process.env.XP_EVENTS_RETENTION_DAYS;
    const parsed = raw === undefined || raw === "" ? 30 : Number(raw);
    const xpLedgerDays = Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 30;
    if (xpLedgerDays > 0) {
      const r = await runXpEventsRetention(supabase, xpLedgerDays);
      xpEventsDeleted = r.deleted;
    }

    const aeParsed =
      process.env.ANALYTICS_EVENTS_RETENTION_DAYS === undefined ||
      process.env.ANALYTICS_EVENTS_RETENTION_DAYS === ""
        ? 90
        : Number(process.env.ANALYTICS_EVENTS_RETENTION_DAYS);
    const aeDays = Number.isFinite(aeParsed) ? Math.max(0, Math.floor(aeParsed)) : 90;
    if (aeDays > 0) {
      const r = await runAnalyticsEventsRetention(supabase, aeDays);
      analyticsEventsDeleted = r.deleted;
    }

    const uaParsed =
      process.env.USER_ACTIONS_AUDIT_RETENTION_DAYS === undefined ||
      process.env.USER_ACTIONS_AUDIT_RETENTION_DAYS === ""
        ? 90
        : Number(process.env.USER_ACTIONS_AUDIT_RETENTION_DAYS);
    const uaDays = Number.isFinite(uaParsed) ? Math.max(0, Math.floor(uaParsed)) : 90;
    if (uaDays > 0) {
      const r = await runUserActionsAuditRetention(supabase, uaDays);
      userActionsAuditDeleted = r.deleted;
    }

    const psParsed =
      process.env.PUSH_SENDS_LOG_RETENTION_DAYS === undefined ||
      process.env.PUSH_SENDS_LOG_RETENTION_DAYS === ""
        ? 90
        : Number(process.env.PUSH_SENDS_LOG_RETENTION_DAYS);
    const psDays = Number.isFinite(psParsed) ? Math.max(0, Math.floor(psParsed)) : 90;
    if (psDays > 0) {
      const r = await runPushSendsLogRetention(supabase, psDays);
      pushSendsLogDeleted = r.deleted;
    }
  } catch {
    xpEventsDeleted = 0;
    analyticsEventsDeleted = 0;
    userActionsAuditDeleted = 0;
    pushSendsLogDeleted = 0;
  }

  return {
    ok: true,
    job: "daily",
    users: users.length,
    ...(userIdFilter && { userId: userIdFilter }),
    avoidanceSent,
    hobbyDecayUsers,
    acceptanceRulesUsers,
    acceptanceGatesOpened,
    retentionSnapshotted,
    retentionDeleted,
    ...(retentionErrors.length > 0 && { retentionErrors }),
    tasksRetentionUpdated,
    tasksHardPurgedAfterSoft,
    tasksHardPurgedByDueDate,
    xpEventsDeleted,
    analyticsEventsDeleted,
    userActionsAuditDeleted,
    pushSendsLogDeleted,
    date: todayStr,
  };
}
