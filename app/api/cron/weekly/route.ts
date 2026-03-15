import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRealityReportForUser } from "@/lib/report";
import { getWeekBounds } from "@/lib/utils/learning";
import { sendPushToUser } from "@/lib/push";
import { applyPersonalityToPayload } from "@/lib/push-personality";
import type { PersonalityMode } from "@/lib/behavioral-notifications";
import { getLocalDateHour, isInQuietHours } from "@/lib/utils/timezone";
import { isHighSensoryDayForUser } from "@/lib/mode-admin";
import {
  isAppEmailConfigured,
  sendReminderToUser,
  wrapReminderHtml,
} from "@/lib/email";
import { buildWeeklyLearningPushPayload } from "@/lib/daily-email-content";

/**
 * Vercel Cron: runs weekly (e.g. Monday 09:00 UTC).
 * Generates reality report for the previous week and stores in reality_reports.
 * Sends learning reminder push to users who had < 60 min last week.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today = new Date();
  const lastWeek = new Date(today);
  lastWeek.setUTCDate(lastWeek.getUTCDate() - 7);
  const { start: weekStart, end: weekEnd } = getWeekBounds(lastWeek);

  const { data: users } = await supabase
    .from("users")
    .select("id, timezone, push_quiet_hours_start, push_quiet_hours_end");
  if (!users?.length) {
    return NextResponse.json({ ok: true, job: "weekly", reports: 0, learningReminderSent: 0 });
  }

  const prefsByUser = new Map<
    string,
    {
      emailRemindersEnabled: boolean;
      pushRemindersEnabled: boolean;
      pushWeeklyLearningEnabled: boolean;
      personalityMode: PersonalityMode;
    }
  >();
  const { data: prefs, error: prefsError } = await supabase
    .from("user_preferences")
    .select("user_id, email_reminders_enabled, push_reminders_enabled, push_weekly_learning_enabled, push_personality_mode");
  if (!prefsError && prefs?.length) {
    for (const pref of prefs) {
      const mode = (pref as { push_personality_mode?: PersonalityMode | null }).push_personality_mode ?? "auto";
      prefsByUser.set(pref.user_id, {
        emailRemindersEnabled: pref.email_reminders_enabled ?? true,
        pushRemindersEnabled: pref.push_reminders_enabled ?? true,
        pushWeeklyLearningEnabled: pref.push_weekly_learning_enabled ?? true,
        personalityMode: mode,
      });
    }
  }

  const in7Days = new Date(today);
  in7Days.setUTCDate(in7Days.getUTCDate() + 7);
  const in7Str = in7Days.toISOString().slice(0, 10);
  const todayStr = today.toISOString().slice(0, 10);

  let stored = 0;
  let learningReminderSent = 0;
  let learningReminderEmailSent = 0;
  let savingsAlertSent = 0;
  for (const { id: userId, timezone, push_quiet_hours_start, push_quiet_hours_end } of users) {
    const userPrefs = prefsByUser.get(userId) ?? {
      emailRemindersEnabled: true,
      pushRemindersEnabled: true,
      pushWeeklyLearningEnabled: true,
      personalityMode: "auto" as PersonalityMode,
    };
    try {
      const payload = await getRealityReportForUser(supabase, userId, weekStart, weekEnd);
      const { error } = await supabase.from("reality_reports").upsert(
        { user_id: userId, week_start: weekStart, week_end: weekEnd, payload },
        { onConflict: "user_id,week_start" }
      );
      if (!error) stored++;

      if (
        process.env.VAPID_PRIVATE_KEY &&
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
        payload.learningMinutes < payload.learningTarget &&
        userPrefs.pushRemindersEnabled &&
        userPrefs.pushWeeklyLearningEnabled
      ) {
        // HIGH_SENSORY: skip non-critical weekly learning push on high sensory days
        const local = timezone
          ? getLocalDateHour(timezone as string)
          : { date: todayStr, hour: today.getUTCHours() };
        const localDate = local.date;
        const quietStart = push_quiet_hours_start ? String(push_quiet_hours_start).slice(0, 5) : null;
        const quietEnd = push_quiet_hours_end ? String(push_quiet_hours_end).slice(0, 5) : null;
        const highSensory = await isHighSensoryDayForUser(supabase, userId, localDate);
        if (!highSensory && !isInQuietHours(local.hour, quietStart, quietEnd)) {
          try {
            const basePayload = buildWeeklyLearningPushPayload(payload.learningMinutes, payload.learningTarget);
            const pushPayload = applyPersonalityToPayload(basePayload, userPrefs.personalityMode, "weekly_learning");
            const ok = await sendPushToUser(supabase, userId, pushPayload);
            if (ok) learningReminderSent++;
          } catch {
            // skip
          }
          if (userPrefs.emailRemindersEnabled && isAppEmailConfigured()) {
            try {
              const body = `Last week you logged <strong>${payload.learningMinutes} min</strong> (target 60). Log some learning this week to stay on track.`;
              const sent = await sendReminderToUser(supabase, userId, {
                subject: "NEUROHQ — Learning reminder",
                html: wrapReminderHtml(body, "Learning reminder"),
              });
              if (sent) learningReminderEmailSent++;
            } catch {
              // skip
            }
          }
        }
      }

      const { data: goals } = await supabase
        .from("savings_goals")
        .select("name, target_cents, current_cents, deadline")
        .eq("user_id", userId)
        .not("deadline", "is", null)
        .gte("deadline", todayStr)
        .lte("deadline", in7Str);
      const dueSoon = (goals ?? []).filter((g) => (g.current_cents ?? 0) < (g.target_cents ?? 1));
      if (
        dueSoon.length > 0 &&
        process.env.VAPID_PRIVATE_KEY &&
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      ) {
        // HIGH_SENSORY: skip non-critical savings alert on high sensory days
        const local = timezone
          ? getLocalDateHour(timezone as string)
          : { date: todayStr, hour: today.getUTCHours() };
        const localDate = local.date;
        const quietStart = push_quiet_hours_start ? String(push_quiet_hours_start).slice(0, 5) : null;
        const quietEnd = push_quiet_hours_end ? String(push_quiet_hours_end).slice(0, 5) : null;
        const highSensory = await isHighSensoryDayForUser(supabase, userId, localDate);
        if (!highSensory && !isInQuietHours(local.hour, quietStart, quietEnd)) {
          const g = dueSoon[0];
          const pct = Math.round(((g.current_cents ?? 0) / (g.target_cents || 1)) * 100);
          const daysLeft = g.deadline ? Math.ceil((new Date(g.deadline).getTime() - today.getTime()) / 86400000) : 0;
          try {
            const basePayload = {
              title: "NEUROHQ — Savings",
              body: `"${g.name}" due in ${daysLeft} day(s). You're at ${pct}%.`,
              tag: "savings-alert",
              url: "/budget",
              priority: "high" as const,
            };
            const pushPayload = applyPersonalityToPayload(basePayload, userPrefs.personalityMode, "savings_alert");
            const ok = await sendPushToUser(supabase, userId, pushPayload);
            if (ok) savingsAlertSent++;
          } catch {
            // skip
          }
        }
      }
    } catch {
      // skip user on error
    }
  }

  return NextResponse.json({
    ok: true,
    job: "weekly",
    weekStart,
    weekEnd,
    reports: stored,
    users: users.length,
    learningReminderSent,
    learningReminderEmailSent,
    savingsAlertSent,
  });
}
