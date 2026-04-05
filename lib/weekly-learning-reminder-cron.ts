import type { SupabaseClient } from "@supabase/supabase-js";
import { getRealityReportForUser } from "@/lib/report";
import { getWeekBounds } from "@/lib/utils/learning";
import { sendPushToUser } from "@/lib/push";
import { applyPersonalityToPayload } from "@/lib/push-personality";
import { PushCopyDedupe, parsePushCopyHistory } from "@/lib/push-copy-dedupe";
import type { PersonalityMode } from "@/lib/behavioral-notifications";
import { getLocalDateHour, isInQuietHours } from "@/lib/utils/timezone";
import { isHighSensoryDayForUser } from "@/lib/mode-admin";
import { isAppEmailConfigured, sendReminderToUser, wrapReminderHtml } from "@/lib/email";
import { buildWeeklyLearningPushPayload } from "@/lib/daily-email-content";

function isLocalThursday(timezone: string | null, at: Date): boolean {
  const tz = timezone?.trim() ? timezone : "UTC";
  const long = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "long" }).format(at);
  return long === "Thursday";
}

export type WeeklyLearningReminderResult = {
  learningReminderSent: number;
  learningReminderEmailSent: number;
  users: number;
};

/**
 * Learning-under-target reminder (push + optional email). Runs only when `now` is Thursday
 * in the user’s timezone (or UTC if timezone is unset). Scheduled via `/api/cron/weekly-learning`.
 */
export async function runWeeklyLearningReminderPass(
  supabase: SupabaseClient,
  options: { userIdFilter?: string | null; now?: Date }
): Promise<WeeklyLearningReminderResult> {
  const now = options.now ?? new Date();
  const userIdFilter = options.userIdFilter ?? null;

  let usersQuery = supabase
    .from("users")
    .select("id, timezone, push_quiet_hours_start, push_quiet_hours_end");
  if (userIdFilter) usersQuery = usersQuery.eq("id", userIdFilter);
  const { data: users } = await usersQuery;
  if (!users?.length) {
    return { learningReminderSent: 0, learningReminderEmailSent: 0, users: 0 };
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
  const pushCopyHistoryByUser = new Map<string, ReturnType<typeof parsePushCopyHistory>>();
  const { data: prefs, error: prefsError } = await supabase
    .from("user_preferences")
    .select(
      "user_id, email_reminders_enabled, push_reminders_enabled, push_weekly_learning_enabled, push_personality_mode, push_copy_history"
    );
  if (!prefsError && prefs?.length) {
    for (const pref of prefs) {
      const mode = (pref as { push_personality_mode?: PersonalityMode | null }).push_personality_mode ?? "auto";
      prefsByUser.set(pref.user_id, {
        emailRemindersEnabled: pref.email_reminders_enabled ?? true,
        pushRemindersEnabled: pref.push_reminders_enabled ?? true,
        pushWeeklyLearningEnabled: pref.push_weekly_learning_enabled ?? true,
        personalityMode: mode,
      });
      pushCopyHistoryByUser.set(
        pref.user_id,
        parsePushCopyHistory((pref as { push_copy_history?: unknown }).push_copy_history)
      );
    }
  }

  const lastWeek = new Date(now);
  lastWeek.setUTCDate(lastWeek.getUTCDate() - 7);
  const { start: weekStart, end: weekEnd } = getWeekBounds(lastWeek);
  const todayStr = now.toISOString().slice(0, 10);

  let learningReminderSent = 0;
  let learningReminderEmailSent = 0;

  for (const { id: userId, timezone, push_quiet_hours_start, push_quiet_hours_end } of users) {
    if (!isLocalThursday(timezone as string | null, now)) continue;

    const userPrefs = prefsByUser.get(userId) ?? {
      emailRemindersEnabled: true,
      pushRemindersEnabled: true,
      pushWeeklyLearningEnabled: true,
      personalityMode: "auto" as PersonalityMode,
    };
    const localDateForDedupe =
      timezone && String(timezone).trim() ? getLocalDateHour(timezone as string).date : todayStr;
    const pushDedupe = new PushCopyDedupe(
      localDateForDedupe,
      parsePushCopyHistory(pushCopyHistoryByUser.get(userId)),
      7
    );

    try {
      const payload = await getRealityReportForUser(supabase, userId, weekStart, weekEnd);
      if (
        !(
          process.env.VAPID_PRIVATE_KEY &&
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
          payload.learningMinutes < payload.learningTarget &&
          userPrefs.pushRemindersEnabled &&
          userPrefs.pushWeeklyLearningEnabled
        )
      ) {
        if (pushDedupe.dirty) {
          await supabase
            .from("user_preferences")
            .update({ push_copy_history: pushDedupe.getHistory() })
            .eq("user_id", userId);
        }
        continue;
      }

      const local = timezone
        ? getLocalDateHour(timezone as string)
        : { date: todayStr, hour: now.getUTCHours() };
      const localDate = local.date;
      const quietStart = push_quiet_hours_start ? String(push_quiet_hours_start).slice(0, 5) : null;
      const quietEnd = push_quiet_hours_end ? String(push_quiet_hours_end).slice(0, 5) : null;
      const highSensory = await isHighSensoryDayForUser(supabase, userId, localDate);
      if (!highSensory && !isInQuietHours(local.hour, quietStart, quietEnd)) {
        try {
          const basePayload = buildWeeklyLearningPushPayload(payload.learningMinutes, payload.learningTarget);
          const pushPayload = applyPersonalityToPayload(
            basePayload,
            userPrefs.personalityMode,
            "weekly_learning",
            `${userId}:${localDate}`,
            { dedupe: pushDedupe }
          );
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
    } catch {
      // skip user
    }

    if (pushDedupe.dirty) {
      await supabase.from("user_preferences").update({ push_copy_history: pushDedupe.getHistory() }).eq("user_id", userId);
    }
  }

  return {
    learningReminderSent,
    learningReminderEmailSent,
    users: users.length,
  };
}
