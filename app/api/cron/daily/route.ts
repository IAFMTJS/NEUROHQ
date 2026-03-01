import { NextResponse } from "next/server";
import { getDayOfYear } from "date-fns";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push";
import { isInQuietHours } from "@/lib/utils/timezone";
import { isHighSensoryDayForUser } from "@/lib/mode-admin";
import { xpToNextLevel } from "@/lib/xp";
import {
  getReEngagementPushPayload,
  pickReEngagementScenario,
  getReEngagementPushPayloadForScenario,
} from "@/lib/re-engagement-copy";
import { runDailyHobbyCommitmentDecay } from "@/app/actions/hobby-commitment-decay";
import { getQuoteByDayNumber } from "@/lib/quotes";

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

  const { data: usersAll } = await supabase.from("users").select("id");
  const users = usersAll ?? [];
  const nowIso = today.toISOString();
  let pushSent = 0;
  let freezeReminderSent = 0;
  let avoidanceSent = 0;
  let reEngagementSent = 0;
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
        const ok = await sendPushToUser(supabase, u.id, {
          title: "NEUROHQ",
          body: quoteText.length > 120 ? quoteText.slice(0, 117) + "…" : quoteText,
          tag: "daily-quote",
          url: "/dashboard",
        });
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
      try {
        const ok = await sendPushToUser(supabase, userId, {
          title: "NEUROHQ — Frozen purchase",
          body: entries.length === 1
            ? `"${entries[0].note || "Purchase"}" is ready. Confirm or cancel in Budget.`
            : `${entries.length} frozen purchase(s) ready to confirm or cancel.`,
          tag: "freeze-reminder",
          url: "/budget",
        });
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
      const { data: todaysIncomplete } = await supabase
        .from("tasks")
        .select("carry_over_count")
        .eq("user_id", uid)
        .eq("due_date", todayStr)
        .eq("completed", false);
      const maxCarry = Math.max(0, ...(todaysIncomplete ?? []).map((t) => t.carry_over_count ?? 0));
      if (maxCarry >= 3) {
        try {
          const ok = await sendPushToUser(supabase, uid, {
            title: "NEUROHQ",
            body: `${maxCarry} task(s) carried over. Pick one to focus on.`,
            tag: "avoidance-alert",
            url: "/dashboard",
          });
          if (ok) avoidanceSent++;
        } catch {
          // skip
        }
      }
    }

    // Re-engagement: gedrag-gestuurd (Minimal Integrity / Recovery / dichtbij level‑up)
    const { data: streakRows } = await supabase
      .from("user_streak")
      .select("user_id, current_streak, last_completion_date");

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

    for (const row of streakRows ?? []) {
      const userId = (row as { user_id: string }).user_id;
      if (!pushSet.has(userId)) continue;

      const last = (row as { last_completion_date?: string | null }).last_completion_date;
      if (!last) continue;

      const lastDate = new Date(last);
      const daysInactive = Math.floor(
        (today.getTime() - lastDate.getTime()) / (24 * 60 * 60 * 1000)
      );

      const totalXp = xpByUser.get(userId) ?? 0;
      const xpGap = xpToNextLevel(totalXp);
      const currentStreak =
        (row as { current_streak?: number | null }).current_streak ?? null;

      const scenario = pickReEngagementScenario({
        daysInactive,
        xpToNextLevel: xpGap,
        currentStreak,
      });

      if (!scenario) continue;

      try {
        const payload = getReEngagementPushPayloadForScenario(scenario, {
          daysInactive,
          xpToNextLevel: xpGap,
          currentStreak,
        });
        const ok = await sendPushToUser(supabase, userId, payload);
        if (ok) reEngagementSent++;
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
    hobbyDecayUsers,
    from: yesterdayStr,
    to: todayStr,
  });
}
