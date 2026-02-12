import { NextResponse } from "next/server";
import { getDayOfYear } from "date-fns";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push";

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
  if (process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    const dayOfYear = Math.max(1, Math.min(365, getDayOfYear(today)));
    const { data: quoteRow } = await supabase.from("quotes").select("quote_text, author_name").eq("id", dayOfYear).single();
    const quoteText = quoteRow?.quote_text ?? "Your daily focus.";
    const { data: pushUsers } = await supabase
      .from("users")
      .select("id")
      .is("timezone", null)
      .not("push_subscription_json", "is", null)
      .or("push_quote_enabled.is.null,push_quote_enabled.eq.true");

    for (const { id: uid } of pushUsers ?? []) {
      try {
        const ok = await sendPushToUser(supabase, uid, {
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
    from: yesterdayStr,
    to: todayStr,
  });
}
