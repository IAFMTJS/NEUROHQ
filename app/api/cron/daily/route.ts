import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push";
import { getLocalDateHour, isInQuietHours } from "@/lib/utils/timezone";
import { isHighSensoryDayForUser } from "@/lib/mode-admin";
import { loadUserNotificationContextForUser } from "@/lib/behavioral-notification-server";
import { runDailyHobbyCommitmentDecay } from "@/app/actions/hobby-commitment-decay";
import { applyPersonalityToPayload } from "@/lib/push-personality";
import { evaluateAcceptanceRulesForUser } from "@/lib/acceptance-rules-evaluator";
import { runReleaseNotesPush } from "@/lib/release-notes-push";

/**
 * Daily at 00:00 UTC (GitHub): avoidance push (high carry-over), hobby decay, acceptance rules, release notes.
 * Task rollover, daily quote, brain-status reminder, morning pushes, evening, and behavioral achievement-style
 * pushes run in /api/cron/hourly (all users, including no timezone = UTC clock).
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
  const todayStr = today.toISOString().slice(0, 10);
  const utcHour = today.getUTCHours();

  let usersAllQuery = supabase
    .from("users")
    .select("id, timezone, push_quiet_hours_start, push_quiet_hours_end");
  if (userIdFilter) usersAllQuery = usersAllQuery.eq("id", userIdFilter);
  const { data: usersAll } = await usersAllQuery;
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
    const { data: allUsersForRules } = await supabase.from("users").select("id");
    for (const row of allUsersForRules ?? []) {
      acceptanceRulesUsers++;
      const r = await evaluateAcceptanceRulesForUser(supabase, row.id as string, todayStr);
      if (r.opened) acceptanceGatesOpened++;
    }
  } catch {
    acceptanceRulesUsers = 0;
    acceptanceGatesOpened = 0;
  }

  let releaseNotesSent = 0;
  let releaseNotesSkip: string | null = null;
  try {
    const rr = await runReleaseNotesPush(supabase, { userIdFilter });
    releaseNotesSent = rr.sent;
    releaseNotesSkip = rr.skippedReason;
  } catch {
    releaseNotesSent = 0;
  }

  return NextResponse.json({
    ok: true,
    job: "daily",
    users: users.length,
    ...(userIdFilter && { userId: userIdFilter }),
    avoidanceSent,
    hobbyDecayUsers,
    acceptanceRulesUsers,
    acceptanceGatesOpened,
    releaseNotesSent,
    ...(releaseNotesSkip && { releaseNotesSkip }),
    date: todayStr,
  });
}
