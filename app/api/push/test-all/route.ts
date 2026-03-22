import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push";
import type { PushPayload } from "@/lib/push";
import { getQuoteByDayNumber } from "@/lib/quotes";
import { getDayOfYearFromDateString } from "@/lib/utils/timezone";
import { getLocalDateHour } from "@/lib/utils/timezone";
import {
  getMorningEmailData,
  getEveningEmailData,
  buildMorningPushPayload,
  buildEveningPushPayload,
  buildWeeklyLearningPushPayload,
} from "@/lib/daily-email-content";
import { buildBehavioralNotificationForContext } from "@/lib/behavioral-notifications";
import { loadUserNotificationContextForUser } from "@/lib/behavioral-notification-server";
import { applyPersonalityToPayload } from "@/lib/push-personality";

/**
 * Send a single push type to a test user (for manual/terminal testing).
 * Auth: Bearer CRON_SECRET. Optional ?userId= to target a specific user; otherwise first user with push subscription.
 * Usage: GET /api/push/test-all?type=daily-quote
 */
const PUSH_TYPES = [
  "daily-quote",
  "calendar-morning",
  "calendar-reminder",
  "morning-reminder",
  "evening-reminder",
  "brain-status-reminder",
  "weekly-learning",
  "savings-alert",
  "shutdown-reminder",
  "freeze-reminder",
  "avoidance-alert",
  "reengage",
  "streak-growth",
  "streak-protection",
  "momentum",
] as const;

export type PushTestType = (typeof PUSH_TYPES)[number];

function isPushTestType(s: string): s is PushTestType {
  return (PUSH_TYPES as readonly string[]).includes(s);
}

// Keep in sync with lib/push.ts (diagnostics only; sending still uses that source of truth).
const MAX_PUSH_PER_DAY = 40;
const MAX_PUSH_BEFORE_LOW_PRIORITY_BLOCK = 26;
const MAX_PUSH_PER_DAY_LOW_ENGAGEMENT = 30;

type PushLimitState = {
  countAfterReset: number;
  userToday: string;
  effectiveMax: number;
  blockedBy: "none" | "low_priority_fatigue" | "daily_cap";
};

