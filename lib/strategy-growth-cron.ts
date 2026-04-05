import type { SupabaseClient } from "@supabase/supabase-js";
import { sendPushToUser } from "@/lib/push";
import { getLocalDateHour, isInQuietHours } from "@/lib/utils/timezone";
import { isHighSensoryDayForUser } from "@/lib/mode-admin";
import {
  loadUserNotificationContextForUser,
  canSendBehavioralNotification,
  markBehavioralNotificationSent,
} from "@/lib/behavioral-notification-server";
import { buildBehavioralNotificationForContext } from "@/lib/behavioral-notifications";
import type { BehaviorEvent, TriggerType } from "@/lib/behavioral-notifications";
import { getCurrentQuarter, getDayIndexInCurrentQuarter } from "@/lib/utils/strategy";
import { quarterlyStrategyCompletionPercent } from "@/lib/strategy-completion";

export type StrategyGrowthCronResult = {
  sent: number;
  skipped: number;
  users: number;
};

/**
 * Weekly nudges: growth protocol unset, learning idle (users with web push).
 * Strategy check-in, quarter incomplete, and monthly tip run in {@link runStrategyGrowthMonthlyCron}.
 */
export async function runStrategyGrowthWeeklyCron(
  supabase: SupabaseClient,
  options: { userIdFilter?: string | null; now?: Date }
): Promise<StrategyGrowthCronResult> {
  return runStrategyGrowthCronInner(supabase, { ...options, segment: "weekly" });
}

/**
 * Monthly: strategy_monthly_tip (max once/calendar month), then strategy check-in, then quarter-incomplete nudge.
 */
export async function runStrategyGrowthMonthlyCron(
  supabase: SupabaseClient,
  options: { userIdFilter?: string | null; now?: Date }
): Promise<StrategyGrowthCronResult> {
  return runStrategyGrowthCronInner(supabase, { ...options, segment: "monthly" });
}

