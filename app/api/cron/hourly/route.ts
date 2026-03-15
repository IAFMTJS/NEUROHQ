import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push";
import { getLocalDateHour, yesterdayDate, getDayOfYearFromDateString, isInQuietHours } from "@/lib/utils/timezone";
import { isHighSensoryDayForUser } from "@/lib/mode-admin";
import { getQuoteByDayNumber } from "@/lib/quotes";
import { isAppEmailConfigured, sendReminderToUser } from "@/lib/email";
import {
  getMorningEmailData,
  buildMorningEmailHtml,
  buildMorningPushPayload,
  getEveningEmailData,
  buildEveningEmailHtml,
  buildEveningPushPayload,
} from "@/lib/daily-email-content";
import { buildBehavioralNotificationForContext } from "@/lib/behavioral-notifications";
import { loadUserNotificationContextForUser } from "@/lib/behavioral-notification-server";

/**
 * Vercel Cron: runs every hour.
 * For users with timezone set:
 * - 00:00 local: task rollover only.
 * - 08:00 local: daily quote push + morning calendar heads-up.
 * - 09:00 local: morning email (quote, brain state reminder, today’s tasks & calendar) if email_reminders_enabled.
 * - 20:00 local: evening email (check-in: tasks done, expenses logged, brain status) if email_reminders_enabled.
 * Users without timezone are handled by the daily cron (00:00 UTC).
 */
const ALLOWED_FORCE_HOURS = [0, 8, 9, 11, 20] as const;

/** Default local hour for daily quote push (08:00). */
const DEFAULT_QUOTE_HOUR = 8;

