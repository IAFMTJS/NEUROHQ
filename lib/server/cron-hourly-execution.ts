import { createAdminClient } from "@/lib/supabase/admin";
import {
  loadCronUserPrefsBundle,
  type CronBundleUserRow,
  type CronUserPrefsBundle,
} from "@/lib/server/cron-user-prefs-bundle";
import { sendPushToUser } from "@/lib/push";
import {
  getLocalDateTimeParts,
  yesterdayDate,
  getDayOfYearFromDateString,
  isInQuietHours,
  utcStartOfLocalDayIso,
  todayDateString,
} from "@/lib/utils/timezone";
import { isHighSensoryDayForUser } from "@/lib/mode-admin";
import { getQuoteByDayNumber, prepareQuoteForPersonalityPush } from "@/lib/quotes";
import { getEveningEmailData, buildEveningPushPayload } from "@/lib/daily-email-content";
import {
  POSITIVE_ACHIEVEMENT_TRIGGERS,
  buildBehavioralNotificationForContext,
  type PersonalityMode,
} from "@/lib/behavioral-notifications";
import {
  canSendBehavioralNotification,
  loadUserNotificationContextForUser,
  markBehavioralNotificationSent,
} from "@/lib/behavioral-notification-server";
import { applyPersonalityToPayload } from "@/lib/push-personality";
import { PushCopyDedupe, parsePushCopyHistory } from "@/lib/push-copy-dedupe";
import {
  cleanupStaleDailyPushClaim,
  deleteDailyPushClaim,
  tryClaimDailyPushSend,
} from "@/lib/push-daily-claim";
import { purgeQuestUserProgressAfterDays } from "@/lib/quests/cleanup";
import { invalidateUserSnapshotMemoryCaches } from "@/lib/server/snapshot-memory-caches";
import {
  buildActivePlatformReminderPayload,
  getActivePlatformLaunchForReminder,
  notifyUsersPlatformLaunchStarted,
} from "@/lib/platform-launch-push";

/**
 * Hourly scheduler: on Vercel Hobby, invoke via GitHub Actions (`.github/workflows/cron-hourly.yml`), not `vercel.json`
 * (Hobby allows at most one run per day per cron path). The route is unchanged; only the trigger moves off Vercel.
 * All users are included; if `timezone` is null, local date/hour use UTC (quote, rollover, brain window, evening).
 * - 00:00 local: task rollover.
 * - From quote hour (default 08:00): daily quote push (catch-up same local day); 08:00: calendar heads-up for today.
 * - 20:00–23:59 local: evening push + achievement loop (no separate evening email).
 * - 08:00–12:59 local: brain-status missing push (first eligible hour ≥ 08, outside quiet hours, max once/day).
 *
 * Still invoked every UTC hour (GitHub Actions) so each timezone can hit local midnight for rollover.
 * When no user is in a “heavy job” local window, we skip rollover/quote/brain/evening work and only run
 * the sliding calendar reminder + pending user alerts — less CPU per invocation.
 *
 * Strategy/growth nudges: weekly pass (`/api/cron/weekly`), monthly pass (`/api/cron/monthly`), not hourly.
 */
const ALLOWED_FORCE_HOURS = [0, 8, 10, 11, 12, 20] as const;

/** Default local hour for daily quote push (08:00). */
const DEFAULT_QUOTE_HOUR = 8;

/** Earliest local hour for the “brain status not logged” push; quiet hours can defer it later the same day. */
const BRAIN_STATUS_REMINDER_MIN_LOCAL_HOUR = 8;
/** Latest local hour we still attempt that reminder (inclusive). Morning-only window. */
const BRAIN_STATUS_REMINDER_MAX_LOCAL_HOUR = 12;

/** Look for calendar events starting in the next 0–60 minutes so hourly cron can send one reminder per user. */
const CALENDAR_REMINDER_WINDOW_MINUTES = 60;
/** After this local hour, send one daily reminder for currently active event/game/quest. */
const PLATFORM_ACTIVE_REMINDER_MIN_LOCAL_HOUR = 10;

type HourlyUserRow = CronBundleUserRow;

function getQuoteHourForUser(u: HourlyUserRow): number {
  const quoteTimeStr = u.push_quote_time;
  if (quoteTimeStr && /^\d{1,2}:\d{2}/.test(quoteTimeStr)) {
    return parseInt(quoteTimeStr.slice(0, quoteTimeStr.indexOf(":")), 10);
  }
  return DEFAULT_QUOTE_HOUR;
}