async function runStrategyGrowthCronInner(
  supabase: SupabaseClient,
  options: {
    userIdFilter?: string | null;
    now?: Date;
    segment: "weekly" | "monthly";
  }
): Promise<StrategyGrowthCronResult> {
  const now = options.now ?? new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const { year, quarter } = getCurrentQuarter();
  const userIdFilter = options.userIdFilter ?? null;

  let usersQuery = supabase
    .from("users")
    .select("id, timezone, push_quiet_hours_start, push_quiet_hours_end, created_at, push_subscription_json")
    .not("push_subscription_json", "is", null);
  if (userIdFilter) usersQuery = usersQuery.eq("id", userIdFilter);
  const { data: users } = await usersQuery;

  let sent = 0;
  let skipped = 0;

  for (const u of users ?? []) {
    const userId = u.id as string;
    const tz = (u as { timezone?: string | null }).timezone ?? null;
    const quietStart = (u as { push_quiet_hours_start?: string | null }).push_quiet_hours_start
      ? String((u as { push_quiet_hours_start?: string | null }).push_quiet_hours_start).slice(0, 5)
      : null;
    const quietEnd = (u as { push_quiet_hours_end?: string | null }).push_quiet_hours_end
      ? String((u as { push_quiet_hours_end?: string | null }).push_quiet_hours_end).slice(0, 5)
      : null;
    const local = tz ? getLocalDateHour(tz) : { date: todayStr, hour: now.getUTCHours() };
    const localDate = local.date;
    const hour = local.hour;

    if (isInQuietHours(hour, quietStart, quietEnd)) {
      skipped++;
      continue;
    }

    const { data: pref } = await supabase
      .from("user_preferences")
      .select("push_reminders_enabled, push_weekly_learning_enabled, growth_focus_protocol_slug")
      .eq("user_id", userId)
      .maybeSingle();
    const prefRow = pref as {
      push_reminders_enabled?: boolean;
      push_weekly_learning_enabled?: boolean;
      growth_focus_protocol_slug?: string | null;
    } | null;
    if (prefRow?.push_reminders_enabled === false) {
      skipped++;
      continue;
    }

    const highSensory = await isHighSensoryDayForUser(supabase, userId, localDate);
    if (highSensory) {
      skipped++;
      continue;
    }

    const createdAt = (u as { created_at: string }).created_at;
    const accountAgeDays = Math.floor((now.getTime() - new Date(createdAt).getTime()) / (24 * 60 * 60 * 1000));

    const pickEvent = async (): Promise<{ event: BehaviorEvent; trigger: TriggerType } | null> => {
      if (options.segment === "monthly") {
        const { data: checkRow } = await supabase
          .from("strategy_check_in")
          .select("checked_at")
          .eq("user_id", userId)
          .maybeSingle();
        const checkedAt = (checkRow as { checked_at?: string | null } | null)?.checked_at ?? null;
        const checkTier = classifyCheckIn(checkedAt, createdAt);

        const { data: qStrat } = await supabase
          .from("quarterly_strategy")
          .select(
            "one_word, primary_theme, identity_statement, key_results, north_star, anti_goals, savings_goal_id"
          )
          .eq("user_id", userId)
          .eq("year", year)
          .eq("quarter", quarter)
          .maybeSingle();
        const percentComplete = quarterlyStrategyCompletionPercent(
          qStrat as Parameters<typeof quarterlyStrategyCompletionPercent>[0]
        );
        const dayInQuarter = getDayIndexInCurrentQuarter(now);

        const sentMonth = await alreadySentThisCalendarMonth(supabase, userId, "strategy_monthly_tip", now);
        if (!sentMonth) {
          const { canSend } = await canSendBehavioralNotification(supabase, userId, "strategy_monthly_tip", now);
          if (canSend) {
            return {
              event: { type: "strategy_monthly_tip", month: now.getMonth() },
              trigger: "strategy_monthly_tip",
            };
          }
        }
        if (checkTier === "firm") {
          const { canSend } = await canSendBehavioralNotification(supabase, userId, "strategy_check_in_firm", now);
          if (canSend) {
            return {
              event: { type: "strategy_check_in_reminder", tier: "firm" },
              trigger: "strategy_check_in_firm",
            };
          }
        }
        if (checkTier === "soft") {
          const { canSend } = await canSendBehavioralNotification(supabase, userId, "strategy_check_in_soft", now);
          if (canSend) {
            return {
              event: { type: "strategy_check_in_reminder", tier: "soft" },
              trigger: "strategy_check_in_soft",
            };
          }
        }
        if (dayInQuarter > 14 && percentComplete < 100) {
          const { canSend } = await canSendBehavioralNotification(
            supabase,
            userId,
            "strategy_quarter_incomplete",
            now
          );
          if (canSend) {
            return {
              event: { type: "strategy_quarter_incomplete", percentComplete },
              trigger: "strategy_quarter_incomplete",
            };
          }
        }
        return null;
      }

      const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const { data: learnRows } = await supabase
        .from("user_analytics_daily")
        .select("learning_minutes")
        .eq("user_id", userId)
        .gte("date", tenDaysAgo);
      const learningSum = (learnRows ?? []).reduce(
        (acc, r) => acc + ((r as { learning_minutes?: number | null }).learning_minutes ?? 0),
        0
      );
      const growthSlug = prefRow?.growth_focus_protocol_slug?.trim() ?? null;
      const weeklyLearningOn = prefRow?.push_weekly_learning_enabled !== false;

      if (!growthSlug && accountAgeDays >= 7) {
        const { canSend } = await canSendBehavioralNotification(supabase, userId, "growth_focus_unset", now);
        if (canSend) {
          return { event: { type: "growth_focus_unset" }, trigger: "growth_focus_unset" };
        }
      }
      if (weeklyLearningOn && accountAgeDays >= 14 && learningSum === 0) {
        const { canSend } = await canSendBehavioralNotification(supabase, userId, "growth_learning_idle", now);
        if (canSend) {
          return { event: { type: "growth_learning_idle" }, trigger: "growth_learning_idle" };
        }
      }
      return null;
    };

    try {
      const picked = await pickEvent();
      if (!picked) {
        skipped++;
        continue;
      }
      const ctx = await loadUserNotificationContextForUser(supabase, userId, { dateStr: localDate });
      const built = buildBehavioralNotificationForContext(ctx, picked.event);
      if (!built) continue;
      const ok = await sendPushToUser(supabase, userId, built.payload);
      if (ok) {
        await markBehavioralNotificationSent(supabase, userId, picked.trigger);
        sent++;
      }
    } catch {
      skipped++;
    }
  }

  return {
    sent,
    skipped,
    users: users?.length ?? 0,
  };
}

function classifyCheckIn(checkedAt: string | null, createdAt: string): "soft" | "firm" | null {
  const t = Date.now();
  const accountAgeDays = Math.floor((t - new Date(createdAt).getTime()) / (24 * 60 * 60 * 1000));

  if (!checkedAt) {
    if (accountAgeDays >= 5) return "firm";
    if (accountAgeDays >= 3) return "soft";
    return null;
  }
  const days = Math.floor((t - new Date(checkedAt).getTime()) / (24 * 60 * 60 * 1000));
  if (days >= 5) return "firm";
  if (days >= 3) return "soft";
  return null;
}

async function alreadySentThisCalendarMonth(
  supabase: SupabaseClient,
  userId: string,
  trigger: TriggerType,
  now: Date
): Promise<boolean> {
  const { data } = await supabase
    .from("behavioral_notifications")
    .select("last_sent_at")
    .eq("user_id", userId)
    .eq("trigger_type", trigger)
    .maybeSingle();
  const last = (data as { last_sent_at?: string } | null)?.last_sent_at;
  if (!last) return false;
  const d = new Date(last);
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}
