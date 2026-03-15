import { NextResponse } from "next/server";
import { getDayOfYear } from "date-fns";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push";
import { getLocalDateHour, isInQuietHours } from "@/lib/utils/timezone";
import { isHighSensoryDayForUser } from "@/lib/mode-admin";
import { xpToNextLevel } from "@/lib/xp";
import { buildBehavioralNotificationForContext } from "@/lib/behavioral-notifications";
import {
  loadUserNotificationContextForUser,
  canSendBehavioralNotification,
  markBehavioralNotificationSent,
  getReengagementSendsInLast7Days,
} from "@/lib/behavioral-notification-server";
import { runDailyHobbyCommitmentDecay } from "@/app/actions/hobby-commitment-decay";
import { getQuoteByDayNumber } from "@/lib/quotes";
import { applyPersonalityToPayload } from "@/lib/push-personality";

/**
 * Vercel Cron: runs daily at 00:00 UTC.
 * - Task rollover + quote: only for users with no timezone (UTC users). Users with timezone get rollover/quote from hourly cron.
 * - Freeze reminder, avoidance alert: for all users.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  const todayStr = today.toISOString().slice(0, 10);

  const { data: usersUtc } = await supabase.from("users").select("id").is("timezone", null);
  const usersForRollover = usersUtc ?? [];

  let totalRolled = 0;
  for (const { id: userId } of usersForRollover) {
    const { data: tasks } = await supabase
      .from("tasks")
      .select("id, carry_over_count")
      .eq("user_id", userId)
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
      if (!error) totalRolled++;
    }
  }

  const { data: usersAll } = await supabase
    .from("users")
    .select("id, timezone, push_quiet_hours_start, push_quiet_hours_end");
  const users = usersAll ?? [];
  const userMetaById = new Map(
    users.map((user) => [
      user.id,
      {
        timezone: (user as { timezone?: string | null }).timezone ?? null,
        quietStart: (user as { push_quiet_hours_start?: string | null }).push_quiet_hours_start
          ? String((user as { push_quiet_hours_start?: string | null }).push_quiet_hours_start).slice(0, 5)
          : null,
        quietEnd: (user as { push_quiet_hours_end?: string | null }).push_quiet_hours_end
          ? String((user as { push_quiet_hours_end?: string | null }).push_quiet_hours_end).slice(0, 5)
          : null,
      },
    ])
  );
  const nowIso = today.toISOString();
  let pushSent = 0;
  let freezeReminderSent = 0;
  let avoidanceSent = 0;
  let reEngagementSent = 0;
  let streakGrowthSent = 0;
  let streakProtectionSent = 0;
  let highMomentumSent = 0;
  let hobbyDecayUsers = 0;
  if (process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    const dayOfYear = Math.max(1, Math.min(365, getDayOfYear(today)));
    const quoteRow = getQuoteByDayNumber(dayOfYear);
    const quoteText = quoteRow?.quote_text ?? "Your daily focus.";
    const utcHour = today.getUTCHours();
    const { data: pushUsers } = await supabase
      .from("users")
      .select("id, push_quiet_hours_start, push_quiet_hours_end")
      .is("timezone", null)
      .not("push_subscription_json", "is", null)
      .or("push_quote_enabled.is.null,push_quote_enabled.eq.true");

    for (const u of pushUsers ?? []) {
      const quietStart = u.push_quiet_hours_start ? String(u.push_quiet_hours_start).slice(0, 5) : null;
      const quietEnd = u.push_quiet_hours_end ? String(u.push_quiet_hours_end).slice(0, 5) : null;
      if (isInQuietHours(utcHour, quietStart, quietEnd)) continue;

      // HIGH_SENSORY: skip non-critical quote push on high sensory days
      const highSensory = await isHighSensoryDayForUser(supabase, u.id, todayStr);
      if (highSensory) continue;

      try {
        const ctx = await loadUserNotificationContextForUser(supabase, u.id);
        const quoteBody = quoteText.length > 120 ? quoteText.slice(0, 117) + "…" : quoteText;
        const basePayload = {
          title: "NEUROHQ",
          body: quoteBody,
          tag: "daily-quote",
          url: "/dashboard",
          priority: "low" as const,
        };
        const payload = applyPersonalityToPayload(basePayload, ctx.personalityMode, "quote");
        const ok = await sendPushToUser(supabase, u.id, payload);
        if (ok) pushSent++;
      } catch {
        // skip
      }
    }

    // 24h freeze reminder: entries where freeze_until <= now and reminder not sent
    const { data: readyEntries } = await supabase
      .from("budget_entries")
      .select("id, user_id, amount_cents, note")
      .not("freeze_until", "is", null)
      .lte("freeze_until", nowIso)
      .eq("freeze_reminder_sent", false);
    const byUser = new Map<string, { id: string; amount_cents: number; note: string | null }[]>();
    for (const e of readyEntries ?? []) {
      const list = byUser.get(e.user_id) ?? [];
      list.push({ id: e.id, amount_cents: e.amount_cents, note: e.note ?? null });
      byUser.set(e.user_id, list);
    }
    for (const [userId, entries] of byUser) {
      const meta = userMetaById.get(userId);
      const local = meta?.timezone ? getLocalDateHour(meta.timezone) : { date: todayStr, hour: utcHour };
      if (isInQuietHours(local.hour, meta?.quietStart ?? null, meta?.quietEnd ?? null)) continue;
      try {
        const ctx = await loadUserNotificationContextForUser(supabase, userId);
        const basePayload = {
          title: "NEUROHQ — Frozen purchase",
          body: entries.length === 1
            ? `"${entries[0].note || "Purchase"}" is ready. Confirm or cancel in Budget.`
            : `${entries.length} frozen purchase(s) ready to confirm or cancel.`,
          tag: "freeze-reminder",
          url: "/budget",
          priority: "high" as const,
        };
        const payload = applyPersonalityToPayload(basePayload, ctx.personalityMode, "freeze_reminder");
        const ok = await sendPushToUser(supabase, userId, payload);
        if (ok) {
          freezeReminderSent++;
          for (const e of entries) {
            await supabase.from("budget_entries").update({ freeze_reminder_sent: true }).eq("id", e.id);
          }
        }
      } catch {
        // skip
      }
    }

    // Avoidance alert: users with carry_over >= 3 on today's incomplete tasks
    for (const { id: uid } of users) {
      const meta = userMetaById.get(uid);
      const local = meta?.timezone ? getLocalDateHour(meta.timezone) : { date: todayStr, hour: utcHour };
      if (isInQuietHours(local.hour, meta?.quietStart ?? null, meta?.quietEnd ?? null)) continue;
      const { data: todaysIncomplete } = await supabase
        .from("tasks")
        .select("carry_over_count")
        .eq("user_id", uid)
        .eq("due_date", todayStr)
        .eq("completed", false);
      const maxCarry = Math.max(0, ...(todaysIncomplete ?? []).map((t) => t.carry_over_count ?? 0));
      if (maxCarry >= 3) {
        try {
          const ctx = await loadUserNotificationContextForUser(supabase, uid);
          const basePayload = {
            title: "NEUROHQ",
            body: `${maxCarry} task(s) carried over. Pick one to focus on.`,
            tag: "avoidance-alert",
            url: "/dashboard",
            priority: "high" as const,
          };
          const payload = applyPersonalityToPayload(basePayload, ctx.personalityMode, "avoidance_alert");
          const ok = await sendPushToUser(supabase, uid, payload);
          if (ok) avoidanceSent++;
        } catch {
          // skip
        }
      }
    }

    // Re-engagement / inactivity recovery: gedrag-gestuurd (Minimal Integrity / Recovery / dichtbij level‑up)
    const { data: streakRows } = await supabase
      .from("user_streak")
      .select("user_id, current_streak, longest_streak, last_completion_date");

    const { data: pushUserRows } = await supabase
      .from("users")
      .select("id")
      .not("push_subscription_json", "is", null);

    const pushSet = new Set((pushUserRows ?? []).map((r) => (r as { id: string }).id));

    const candidateIds = Array.from(
      new Set(
        (streakRows ?? [])
          .map((r) => (r as { user_id: string }).user_id)
          .filter((id) => pushSet.has(id))
      )
    );

    const xpByUser = new Map<string, number>();
    if (candidateIds.length > 0) {
      const { data: xpRows } = await supabase
        .from("user_xp")
        .select("user_id, total_xp")
        .in("user_id", candidateIds);
      for (const r of xpRows ?? []) {
        xpByUser.set(
          (r as { user_id: string }).user_id,
          ((r as { total_xp?: number | null }).total_xp ?? 0)
        );
      }
    }

    // Momentum / high productivity: missions_completed yesterday per user.
    const missionsByUser = new Map<string, number>();
    const { data: analyticsRows } = await supabase
      .from("user_analytics_daily")
      .select("user_id, missions_completed")
      .eq("date", yesterdayStr);
    for (const row of analyticsRows ?? []) {
      const uid = (row as { user_id: string }).user_id;
      const missions = (row as { missions_completed?: number | null }).missions_completed ?? 0;
      if (missions > 0) missionsByUser.set(uid, missions);
    }

    for (const row of streakRows ?? []) {
      const userId = (row as { user_id: string }).user_id;
      if (!pushSet.has(userId)) continue;
      const meta = userMetaById.get(userId);
      const local = meta?.timezone ? getLocalDateHour(meta.timezone) : { date: todayStr, hour: utcHour };
      if (isInQuietHours(local.hour, meta?.quietStart ?? null, meta?.quietEnd ?? null)) continue;

      const last = (row as { last_completion_date?: string | null }).last_completion_date;
      if (!last) continue;

      const lastDate = new Date(last);
      const daysInactive = Math.floor(
        (today.getTime() - lastDate.getTime()) / (24 * 60 * 60 * 1000)
      );

      const totalXp = xpByUser.get(userId) ?? 0;
      const xpGap = xpToNextLevel(totalXp);
      const currentStreak =
        (row as { current_streak?: number | null }).current_streak ?? 0;
      const longestStreak =
        (row as { longest_streak?: number | null }).longest_streak ?? 0;

      try {
        const ctx = await loadUserNotificationContextForUser(supabase, userId, { dateStr: todayStr });

        // 1) Inactivity / recovery window (re-engagement) — max 2 per week (backoff).
        if (daysInactive >= 1) {
          const reengagementSendsLast7d = await getReengagementSendsInLast7Days(supabase, userId);
          if (reengagementSendsLast7d >= 2) {
            // Skip this user's re-engagement this run.
          } else {
            const triggerKey: "inactivity_24h" | "inactivity_3d" | "inactivity_7d" | "inactivity_14d" =
              daysInactive >= 14
                ? "inactivity_14d"
                : daysInactive >= 7
                  ? "inactivity_7d"
                  : daysInactive >= 3
                    ? "inactivity_3d"
                    : "inactivity_24h";

            const { canSend } = await canSendBehavioralNotification(
              supabase,
              userId,
              triggerKey,
              today
            );
            if (canSend) {
              const reengage = buildBehavioralNotificationForContext(ctx, {
                type: "inactivity_window",
                daysInactive,
              });
              if (reengage) {
                const ok = await sendPushToUser(supabase, userId, reengage.payload);
                if (ok) {
                  await markBehavioralNotificationSent(supabase, userId, triggerKey);
                  reEngagementSent++;
                }
              }
            }
          }
        }

        // 2) Streak growth celebration (when current_streak reaches longest_streak)
        if (currentStreak > 0 && currentStreak >= longestStreak) {
          const { canSend } = await canSendBehavioralNotification(
            supabase,
            userId,
            "streak_growth",
            today
          );
          if (canSend) {
            const streakGrowth = buildBehavioralNotificationForContext(ctx, {
              type: "streak_growth",
              newStreak: currentStreak,
            });
            if (streakGrowth) {
              const ok = await sendPushToUser(supabase, userId, streakGrowth.payload);
              if (ok) {
                await markBehavioralNotificationSent(supabase, userId, "streak_growth");
                streakGrowthSent++;
              }
            }
          }
        }

        // 3) Streak protection: active streak + early inactivity window.
        if (currentStreak > 0 && daysInactive >= 1 && daysInactive <= 2) {
          const { canSend } = await canSendBehavioralNotification(
            supabase,
            userId,
            "streak_protection",
            today
          );
          if (canSend) {
            const protection = buildBehavioralNotificationForContext(ctx, {
              type: "streak_risk",
              currentStreak,
            });
            if (protection) {
              const ok = await sendPushToUser(supabase, userId, protection.payload);
              if (ok) {
                await markBehavioralNotificationSent(supabase, userId, "streak_protection");
                streakProtectionSent++;
              }
            }
          }
        }

        // 4) Momentum / high productivity: multiple missions completed yesterday.
        const missionsYesterday = missionsByUser.get(userId) ?? 0;
        if (missionsYesterday >= 3) {
          const { canSend } = await canSendBehavioralNotification(
            supabase,
            userId,
            "high_productivity",
            today
          );
          if (canSend) {
            const momentumEvent =
              missionsYesterday >= 5
                ? ({
                    type: "productivity_session",
                    actionsInWindow: missionsYesterday,
                    windowMinutes: 30,
                  } as const)
                : ({
                    type: "mission_completed",
                    missionsInWindow: missionsYesterday,
                    windowMinutes: 45,
                  } as const);
            const momentumResult = buildBehavioralNotificationForContext(ctx, momentumEvent);
            if (momentumResult) {
              const ok = await sendPushToUser(supabase, userId, momentumResult.payload);
              if (ok) {
                await markBehavioralNotificationSent(supabase, userId, "high_productivity");
                highMomentumSent++;
              }
            }
          }
        }
      } catch {
        // skip
      }
    }
  }

  try {
    const result = await runDailyHobbyCommitmentDecay();
    hobbyDecayUsers = result.usersUpdated;
  } catch {
    hobbyDecayUsers = 0;
  }

  return NextResponse.json({
    ok: true,
    job: "daily",
    rolled: totalRolled,
    usersUtc: usersForRollover.length,
    users: users.length,
    pushSent,
    freezeReminderSent,
    avoidanceSent,
    reEngagementSent,
    streakGrowthSent,
    streakProtectionSent,
    highMomentumSent,
    hobbyDecayUsers,
    from: yesterdayStr,
    to: todayStr,
  });
}