/** Look for calendar events starting in the next 0–60 minutes so hourly cron can send one reminder per user. */
const CALENDAR_REMINDER_WINDOW_MINUTES = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const forceHourParam = url.searchParams.get("forceHour");
  const forceHour: number | undefined =
    forceHourParam != null && ALLOWED_FORCE_HOURS.includes(Number(forceHourParam) as (typeof ALLOWED_FORCE_HOURS)[number])
      ? Number(forceHourParam)
      : undefined;

  const supabase = createAdminClient();
  const { data: users } = await supabase
    .from("users")
    .select("id, timezone, last_rollover_date, push_quiet_hours_start, push_quiet_hours_end, push_quote_enabled, push_quote_time, push_subscription_json")
    .not("timezone", "is", null);

  const prefsByUser = new Map<
    string,
    {
      emailRemindersEnabled: boolean;
      pushRemindersEnabled: boolean;
      pushMorningEnabled: boolean;
      pushEveningEnabled: boolean;
    }
  >();
  const { data: prefs, error: prefsError } = await supabase
    .from("user_preferences")
    .select("user_id, email_reminders_enabled, push_reminders_enabled, push_morning_enabled, push_evening_enabled");
  if (!prefsError && prefs?.length) {
    for (const pref of prefs) {
      prefsByUser.set(pref.user_id, {
        emailRemindersEnabled: pref.email_reminders_enabled ?? true,
        pushRemindersEnabled: pref.push_reminders_enabled ?? true,
        pushMorningEnabled: pref.push_morning_enabled ?? true,
        pushEveningEnabled: pref.push_evening_enabled ?? true,
      });
    }
  }

  let rolled = 0;
  let quoteSent = 0;
  let morningEmailSent = 0;
  let eveningEmailSent = 0;
  let morningPushSent = 0;
  let eveningPushSent = 0;
  let brainStatusRemindersSent = 0;
  let calendarReminderSent = 0;

  for (const u of users ?? []) {
    const tz = u.timezone as string;
    if (!tz) continue;
    const { date: todayStr, hour: realHour } = getLocalDateHour(tz);
    const hour = forceHour !== undefined ? forceHour : realHour;
    const userPrefs = prefsByUser.get(u.id) ?? {
      emailRemindersEnabled: true,
      pushRemindersEnabled: true,
      pushMorningEnabled: true,
      pushEveningEnabled: true,
    };
    const quietStart = u.push_quiet_hours_start ? String(u.push_quiet_hours_start).slice(0, 5) : null;
    const quietEnd = u.push_quiet_hours_end ? String(u.push_quiet_hours_end).slice(0, 5) : null;

    if (hour === 0 && u.last_rollover_date !== todayStr) {
      const yesterdayStr = yesterdayDate(todayStr);
      const { data: tasks } = await supabase
        .from("tasks")
        .select("id, carry_over_count")
        .eq("user_id", u.id)
        .eq("due_date", yesterdayStr)
        .eq("completed", false);

      for (const t of tasks ?? []) {
        const { error } = await supabase
          .from("tasks")
          .update({
            due_date: todayStr,
            carry_over_count: (t.carry_over_count ?? 0) + 1,
          })
          .eq("id", t.id);
        if (!error) rolled++;
      }

      await supabase
        .from("users")
        .update({ last_rollover_date: todayStr })
        .eq("id", u.id);
    }

    // Daily quote at 08:00 local (or user's push_quote_time hour if set)
    const quoteTimeStr = (u as { push_quote_time?: string | null }).push_quote_time;
    const quoteHour =
      quoteTimeStr && /^\d{1,2}:\d{2}/.test(quoteTimeStr)
        ? parseInt(quoteTimeStr.slice(0, quoteTimeStr.indexOf(":")), 10)
        : DEFAULT_QUOTE_HOUR;
    if (hour === quoteHour && process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && userPrefs.pushRemindersEnabled) {
      const pushQuoteEnabled = (u as { push_quote_enabled?: boolean | null }).push_quote_enabled !== false;
      if (pushQuoteEnabled && !isInQuietHours(hour, quietStart, quietEnd)) {
        const highSensory = await isHighSensoryDayForUser(supabase, u.id, todayStr);
        if (!highSensory) {
          const dayOfYear = Math.max(1, Math.min(365, getDayOfYearFromDateString(todayStr)));
          const quoteRow = getQuoteByDayNumber(dayOfYear);
          const quoteText = quoteRow?.quote_text ?? "Your daily focus.";
          try {
            const ok = await sendPushToUser(supabase, u.id, {
              title: "NEUROHQ",
              body: quoteText.length > 120 ? quoteText.slice(0, 117) + "…" : quoteText,
              tag: "daily-quote",
              url: "/dashboard",
              priority: "low",
            });
            if (ok) quoteSent++;
          } catch {
            // skip
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
      !isInQuietHours(hour, quietStart, quietEnd)
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
          const ok = await sendPushToUser(supabase, u.id, {
            title: "NEUROHQ — Today",
            body,
            tag: "calendar-morning",
            url: "/tasks?tab=calendar",
            priority: "normal",
          });
          if (ok) calendarReminderSent++;
        }
      } catch {
        // skip
      }
    }

    // Calendar reminder: events starting in the next CALENDAR_REMINDER_WINDOW_MINUTES
    if (
      process.env.VAPID_PRIVATE_KEY &&
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      userPrefs.pushRemindersEnabled &&
      (u as { push_subscription_json?: unknown }).push_subscription_json &&
      !isInQuietHours(hour, quietStart, quietEnd)
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
          const title = (first.title || "Calendar event").trim();
          const body =
            events!.length === 1
              ? `Starting soon: ${title}`
              : `${events!.length} events in the next hour — ${title}`;
          const ok = await sendPushToUser(supabase, u.id, {
            title: "NEUROHQ — Calendar",
            body,
            tag: "calendar-reminder",
            url: "/tasks?tab=calendar",
            priority: "normal",
          });
          if (ok) calendarReminderSent++;
        }
      } catch {
        // skip
      }
    }

    if (hour === 9 && userPrefs.emailRemindersEnabled && isAppEmailConfigured()) {
      const highSensory = await isHighSensoryDayForUser(supabase, u.id, todayStr);
      if (!highSensory) {
        try {
          const currentUserId = u.id;
          const data = await getMorningEmailData(supabase, currentUserId, todayStr);
          const html = buildMorningEmailHtml(data);
          const sent = await sendReminderToUser(supabase, currentUserId, {
            subject: "NEUROHQ — Good morning",
            html,
          });
          if (sent) morningEmailSent++;
        } catch {
          // skip
        }
      }
    }
    // Brain status reminder: if brain status not set by ~11:00 local time.
    if (
      hour === 11 &&
      userPrefs.pushRemindersEnabled &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      !isInQuietHours(hour, quietStart, quietEnd)
    ) {
      const highSensory = await isHighSensoryDayForUser(supabase, u.id as string, todayStr);
      if (!highSensory) {
        try {
          const { data: dailyState } = await supabase
            .from("daily_state")
            .select("energy, focus")
            .eq("user_id", u.id as string)
            .eq("date", todayStr)
            .maybeSingle();
          const brainStatusDone = !!(
            dailyState && (dailyState.energy != null || dailyState.focus != null)
          );
          if (!brainStatusDone) {
            const ctx = await loadUserNotificationContextForUser(supabase, u.id as string);
            const result = buildBehavioralNotificationForContext(ctx, {
              type: "brain_status_missing",
            });
            if (result) {
              const ok = await sendPushToUser(supabase, u.id as string, result.payload);
              if (ok) brainStatusRemindersSent++;
            }
          }
        } catch {
          // skip
        }
      }
    }
    if (
      hour === 9 &&
      userPrefs.pushRemindersEnabled &&
      userPrefs.pushMorningEnabled &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      !isInQuietHours(hour, quietStart, quietEnd)
    ) {
      const highSensory = await isHighSensoryDayForUser(supabase, u.id, todayStr);
      if (!highSensory) {
        try {
          const data = await getMorningEmailData(supabase, u.id, todayStr);
          const sent = await sendPushToUser(supabase, u.id, buildMorningPushPayload(data));
          if (sent) morningPushSent++;
        } catch {
          // skip
        }
      }
    }
    if (hour === 20 && userPrefs.emailRemindersEnabled && isAppEmailConfigured()) {
      const highSensory = await isHighSensoryDayForUser(supabase, u.id, todayStr);
      if (!highSensory) {
        try {
          const currentUserId = u.id;
          const data = await getEveningEmailData(supabase, currentUserId, todayStr);
          const html = buildEveningEmailHtml(data);
          const sent = await sendReminderToUser(supabase, currentUserId, {
            subject: "NEUROHQ — Evening check-in",
            html,
          });
          if (sent) eveningEmailSent++;
        } catch {
          // skip
        }
      }
    }
    if (
      hour === 20 &&
      userPrefs.pushRemindersEnabled &&
      userPrefs.pushEveningEnabled &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      !isInQuietHours(hour, quietStart, quietEnd)
    ) {
      const highSensory = await isHighSensoryDayForUser(supabase, u.id, todayStr);
      if (!highSensory) {
        try {
          const data = await getEveningEmailData(supabase, u.id, todayStr);
          const sent = await sendPushToUser(supabase, u.id, buildEveningPushPayload(data));
          if (sent) eveningPushSent++;
        } catch {
          // skip
        }
      }
    }
  }

  return NextResponse.json({
    ok: true,
    job: "hourly",
    ...(forceHour !== undefined && { testRun: true, forceHour }),
    rolled,
    quoteSent,
    morningEmailSent,
    eveningEmailSent,
    morningPushSent,
    eveningPushSent,
    brainStatusRemindersSent,
    calendarReminderSent,
    usersChecked: users?.length ?? 0,
  });
}