/**
 * True if this user might need rollover / quote / brain / evening / morning calendar heads-up this run.
 * When false for every user, we only run the sliding calendar window + pending alerts (cheaper).
 * Conservative (does not query DB for “already sent today”) so we never skip needed work.
 */
function userNeedsFullHourlyCycle(
  u: HourlyUserRow,
  hour: number,
  todayStr: string,
  localMinute: number,
  userPrefs: {
    emailRemindersEnabled: boolean;
    pushRemindersEnabled: boolean;
    pushMorningEnabled: boolean;
    pushEveningEnabled: boolean;
  },
  quietStart: string | null,
  quietEnd: string | null
): boolean {
  if (hour === 0 && u.last_rollover_date !== todayStr) {
    return true;
  }

  const inQuiet = isInQuietHours(hour, quietStart, quietEnd, localMinute);
  const quoteHour = getQuoteHourForUser(u);
  const pushQuoteEnabled = u.push_quote_enabled !== false;
  const hasPushSub = !!(u as { push_subscription_json?: unknown }).push_subscription_json;
  const vapidOk = !!(process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);

  if (
    vapidOk &&
    userPrefs.pushRemindersEnabled &&
    pushQuoteEnabled &&
    hour >= quoteHour &&
    !inQuiet
  ) {
    return true;
  }

  if (
    vapidOk &&
    userPrefs.pushRemindersEnabled &&
    hasPushSub &&
    hour === DEFAULT_QUOTE_HOUR &&
    !inQuiet
  ) {
    return true;
  }

  if (
    vapidOk &&
    userPrefs.pushRemindersEnabled &&
    hour >= BRAIN_STATUS_REMINDER_MIN_LOCAL_HOUR &&
    hour <= BRAIN_STATUS_REMINDER_MAX_LOCAL_HOUR &&
    !inQuiet
  ) {
    return true;
  }

  if (
    vapidOk &&
    hour >= 20 &&
    hour <= 23 &&
    userPrefs.pushRemindersEnabled &&
    userPrefs.pushEveningEnabled &&
    !inQuiet
  ) {
    return true;
  }

  return false;
}

function getWeekStartUtc(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  const weekday = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - (weekday - 1));
  return d.toISOString().slice(0, 10);
}

