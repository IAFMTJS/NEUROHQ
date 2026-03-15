import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push";
import { getQuoteByDayNumber } from "@/lib/quotes";
import { getDayOfYearFromDateString } from "@/lib/utils/timezone";
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

  if (userIdParam) {
    const { data: user } = await supabase
      .from("users")
      .select("id, push_subscription_json")
      .eq("id", userIdParam)
      .single();
    if (!user?.push_subscription_json) {
      return NextResponse.json(
        { error: "User not found or has no push subscription." },
        { status: 404 }
      );
    }
    userId = user.id;
  } else {
    const { data: users } = await supabase
      .from("users")
      .select("id")
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
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const dayOfYear = Math.max(1, Math.min(365, getDayOfYearFromDateString(todayStr)));
  const quoteRow = getQuoteByDayNumber(dayOfYear);
  const quoteText = quoteRow?.quote_text ?? "Your daily focus.";

  let ok = false;
  const ctx = await loadUserNotificationContextForUser(supabase, userId);
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
        ok = await sendPushToUser(supabase, userId, applyPersonalityToPayload(base, ctx.personalityMode, "quote"));
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
        ok = await sendPushToUser(supabase, userId, applyPersonalityToPayload(base, ctx.personalityMode, "calendar_morning"));
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
        ok = await sendPushToUser(supabase, userId, applyPersonalityToPayload(base, ctx.personalityMode, "calendar_reminder"));
        break;
      }
      case "morning-reminder": {
        const morningData = await getMorningEmailData(supabase, userId, todayStr);
        const base = buildMorningPushPayload(morningData);
        ok = await sendPushToUser(supabase, userId, applyPersonalityToPayload(base, ctx.personalityMode, "morning"));
        break;
      }
      case "evening-reminder": {
        const eveningData = await getEveningEmailData(supabase, userId, todayStr);
        const base = buildEveningPushPayload(eveningData);
        ok = await sendPushToUser(supabase, userId, applyPersonalityToPayload(base, ctx.personalityMode, "evening"));
        break;
      }
      case "brain-status-reminder": {
        const result = buildBehavioralNotificationForContext(ctx, { type: "brain_status_missing" });
        if (result) ok = await sendPushToUser(supabase, userId, result.payload);
        break;
      }
      case "weekly-learning": {
        const base = buildWeeklyLearningPushPayload(35, 60);
        ok = await sendPushToUser(supabase, userId, applyPersonalityToPayload(base, ctx.personalityMode, "weekly_learning"));
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
        ok = await sendPushToUser(supabase, userId, applyPersonalityToPayload(base, ctx.personalityMode, "savings_alert"));
        break;
      }
      case "shutdown-reminder": {
        ok = await sendPushToUser(supabase, userId, {
          title: "NEUROHQ",
          body: "Time to wind down. Rest well.",
          tag: "shutdown-reminder",
          url: "/dashboard",
          priority: "high",
        });
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
        ok = await sendPushToUser(supabase, userId, applyPersonalityToPayload(baseFreeze, ctx.personalityMode, "freeze_reminder"));
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
        ok = await sendPushToUser(supabase, userId, applyPersonalityToPayload(baseAvoid, ctx.personalityMode, "avoidance_alert"));
        break;
      }
      case "reengage": {
        const ctx = await loadUserNotificationContextForUser(supabase, userId);
        const result = buildBehavioralNotificationForContext(ctx, {
          type: "inactivity_window",
          daysInactive: 3,
        });
        if (result) ok = await sendPushToUser(supabase, userId, result.payload);
        break;
      }
      case "streak-growth": {
        const ctx = await loadUserNotificationContextForUser(supabase, userId);
        const result = buildBehavioralNotificationForContext(ctx, {
          type: "streak_growth",
          newStreak: 5,
        });
        if (result) ok = await sendPushToUser(supabase, userId, result.payload);
        break;
      }
      case "streak-protection": {
        const ctx = await loadUserNotificationContextForUser(supabase, userId);
        const result = buildBehavioralNotificationForContext(ctx, {
          type: "streak_risk",
          currentStreak: 3,
        });
        if (result) ok = await sendPushToUser(supabase, userId, result.payload);
        break;
      }
      case "momentum": {
        const ctx = await loadUserNotificationContextForUser(supabase, userId);
        const result = buildBehavioralNotificationForContext(ctx, {
          type: "mission_completed",
          missionsInWindow: 4,
          windowMinutes: 45,
        });
        if (result) ok = await sendPushToUser(supabase, userId, result.payload);
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
