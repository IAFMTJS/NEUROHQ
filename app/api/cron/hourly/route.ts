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
  getEveningEmailData,
  buildEveningEmailHtml,
} from "@/lib/daily-email-content";

/**
 * Vercel Cron: runs every hour.
 * For users with timezone set:
 * - 00:00 local: task rollover + daily quote push.
 * - 09:00 local: morning email (quote, brain state reminder, today’s tasks & calendar) if email_reminders_enabled.
 * - 20:00 local: evening email (check-in: tasks done, expenses logged, brain status) if email_reminders_enabled.
 * Users without timezone are handled by the daily cron (00:00 UTC).
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: users } = await supabase
    .from("users")
    .select("id, timezone, last_rollover_date, push_quiet_hours_start, push_quiet_hours_end")
    .not("timezone", "is", null);

  let emailReminderUserIds = new Set<string>();
  const { data: prefs, error: prefsError } = await supabase
    .from("user_preferences")
    .select("user_id")
    .eq("email_reminders_enabled", true);
  if (!prefsError && prefs?.length) emailReminderUserIds = new Set(prefs.map((p) => p.user_id));

  let rolled = 0;
  let quoteSent = 0;
  let morningEmailSent = 0;
  let eveningEmailSent = 0;

  for (const u of users ?? []) {
    const tz = u.timezone as string;
    if (!tz) continue;
    const { date: todayStr, hour } = getLocalDateHour(tz);

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

      if (process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
        const quietStart = u.push_quiet_hours_start ? String(u.push_quiet_hours_start).slice(0, 5) : null;
        const quietEnd = u.push_quiet_hours_end ? String(u.push_quiet_hours_end).slice(0, 5) : null;
        if (!isInQuietHours(0, quietStart, quietEnd)) {
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
              });
              if (ok) quoteSent++;
            } catch {
              // skip
            }
          }
        }
      }
    }

    if (hour === 9 && emailReminderUserIds.has(u.id) && isAppEmailConfigured()) {
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
    if (hour === 20 && emailReminderUserIds.has(u.id) && isAppEmailConfigured()) {
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
  }

  return NextResponse.json({
    ok: true,
    job: "hourly",
    rolled,
    quoteSent,
    morningEmailSent,
    eveningEmailSent,
    usersChecked: users?.length ?? 0,
  });
}