async function getPushLimitState(
  supabase: ReturnType<typeof createAdminClient>,
  user: {
    id: string;
    push_sent_count: number | null;
    push_sent_date: string | null;
    timezone: string | null;
  },
  priority: "low" | "normal" | "high" | undefined
): Promise<PushLimitState> {
  const tz = user.timezone ?? null;
  const userToday = tz ? getLocalDateHour(tz).date : new Date().toISOString().slice(0, 10);

  let count = (user.push_sent_count ?? 0) as number;
  if ((user.push_sent_date as string | null) !== userToday) {
    count = 0;
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: clicksLast7d } = await (supabase as any)
    .from("push_engagement")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("event_type", "clicked")
    .gte("created_at", sevenDaysAgo);

  const effectiveMax = (clicksLast7d ?? 0) >= 1 ? MAX_PUSH_PER_DAY : MAX_PUSH_PER_DAY_LOW_ENGAGEMENT;

  if ((priority ?? "normal") === "low" && count >= MAX_PUSH_BEFORE_LOW_PRIORITY_BLOCK) {
    return {
      countAfterReset: count,
      userToday,
      effectiveMax,
      blockedBy: "low_priority_fatigue",
    };
  }
  if (count >= effectiveMax) {
    return {
      countAfterReset: count,
      userToday,
      effectiveMax,
      blockedBy: "daily_cap",
    };
  }

  return {
    countAfterReset: count,
    userToday,
    effectiveMax,
    blockedBy: "none",
  };
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return NextResponse.json(
      { error: "VAPID keys not configured. Run npm run generate-vapid." },
      { status: 500 }
    );
  }

  const url = new URL(request.url);
  const typeParam = url.searchParams.get("type");
  const userIdParam = url.searchParams.get("userId");

  if (!typeParam) {
    return NextResponse.json({ types: [...PUSH_TYPES], usage: "GET ?type=<one of types>" });
  }
  if (typeParam === "list") {
    return NextResponse.json({ types: [...PUSH_TYPES] });
  }
  if (!isPushTestType(typeParam)) {
    return NextResponse.json(
      {
        error: "Invalid 'type' query param.",
        allowedTypes: [...PUSH_TYPES],
      },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  let userId: string;
  let userRecord: {
    id: string;
    push_sent_count: number | null;
    push_sent_date: string | null;
    timezone: string | null;
  } | null = null;

  if (userIdParam) {
    const { data: user } = await supabase
      .from("users")
      .select("id, push_subscription_json, push_sent_count, push_sent_date, timezone")
      .eq("id", userIdParam)
      .single();
    if (!user?.push_subscription_json) {
      return NextResponse.json(
        { error: "User not found or has no push subscription." },
        { status: 404 }
      );
    }
    userId = user.id;
    userRecord = {
      id: user.id,
      push_sent_count: user.push_sent_count ?? null,
      push_sent_date: user.push_sent_date ?? null,
      timezone: user.timezone ?? null,
    };
  } else {
    const { data: users } = await supabase
      .from("users")
      .select("id, push_subscription_json, push_sent_count, push_sent_date, timezone")
      .not("push_subscription_json", "is", null)
      .limit(1);
    const first = users?.[0];
    if (!first) {
      return NextResponse.json(
        { error: "No user with push subscription found. Enable push in Settings first." },
        { status: 404 }
      );
    }
    userId = first.id;
    userRecord = {
      id: first.id,
      push_sent_count: (first as any).push_sent_count ?? null,
      push_sent_date: (first as any).push_sent_date ?? null,
      timezone: (first as any).timezone ?? null,
    };
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const dayOfYear = Math.max(1, Math.min(365, getDayOfYearFromDateString(todayStr)));
  const quoteRow = getQuoteByDayNumber(dayOfYear);
  const quoteText = quoteRow?.quote_text ?? "Your daily focus.";

  let ok = false;
  const ctx = await loadUserNotificationContextForUser(supabase, userId);
  if (!userRecord) {
    return NextResponse.json({ error: "Failed to load user push state." }, { status: 500 });
  }
  try {
    switch (typeParam) {
      case "daily-quote": {
        const base = {
          title: "NEUROHQ",
          body: quoteText.length > 120 ? quoteText.slice(0, 117) + "…" : quoteText,
          tag: "daily-quote",
          url: "/dashboard",
          priority: "low" as const,
        };
        const payload = applyPersonalityToPayload(base, ctx.personalityMode, "quote");
        const limitState = await getPushLimitState(supabase, userRecord, payload.priority);
        if (limitState.blockedBy !== "none") {
          return NextResponse.json({
            ok: false,
            type: typeParam,
            userId,
            message: "Send blocked by push limits.",
            reason: limitState.blockedBy,
            limitState,
          });
        }
        ok = await sendPushToUser(supabase, userId, payload);
        break;
      }
      case "calendar-morning": {
        const base = {
          title: "NEUROHQ — Today",
          body: "Heads up: 2 events today — Team standup, Review",
          tag: "calendar-morning",
          url: "/tasks?tab=calendar",
          priority: "normal" as const,
        };
        const payload = applyPersonalityToPayload(base, ctx.personalityMode, "calendar_morning");
        const limitState = await getPushLimitState(supabase, userRecord, payload.priority);
        if (limitState.blockedBy !== "none") {
          return NextResponse.json({
            ok: false,
            type: typeParam,
            userId,
            message: "Send blocked by push limits.",
            reason: limitState.blockedBy,
            limitState,
          });
        }
        ok = await sendPushToUser(supabase, userId, payload);
        break;
      }
      case "calendar-reminder": {
        const base = {
          title: "NEUROHQ — Calendar",
          body: "Starting soon: Team standup",
          tag: "calendar-reminder",
          url: "/tasks?tab=calendar",
          priority: "normal" as const,
        };
        const payload = applyPersonalityToPayload(base, ctx.personalityMode, "calendar_reminder");
        const limitState = await getPushLimitState(supabase, userRecord, payload.priority);
        if (limitState.blockedBy !== "none") {
          return NextResponse.json({
            ok: false,
            type: typeParam,
            userId,
            message: "Send blocked by push limits.",
            reason: limitState.blockedBy,
            limitState,
          });
        }
        ok = await sendPushToUser(supabase, userId, payload);
        break;
      }
      case "morning-reminder": {
        const morningData = await getMorningEmailData(supabase, userId, todayStr);
        const base = buildMorningPushPayload(morningData);
        const payload = applyPersonalityToPayload(base, ctx.personalityMode, "morning");
        const limitState = await getPushLimitState(supabase, userRecord, payload.priority);
        if (limitState.blockedBy !== "none") {
          return NextResponse.json({
            ok: false,
            type: typeParam,
            userId,
            message: "Send blocked by push limits.",
            reason: limitState.blockedBy,
            limitState,
          });
        }
        ok = await sendPushToUser(supabase, userId, payload);
        break;
      }
      case "evening-reminder": {
        const eveningData = await getEveningEmailData(supabase, userId, todayStr);
        const base = buildEveningPushPayload(eveningData);
        const payload = applyPersonalityToPayload(base, ctx.personalityMode, "evening");
        const limitState = await getPushLimitState(supabase, userRecord, payload.priority);
        if (limitState.blockedBy !== "none") {
          return NextResponse.json({
            ok: false,
            type: typeParam,
            userId,
            message: "Send blocked by push limits.",
            reason: limitState.blockedBy,
            limitState,
          });
        }
        ok = await sendPushToUser(supabase, userId, payload);
        break;
      }
      case "brain-status-reminder": {
        const result = buildBehavioralNotificationForContext(ctx, { type: "brain_status_missing" });
        if (result) {
          const limitState = await getPushLimitState(supabase, userRecord, result.payload.priority);
          if (limitState.blockedBy !== "none") {
            return NextResponse.json({
              ok: false,
              type: typeParam,
              userId,
              message: "Send blocked by push limits.",
              reason: limitState.blockedBy,
              limitState,
            });
          }
          ok = await sendPushToUser(supabase, userId, result.payload);
        }
        break;
      }
      case "weekly-learning": {
        const base = buildWeeklyLearningPushPayload(35, 60);
        const payload = applyPersonalityToPayload(base, ctx.personalityMode, "weekly_learning");
        const limitState = await getPushLimitState(supabase, userRecord, payload.priority);
        if (limitState.blockedBy !== "none") {
          return NextResponse.json({
            ok: false,
            type: typeParam,
            userId,
            message: "Send blocked by push limits.",
            reason: limitState.blockedBy,
            limitState,
          });
        }
        ok = await sendPushToUser(supabase, userId, payload);
        break;
      }
      case "savings-alert": {
        const base = {
          title: "NEUROHQ — Savings",
          body: '"Emergency fund" due in 14 day(s). You\'re at 65%.',
          tag: "savings-alert",
          url: "/budget",
          priority: "high" as const,
        };
        const payload = applyPersonalityToPayload(base, ctx.personalityMode, "savings_alert");
        const limitState = await getPushLimitState(supabase, userRecord, payload.priority);
        if (limitState.blockedBy !== "none") {
          return NextResponse.json({
            ok: false,
            type: typeParam,
            userId,
            message: "Send blocked by push limits.",
            reason: limitState.blockedBy,
            limitState,
          });
        }
        ok = await sendPushToUser(supabase, userId, payload);
        break;
      }
      case "shutdown-reminder": {
        const payload: PushPayload = {
          title: "NEUROHQ",
          body: "Time to wind down. Rest well.",
          tag: "shutdown-reminder",
          url: "/dashboard",
          priority: "high",
        };
        const limitState = await getPushLimitState(supabase, userRecord, payload.priority);
        if (limitState.blockedBy !== "none") {
          return NextResponse.json({
            ok: false,
            type: typeParam,
            userId,
            message: "Send blocked by push limits.",
            reason: limitState.blockedBy,
            limitState,
          });
        }
        ok = await sendPushToUser(supabase, userId, payload);
        break;
      }
      case "freeze-reminder": {
        const baseFreeze = {
          title: "NEUROHQ — Frozen purchase",
          body: '"New headphones" is ready. Confirm or cancel in Budget.',
          tag: "freeze-reminder",
          url: "/budget",
          priority: "high" as const,
        };
        const payload = applyPersonalityToPayload(baseFreeze, ctx.personalityMode, "freeze_reminder");
        const limitState = await getPushLimitState(supabase, userRecord, payload.priority);
        if (limitState.blockedBy !== "none") {
          return NextResponse.json({
            ok: false,
            type: typeParam,
            userId,
            message: "Send blocked by push limits.",
            reason: limitState.blockedBy,
            limitState,
          });
        }
        ok = await sendPushToUser(supabase, userId, payload);
        break;
      }
      case "avoidance-alert": {
        const baseAvoid = {
          title: "NEUROHQ",
          body: "3 task(s) carried over. Pick one to focus on.",
          tag: "avoidance-alert",
          url: "/dashboard",
          priority: "high" as const,
        };
        const payload = applyPersonalityToPayload(baseAvoid, ctx.personalityMode, "avoidance_alert");
        const limitState = await getPushLimitState(supabase, userRecord, payload.priority);
        if (limitState.blockedBy !== "none") {
          return NextResponse.json({
            ok: false,
            type: typeParam,
            userId,
            message: "Send blocked by push limits.",
            reason: limitState.blockedBy,
            limitState,
          });
        }
        ok = await sendPushToUser(supabase, userId, payload);
        break;
      }
      case "reengage": {
        const ctx = await loadUserNotificationContextForUser(supabase, userId);
        const result = buildBehavioralNotificationForContext(ctx, {
          type: "inactivity_window",
          daysInactive: 3,
        });
        if (result) {
          const limitState = await getPushLimitState(supabase, userRecord, result.payload.priority);
          if (limitState.blockedBy !== "none") {
            return NextResponse.json({
              ok: false,
              type: typeParam,
              userId,
              message: "Send blocked by push limits.",
              reason: limitState.blockedBy,
              limitState,
            });
          }
          ok = await sendPushToUser(supabase, userId, result.payload);
        }
        break;
      }
      case "streak-growth": {
        const ctx = await loadUserNotificationContextForUser(supabase, userId);
        const result = buildBehavioralNotificationForContext(ctx, {
          type: "streak_growth",
          newStreak: 5,
        });
        if (result) {
          const limitState = await getPushLimitState(supabase, userRecord, result.payload.priority);
          if (limitState.blockedBy !== "none") {
            return NextResponse.json({
              ok: false,
              type: typeParam,
              userId,
              message: "Send blocked by push limits.",
              reason: limitState.blockedBy,
              limitState,
            });
          }
          ok = await sendPushToUser(supabase, userId, result.payload);
        }
        break;
      }
      case "streak-protection": {
        const ctx = await loadUserNotificationContextForUser(supabase, userId);
        const result = buildBehavioralNotificationForContext(ctx, {
          type: "streak_risk",
          currentStreak: 3,
        });
        if (result) {
          const limitState = await getPushLimitState(supabase, userRecord, result.payload.priority);
          if (limitState.blockedBy !== "none") {
            return NextResponse.json({
              ok: false,
              type: typeParam,
              userId,
              message: "Send blocked by push limits.",
              reason: limitState.blockedBy,
              limitState,
            });
          }
          ok = await sendPushToUser(supabase, userId, result.payload);
        }
        break;
      }
      case "momentum": {
        const ctx = await loadUserNotificationContextForUser(supabase, userId);
        const result = buildBehavioralNotificationForContext(ctx, {
          type: "mission_completed",
          missionsInWindow: 4,
          windowMinutes: 45,
        });
        if (result) {
          const limitState = await getPushLimitState(supabase, userRecord, result.payload.priority);
          if (limitState.blockedBy !== "none") {
            return NextResponse.json({
              ok: false,
              type: typeParam,
              userId,
              message: "Send blocked by push limits.",
              reason: limitState.blockedBy,
              limitState,
            });
          }
          ok = await sendPushToUser(supabase, userId, result.payload);
        }
        break;
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg, type: typeParam }, { status: 500 });
  }

  return NextResponse.json({
    ok,
    type: typeParam,
    userId,
    message: ok
      ? `Push "${typeParam}" sent. Check your device.`
      : "Send failed (e.g. daily limit or invalid subscription).",
  });
}