function getDaysInMonthUtc(dateStr: string): number {
  const [year, month] = dateStr.split("-").map((part) => parseInt(part, 10));
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function daysAgoUtc(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

async function hasSentAchievementPushToday(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  timezone: string | null,
  todayStr: string
): Promise<boolean> {
  const sinceIso =
    timezone && timezone.trim() ? utcStartOfLocalDayIso(timezone, todayStr) : `${todayStr}T00:00:00.000Z`;
  const { count } = await supabase
    .from("push_sends_log")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("trigger_type", POSITIVE_ACHIEVEMENT_TRIGGERS)
    .gte("sent_at", sinceIso);
  return (count ?? 0) > 0;
}

async function hasSentTriggerToday(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  triggerType: string,
  timezone: string | null,
  localDate: string
): Promise<boolean> {
  const sinceIso =
    timezone && timezone.trim() ? utcStartOfLocalDayIso(timezone, localDate) : `${localDate}T00:00:00.000Z`;
  const { count } = await supabase
    .from("push_sends_log")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("trigger_type", triggerType)
    .gte("sent_at", sinceIso);
  return (count ?? 0) > 0;
}

async function getBrainStatusStreakDays(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  todayStr: string
): Promise<number> {
  const sinceStr = daysAgoUtc(todayStr, 29);
  const { data } = await supabase
    .from("user_analytics_daily")
    .select("date, brain_status_logged")
    .eq("user_id", userId)
    .gte("date", sinceStr)
    .lte("date", todayStr);
  const rows = (data ?? []) as { date: string; brain_status_logged?: boolean | null }[];
  const loggedDays = new Set(rows.filter((row) => row.brain_status_logged === true).map((row) => row.date));
  let streak = 0;
  for (let i = 0; i < 30; i++) {
    const dateKey = daysAgoUtc(todayStr, i);
    if (!loggedDays.has(dateKey)) break;
    streak++;
  }
  return streak;
}

async function getBudgetAchievementStats(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  todayStr: string
): Promise<{ underBudgetToday: boolean; daysUnderBudgetThisWeek: number }> {
  const weekStart = getWeekStartUtc(todayStr);
  const [{ data: budgetUser }, { data: expenseRows }] = await Promise.all([
    supabase
      .from("users")
      .select("monthly_budget_cents, monthly_savings_cents, budget_period")
      .eq("id", userId)
      .single(),
    supabase
      .from("budget_entries")
      .select("date, amount_cents")
      .eq("user_id", userId)
      .lt("amount_cents", 0)
      .gte("date", weekStart)
      .lte("date", todayStr),
  ]);

  const row = (budgetUser ?? {}) as {
    monthly_budget_cents?: number | null;
    monthly_savings_cents?: number | null;
    budget_period?: string | null;
  };
  const spendable =
    Math.max(0, (row.monthly_budget_cents ?? 0) - (row.monthly_savings_cents ?? 0));
  if (spendable <= 0) {
    return { underBudgetToday: false, daysUnderBudgetThisWeek: 0 };
  }

  const dailyCap =
    (row.budget_period === "weekly" ? spendable / 7 : spendable / Math.max(1, getDaysInMonthUtc(todayStr)));
  const totalsByDate = new Map<string, number>();
  for (const expense of (expenseRows ?? []) as { date: string; amount_cents: number }[]) {
    totalsByDate.set(expense.date, (totalsByDate.get(expense.date) ?? 0) + Math.abs(expense.amount_cents ?? 0));
  }

  const todaySpend = totalsByDate.get(todayStr) ?? 0;
  let daysUnderBudgetThisWeek = 0;
  for (const total of totalsByDate.values()) {
    if (total > 0 && total <= dailyCap) {
      daysUnderBudgetThisWeek++;
    }
  }

  return {
    underBudgetToday: todaySpend > 0 && todaySpend <= dailyCap,
    daysUnderBudgetThisWeek,
  };
}

async function getLearningAchievementStats(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  todayStr: string
): Promise<{
  todaySessionCount: number;
  todayMinutes: number;
  weekCompletionRatio: number;
  reflectionSubmittedThisWeek: boolean;
}> {
  const weekStart = getWeekStartUtc(todayStr);
  const [{ data: userRow }, { data: sessionRows }, { data: reflectionRow }] = await Promise.all([
    supabase
      .from("users")
      .select("weekly_learning_target_minutes")
      .eq("id", userId)
      .single(),
    supabase
      .from("learning_sessions")
      .select("date, minutes")
      .eq("user_id", userId)
      .gte("date", weekStart)
      .lte("date", todayStr),
    supabase
      .from("learning_reflections")
      .select("date")
      .eq("user_id", userId)
      .gte("date", weekStart)
      .lte("date", todayStr)
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const targetMinutes = Math.max(
    1,
    ((userRow as { weekly_learning_target_minutes?: number | null } | null)?.weekly_learning_target_minutes ?? 60)
  );
  const sessions = (sessionRows ?? []) as { date: string; minutes?: number | null }[];
  const todaySessions = sessions.filter((row) => row.date === todayStr);
  const weekMinutes = sessions.reduce((sum, row) => sum + (row.minutes ?? 0), 0);

  return {
    todaySessionCount: todaySessions.length,
    todayMinutes: todaySessions.reduce((sum, row) => sum + (row.minutes ?? 0), 0),
    weekCompletionRatio: weekMinutes / targetMinutes,
    reflectionSubmittedThisWeek: !!(reflectionRow as { date?: string } | null)?.date,
  };
}

export type RunHourlyCronInput = {
  supabase: ReturnType<typeof createAdminClient>;
  request: Request;
  /** When set, skips duplicate `users` + `user_preferences` reads (cron bundle). */
  prefetched: CronUserPrefsBundle | null;
};

/**
 * Hourly cron body (rollover, quotes, evening, calendar, achievements, …).
 * Auth must be validated by the route handler before calling.
 */
export async function runHourlyCronExecution(input: RunHourlyCronInput): Promise<Record<string, unknown>> {
  const { supabase, request, prefetched } = input;
  const url = new URL(request.url);
  const forceHourParam = url.searchParams.get("forceHour");
  const userIdParam = url.searchParams.get("userId");
  const userIdFilter = userIdParam ? String(userIdParam) : null;
  const forceHour: number | undefined =
    forceHourParam != null && ALLOWED_FORCE_HOURS.includes(Number(forceHourParam) as (typeof ALLOWED_FORCE_HOURS)[number])
      ? Number(forceHourParam)
      : undefined;

  let questProgressPurged = 0;
  try {
    questProgressPurged = await purgeQuestUserProgressAfterDays(supabase, 12);
  } catch (e) {
    console.error("hourly cron: quest progress purge failed", e);
  }

  let platformLaunchStartPushSent = 0;
  try {
    platformLaunchStartPushSent = await notifyUsersPlatformLaunchStarted(supabase, {
      userIdFilter,
      lookbackHours: 24,
    });
  } catch (e) {
    console.error("hourly cron: platform launch start push failed", e);
  }

  let users: CronBundleUserRow[];
  let prefsByUser: Map<
    string,
    {
      emailRemindersEnabled: boolean;
      pushRemindersEnabled: boolean;
      pushMorningEnabled: boolean;
      pushEveningEnabled: boolean;
      personalityMode: PersonalityMode;
    }
  >;
  let pushCopyHistoryByUser: Map<string, ReturnType<typeof parsePushCopyHistory>>;
  if (prefetched) {
    users = prefetched.users;
    prefsByUser = prefetched.prefsByUser;
    pushCopyHistoryByUser = prefetched.pushCopyHistoryByUser;
  } else {
    const b = await loadCronUserPrefsBundle(supabase, userIdFilter);
    users = b.users;
    prefsByUser = b.prefsByUser;
    pushCopyHistoryByUser = b.pushCopyHistoryByUser;
  }
  /** Aligns with `saveDailyState` / dashboard (`todayDateString`, Europe/Amsterdam). User-local `todayStr` can differ near timezone boundaries. */
  const appToday = todayDateString();

  let rolled = 0;
  let quoteSent = 0;
  let eveningPushSent = 0;
  let brainStatusRemindersSent = 0;
  let calendarReminderSent = 0;
  let achievementPushSent = 0;
  let platformActiveReminderSent = 0;
  const activePlatformLaunch = await getActivePlatformLaunchForReminder(supabase);

  /** Replaces a global pre-scan over all users (incompatible with paged user loads). */
  let anyUserFullCycle = false;

  for (const u of users ?? []) {
    const tzRaw = (u.timezone as string | null) ?? null;
    const tz = tzRaw && tzRaw.trim() ? tzRaw : null;
    const nowClock = new Date();
    const localNow = tz
      ? getLocalDateTimeParts(tz, nowClock)
      : { date: nowClock.toISOString().slice(0, 10), hour: nowClock.getUTCHours(), minute: nowClock.getUTCMinutes() };
    const { date: todayStr, hour: realHour } = localNow;
    const hour = forceHour !== undefined ? forceHour : realHour;
    const userPrefs = prefsByUser.get(u.id) ?? {
      emailRemindersEnabled: true,
      pushRemindersEnabled: true,
      pushMorningEnabled: true,
      pushEveningEnabled: true,
      personalityMode: "auto" as PersonalityMode,
    };
    const quietStart = u.push_quiet_hours_start ? String(u.push_quiet_hours_start).slice(0, 5) : null;
    const quietEnd = u.push_quiet_hours_end ? String(u.push_quiet_hours_end).slice(0, 5) : null;

    const pushDedupe = new PushCopyDedupe(todayStr, parsePushCopyHistory(pushCopyHistoryByUser.get(u.id)), 7);

    const userFull =
      forceHour !== undefined ||
      userIdFilter != null ||
      userNeedsFullHourlyCycle(
        u as HourlyUserRow,
        hour,
        todayStr,
        localNow.minute,
        userPrefs,
        quietStart,
        quietEnd
      );
    if (userFull) anyUserFullCycle = true;

    if (userFull) {
    if (hour === 0 && u.last_rollover_date !== todayStr) {
      const yesterdayStr = yesterdayDate(todayStr);
      const { data: tasks } = await supabase
        .from("tasks")
        .select("id, carry_over_count")
        .eq("user_id", u.id)
        .eq("due_date", yesterdayStr)
        .eq("completed", false);

      let movedForUser = 0;
      for (const t of tasks ?? []) {
        const { error } = await supabase
          .from("tasks")
          .update({
            due_date: todayStr,
            carry_over_count: (t.carry_over_count ?? 0) + 1,
          })
          .eq("id", t.id);
        if (!error) {
          rolled++;
          movedForUser++;
        }
      }

      await supabase
        .from("users")
        .update({ last_rollover_date: todayStr })
        .eq("id", u.id);

      if (movedForUser > 0) {
        invalidateUserSnapshotMemoryCaches(u.id);
      }
    }

    // Daily quote at 08:00 local (or user's push_quote_time hour if set)
    const quoteHour = getQuoteHourForUser(u as HourlyUserRow);

    // Catch-up rule: if cron/app was down at the intended hour, still send later the same
    // local day as soon as we notice (hour >= quoteHour), but never more than once per day.
    if (
      hour >= quoteHour &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      userPrefs.pushRemindersEnabled
    ) {
      const pushQuoteEnabled = (u as { push_quote_enabled?: boolean | null }).push_quote_enabled !== false;
      if (pushQuoteEnabled && !isInQuietHours(hour, quietStart, quietEnd, localNow.minute)) {
        // Deduplicate: already sent a daily quote today (in user's local day)?
        let quoteAlreadySent = false;
        try {
          const sinceIso = tz ? utcStartOfLocalDayIso(tz, todayStr) : `${todayStr}T00:00:00.000Z`;
          const { count: alreadySentCount } = await supabase
            .from("push_sends_log")
            .select("id", { count: "exact", head: true })
            .eq("user_id", u.id)
            .eq("trigger_type", "daily-quote")
            .gte("sent_at", sinceIso);
          quoteAlreadySent = (alreadySentCount ?? 0) > 0;
        } catch {
          quoteAlreadySent = false;
        }

        if (!quoteAlreadySent) {
          const highSensory = await isHighSensoryDayForUser(supabase, u.id, todayStr);
          if (!highSensory) {
            await cleanupStaleDailyPushClaim(supabase, u.id, "daily-quote", todayStr, tz);
            const quoteClaimed = await tryClaimDailyPushSend(supabase, u.id, "daily-quote", todayStr);
            if (quoteClaimed) {
              const dayOfYear = Math.max(1, Math.min(365, getDayOfYearFromDateString(todayStr)));
              const quoteRow = getQuoteByDayNumber(dayOfYear);
              const { quoteText, author, combinedBody } = prepareQuoteForPersonalityPush(quoteRow);
              try {
                const basePayload = {
                  title: "NEUROHQ",
                  body: combinedBody,
                  tag: "daily-quote",
                  url: "/dashboard",
                  priority: "low" as const,
                  quoteText,
                  quoteAuthor: author,
                };
                const payload = applyPersonalityToPayload(
                  basePayload,
                  userPrefs.personalityMode,
                  "quote",
                  `${u.id}:${todayStr}`,
                  { dedupe: pushDedupe }
                );
                const ok = await sendPushToUser(supabase, u.id, payload);
                if (ok) quoteSent++;
              } catch {
                // skip
              } finally {
                await deleteDailyPushClaim(supabase, u.id, "daily-quote", todayStr);
              }
            }
          }
        }
      }
    }

    // Morning calendar heads-up at 08:00 local: today's events
    if (
      hour === DEFAULT_QUOTE_HOUR &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      userPrefs.pushRemindersEnabled &&
      (u as { push_subscription_json?: unknown }).push_subscription_json &&
      !isInQuietHours(hour, quietStart, quietEnd, localNow.minute)
    ) {
      try {
        const { data: todayEvents } = await supabase
          .from("calendar_events")
          .select("id, title, start_at")
          .eq("user_id", u.id)
          .gte("start_at", `${todayStr}T00:00:00`)
          .lte("start_at", `${todayStr}T23:59:59`)
          .order("start_at", { ascending: true })
          .limit(5);
        if ((todayEvents ?? []).length > 0) {
          const titles = todayEvents!.map((e) => (e.title || "Event").trim()).filter(Boolean);
          const body =
            titles.length === 1
              ? `Heads up: ${titles[0]} today`
              : `Heads up: ${titles.length} events today — ${titles.slice(0, 2).join(", ")}${titles.length > 2 ? "…" : ""}`;
          const basePayload = {
            title: "NEUROHQ — Today",
            body,
            tag: "calendar-morning",
            url: "/tasks?tab=calendar",
            priority: "normal" as const,
          };
          const payload = applyPersonalityToPayload(
            basePayload,
            userPrefs.personalityMode,
            "calendar_morning",
            `${u.id}:${todayStr}`,
            { dedupe: pushDedupe }
          );
          const ok = await sendPushToUser(supabase, u.id, payload);
          if (ok) calendarReminderSent++;
        }
      } catch {
        // skip
      }
    }
    }

    // Calendar reminder: events starting in the next CALENDAR_REMINDER_WINDOW_MINUTES
    if (
      process.env.VAPID_PRIVATE_KEY &&
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      userPrefs.pushRemindersEnabled &&
      (u as { push_subscription_json?: unknown }).push_subscription_json &&
      !isInQuietHours(hour, quietStart, quietEnd, localNow.minute)
    ) {
      try {
        const now = new Date();
        const windowEnd = new Date(now.getTime() + CALENDAR_REMINDER_WINDOW_MINUTES * 60 * 1000);
        const { data: events } = await supabase
          .from("calendar_events")
          .select("id, title, start_at")
          .eq("user_id", u.id)
          .gte("start_at", now.toISOString())
          .lte("start_at", windowEnd.toISOString())
          .order("start_at", { ascending: true })
          .limit(3);
        if ((events ?? []).length > 0) {
          const first = events![0];
          const eventTitle = (first.title || "Calendar event").trim();
          const body =
            events!.length === 1
              ? `Starting soon: ${eventTitle}`
              : `${events!.length} events in the next hour — ${eventTitle}`;
          const basePayload = {
            title: "NEUROHQ — Calendar",
            body,
            tag: "calendar-reminder",
            url: "/tasks?tab=calendar",
            priority: "normal" as const,
          };
          const payload = applyPersonalityToPayload(
            basePayload,
            userPrefs.personalityMode,
            "calendar_reminder",
            `${u.id}:${todayStr}`,
            { dedupe: pushDedupe }
          );
          const ok = await sendPushToUser(supabase, u.id, payload);
          if (ok) calendarReminderSent++;
        }
      } catch {
        // skip
      }
    }

    if (
      activePlatformLaunch &&
      hour >= PLATFORM_ACTIVE_REMINDER_MIN_LOCAL_HOUR &&
      userPrefs.pushRemindersEnabled &&
      (u as { push_subscription_json?: unknown }).push_subscription_json &&
      !isInQuietHours(hour, quietStart, quietEnd, localNow.minute)
    ) {
      try {
        const alreadySentActiveReminder = await hasSentTriggerToday(
          supabase,
          u.id,
          "platform-active-reminder",
          tz,
          todayStr
        );
        if (!alreadySentActiveReminder) {
          const payload = buildActivePlatformReminderPayload(activePlatformLaunch);
          const ok = await sendPushToUser(supabase, u.id, payload);
          if (ok) platformActiveReminderSent++;
        }
      } catch {
        // skip
      }
    }

    if (userFull) {
    // Brain status reminder: not before 08:00 local; respect quiet hours (try again a later hour);
    // at most one `brain_status_reminder` push per local calendar day.
    if (
      hour >= BRAIN_STATUS_REMINDER_MIN_LOCAL_HOUR &&
      hour <= BRAIN_STATUS_REMINDER_MAX_LOCAL_HOUR &&
      userPrefs.pushRemindersEnabled &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      !isInQuietHours(hour, quietStart, quietEnd, localNow.minute)
    ) {
      const highSensory = await isHighSensoryDayForUser(supabase, u.id as string, todayStr);
      if (!highSensory) {
        try {
          const alreadySentBrainStatusReminder = await hasSentTriggerToday(
            supabase,
            u.id as string,
            "brain_status_reminder",
            tz,
            todayStr
          );
          if (!alreadySentBrainStatusReminder) {
            await cleanupStaleDailyPushClaim(
              supabase,
              u.id as string,
              "brain_status_reminder",
              todayStr,
              tz
            );
            const { data: dailyState } = await supabase
              .from("daily_state")
              .select("energy, focus")
              .eq("user_id", u.id as string)
              .eq("date", appToday)
              .maybeSingle();
            const brainStatusDone = !!(
              dailyState && (dailyState.energy != null || dailyState.focus != null)
            );
            if (!brainStatusDone) {
              const { canSend } = await canSendBehavioralNotification(
                supabase,
                u.id as string,
                "brain_status_reminder",
                new Date()
              );
              if (canSend) {
                const ctx = await loadUserNotificationContextForUser(supabase, u.id as string, {
                  dateStr: todayStr,
                  dailyStateDate: appToday,
                });
                const result = buildBehavioralNotificationForContext(ctx, {
                  type: "brain_status_missing",
                });
                if (result) {
                  const brainClaimed = await tryClaimDailyPushSend(
                    supabase,
                    u.id as string,
                    "brain_status_reminder",
                    todayStr
                  );
                  if (brainClaimed) {
                    try {
                      const ok = await sendPushToUser(supabase, u.id as string, result.payload);
                      if (ok) {
                        await markBehavioralNotificationSent(
                          supabase,
                          u.id as string,
                          "brain_status_reminder"
                        );
                        brainStatusRemindersSent++;
                      }
                    } finally {
                      await deleteDailyPushClaim(
                        supabase,
                        u.id as string,
                        "brain_status_reminder",
                        todayStr
                      );
                    }
                  }
                }
              }
            }
          }
        } catch {
          // skip
        }
      }
    }
    if (
      hour >= 20 &&
      hour <= 23 &&
      userPrefs.pushRemindersEnabled &&
      userPrefs.pushEveningEnabled &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      !isInQuietHours(hour, quietStart, quietEnd, localNow.minute)
    ) {
      const highSensory = await isHighSensoryDayForUser(supabase, u.id, todayStr);
      if (!highSensory) {
        try {
          const alreadySentEvening = await hasSentTriggerToday(supabase, u.id, "evening-reminder", tz, todayStr);
          if (!alreadySentEvening) {
            await cleanupStaleDailyPushClaim(supabase, u.id, "evening-reminder", todayStr, tz);
            const eveningClaimed = await tryClaimDailyPushSend(
              supabase,
              u.id,
              "evening-reminder",
              todayStr
            );
            if (eveningClaimed) {
              try {
                const data = await getEveningEmailData(supabase, u.id, todayStr, appToday);
                const basePayload = buildEveningPushPayload(data);
                const payload = applyPersonalityToPayload(
                  basePayload,
                  userPrefs.personalityMode,
                  "evening",
                  `${u.id}:${todayStr}`,
                  { dedupe: pushDedupe }
                );
                const sent = await sendPushToUser(supabase, u.id, payload);
                if (sent) eveningPushSent++;
              } finally {
                await deleteDailyPushClaim(supabase, u.id, "evening-reminder", todayStr);
              }
            }
          }
        } catch {
          // skip
        }

        try {
          const alreadySentAchievement = await hasSentAchievementPushToday(
            supabase,
            u.id,
            tz,
            todayStr
          );
          if (!alreadySentAchievement) {
            const ctx = await loadUserNotificationContextForUser(supabase, u.id, {
              dateStr: todayStr,
              dailyStateDate: appToday,
            });
            const [
              totalTasks,
              incompleteTasks,
              completedTasks,
              brainStatusStreakDays,
              budgetStats,
              learningStats,
              budgetDisciplineRows,
              recoveryTasks,
            ] = await Promise.all([
              supabase
                .from("tasks")
                .select("id", { count: "exact", head: true })
                .eq("user_id", u.id)
                .eq("due_date", todayStr)
                .is("deleted_at", null),
              supabase
                .from("tasks")
                .select("id", { count: "exact", head: true })
                .eq("user_id", u.id)
                .eq("due_date", todayStr)
                .eq("completed", false)
                .is("deleted_at", null),
              supabase
                .from("tasks")
                .select("id", { count: "exact", head: true })
                .eq("user_id", u.id)
                .eq("due_date", todayStr)
                .eq("completed", true)
                .is("deleted_at", null),
              getBrainStatusStreakDays(supabase, u.id, todayStr),
              getBudgetAchievementStats(supabase, u.id, todayStr),
              getLearningAchievementStats(supabase, u.id, todayStr),
              supabase
                .from("xp_events")
                .select("source_type")
                .eq("user_id", u.id)
                .gte("created_at", `${todayStr}T00:00:00Z`)
                .lt("created_at", `${todayStr}T23:59:59.999Z`),
              supabase
                .from("tasks")
                .select("id", { count: "exact", head: true })
                .eq("user_id", u.id)
                .eq("due_date", todayStr)
                .eq("completed", true)
                .eq("mission_intent", "recovery")
                .is("deleted_at", null),
            ]);

            const totalTasksCount = totalTasks.count ?? 0;
            const incompleteTasksCount = incompleteTasks.count ?? 0;
            const completedTasksCount = completedTasks.count ?? 0;
            const budgetDisciplineCount = ((budgetDisciplineRows.data ?? []) as { source_type?: string | null }[])
              .filter((row) => typeof row.source_type === "string" && row.source_type.startsWith("budget_discipline:"))
              .length;

            const candidateEvents = [
              totalTasksCount > 0 && incompleteTasksCount === 0
                ? { type: "daily_all_tasks_completed" as const }
                : null,
              budgetStats.underBudgetToday
                ? {
                    type: "under_budget" as const,
                    period: "today" as const,
                    daysUnderBudgetThisWeek: budgetStats.daysUnderBudgetThisWeek,
                  }
                : null,
              [7, 14, 30].includes(brainStatusStreakDays)
                ? { type: "brain_status_streak" as const, days: brainStatusStreakDays }
                : null,
              [3, 7, 14, 30].includes(ctx.currentStreak ?? 0)
                ? { type: "streak_growth" as const, newStreak: ctx.currentStreak ?? 0 }
                : null,
              learningStats.weekCompletionRatio >= 1
                ? { type: "learning_week_target_hit" as const, completionRatio: learningStats.weekCompletionRatio }
                : null,
              learningStats.reflectionSubmittedThisWeek
                ? { type: "reflection_submitted" as const }
                : null,
              budgetDisciplineCount > 0
                ? { type: "budget_discipline_day" as const }
                : null,
              (recoveryTasks.count ?? 0) > 0
                ? { type: "recovery_task_completed" as const }
                : null,
              completedTasksCount >= 3
                ? {
                    type: "mission_completed" as const,
                    missionsInWindow: completedTasksCount,
                    windowMinutes: 45,
                  }
                : null,
              completedTasksCount >= 1
                ? {
                    type: "daily_minimum_completed" as const,
                    completedCount: completedTasksCount,
                    suggestedCount: undefined,
                  }
                : null,
              learningStats.todaySessionCount > 0
                ? {
                    type: "learning_session_logged" as const,
                    minutes: learningStats.todayMinutes,
                  }
                : null,
              !budgetStats.underBudgetToday && budgetStats.daysUnderBudgetThisWeek >= 2
                ? {
                    type: "under_budget" as const,
                    period: "week" as const,
                    daysUnderBudgetThisWeek: budgetStats.daysUnderBudgetThisWeek,
                  }
                : null,
            ];

            for (const event of candidateEvents) {
              if (!event) continue;
              const result = buildBehavioralNotificationForContext(ctx, event);
              if (!result) continue;

              if (typeof event === "object" && event !== null && "type" in event && event.type === "brain_status_streak") {
                continue;
              }

              const { canSend } = await canSendBehavioralNotification(
                supabase,
                u.id,
                result.trigger,
                new Date()
              );
              if (!canSend) continue;

              const sent = await sendPushToUser(supabase, u.id, result.payload);
              if (!sent) continue;

              await markBehavioralNotificationSent(supabase, u.id, result.trigger);
              achievementPushSent++;
              break;
            }
          }
        } catch {
          // skip
        }
      }
    }
    }

    if (pushDedupe.dirty) {
      await supabase.from("user_preferences").update({ push_copy_history: pushDedupe.getHistory() }).eq("user_id", u.id);
    }
  }

  return {
    ok: true,
    job: "hourly",
    ...(forceHour !== undefined && { testRun: true, forceHour }),
    ...(userIdFilter && { userId: userIdFilter }),
    rolled,
    quoteSent,
    eveningPushSent,
    brainStatusRemindersSent,
    calendarReminderSent,
    platformActiveReminderSent,
    achievementPushSent,
    platformLaunchStartPushSent,
    questProgressPurged,
    usersChecked: users?.length ?? 0,
    runFullCycle: anyUserFullCycle || forceHour !== undefined || userIdFilter != null,
  };
}
