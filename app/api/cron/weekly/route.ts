import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRealityReportForUser } from "@/lib/report";
import { getWeekBounds } from "@/lib/utils/learning";
import { sendPushToUser } from "@/lib/push";
import { applyPersonalityToPayload } from "@/lib/push-personality";
import { PushCopyDedupe, parsePushCopyHistory } from "@/lib/push-copy-dedupe";
import type { PersonalityMode } from "@/lib/behavioral-notifications";
import { getLocalDateHour, isInQuietHours } from "@/lib/utils/timezone";
import { isHighSensoryDayForUser } from "@/lib/mode-admin";
import { runStrategyGrowthWeeklyCron } from "@/lib/strategy-growth-cron";

/**
 * Weekly (e.g. Monday 09:00 UTC): reality reports, savings alerts, growth-protocol + learning-idle nudges (web push).
 * Learning-under-target reminders run Thursday via `/api/cron/weekly-learning`. Strategy check-in / quarter / monthly tip: `/api/cron/monthly`.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const userIdParam = url.searchParams.get("userId");
  const userIdFilter = userIdParam ? String(userIdParam) : null;

  const supabase = createAdminClient();
  const today = new Date();
  const lastWeek = new Date(today);
  lastWeek.setUTCDate(lastWeek.getUTCDate() - 7);
  const { start: weekStart, end: weekEnd } = getWeekBounds(lastWeek);

  let usersQuery = supabase
    .from("users")
    .select("id, timezone, push_quiet_hours_start, push_quiet_hours_end");
  if (userIdFilter) usersQuery = usersQuery.eq("id", userIdFilter);
  const { data: users } = await usersQuery;
  if (!users?.length) {
    return NextResponse.json({ ok: true, job: "weekly", reports: 0, savingsAlertSent: 0 });
  }

  const prefsByUser = new Map<string, { personalityMode: PersonalityMode }>();
  const pushCopyHistoryByUser = new Map<string, ReturnType<typeof parsePushCopyHistory>>();
  const { data: prefs, error: prefsError } = await supabase
    .from("user_preferences")
    .select("user_id, push_personality_mode, push_copy_history");
  if (!prefsError && prefs?.length) {
    for (const pref of prefs) {
      const mode = (pref as { push_personality_mode?: PersonalityMode | null }).push_personality_mode ?? "auto";
      prefsByUser.set(pref.user_id, {
        personalityMode: mode,
      });
      pushCopyHistoryByUser.set(
        pref.user_id,
        parsePushCopyHistory((pref as { push_copy_history?: unknown }).push_copy_history)
      );
    }
  }

  const in7Days = new Date(today);
  in7Days.setUTCDate(in7Days.getUTCDate() + 7);
  const in7Str = in7Days.toISOString().slice(0, 10);
  const todayStr = today.toISOString().slice(0, 10);

  let stored = 0;
  let savingsAlertSent = 0;
  for (const { id: userId, timezone, push_quiet_hours_start, push_quiet_hours_end } of users) {
    const userPrefs = prefsByUser.get(userId) ?? {
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
      const { error } = await supabase.from("reality_reports").upsert(
        { user_id: userId, week_start: weekStart, week_end: weekEnd, payload },
        { onConflict: "user_id,week_start" }
      );
      if (!error) stored++;

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
            const pushPayload = applyPersonalityToPayload(
              basePayload,
              userPrefs.personalityMode,
              "savings_alert",
              `${userId}:${localDate}`,
              { dedupe: pushDedupe }
            );
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

    if (pushDedupe.dirty) {
      await supabase.from("user_preferences").update({ push_copy_history: pushDedupe.getHistory() }).eq("user_id", userId);
    }
  }

  let strategyGrowthSent = 0;
  let strategyGrowthSkipped = 0;
  let strategyGrowthUsers = 0;
  if (process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    try {
      const sg = await runStrategyGrowthWeeklyCron(supabase, { userIdFilter });
      strategyGrowthSent = sg.sent;
      strategyGrowthSkipped = sg.skipped;
      strategyGrowthUsers = sg.users;
    } catch {
      // non-fatal
    }
  }

  return NextResponse.json({
    ok: true,
    job: "weekly",
    weekStart,
    weekEnd,
    reports: stored,
    users: users.length,
    savingsAlertSent,
    strategyGrowthSent,
    strategyGrowthSkipped,
    strategyGrowthUsers,
    ...(userIdFilter && { userId: userIdFilter }),
  });
}
