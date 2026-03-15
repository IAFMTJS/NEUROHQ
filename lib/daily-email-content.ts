/**
 * Build HTML content for daily morning (9 AM) and evening (8 PM) reminder emails.
 * Used by the hourly cron when local hour is 9 or 20 and user has email_reminders_enabled.
 *
 * SECURITY: Every query MUST be scoped by the single `userId` argument only. Never pass
 * or use any other user id; cross-user data in emails would be a serious privacy breach.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getQuoteByDayNumber } from "@/lib/quotes";
import { getDayOfYearFromDateString, getWeekBounds } from "@/lib/utils/timezone";
import { wrapReminderHtml } from "@/lib/email";

function assertSingleUserId(userId: string): void {
  if (typeof userId !== "string" || !userId.trim()) {
    throw new Error("daily-email-content: userId is required and must be a non-empty string");
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type MorningEmailData = {
  quote: string;
  brainStatusDone: boolean;
  taskTitles: string[];
  calendarTitles: string[];
  /** Optional: current streak for contextual copy. */
  currentStreak?: number;
};

export type EveningEmailData = {
  tasksPlanned: number;
  tasksCompleted: number;
  expensesLogged: number;
  learningMinutesToday: number;
  brainStatusDone: boolean;
  /** Optional: missions completed this week for contextual copy. */
  missionsCompletedThisWeek?: number;
};

export type ReminderPushPayload = {
  title: string;
  body: string;
  url: string;
  tag: string;
  priority: "normal";
};

/** Fetch data needed for the morning email (quote, brain state, tasks, calendar for today). All data scoped to userId only. */
export async function getMorningEmailData(
  supabase: SupabaseClient,
  userId: string,
  todayStr: string
): Promise<MorningEmailData> {
  assertSingleUserId(userId);
  const dayOfYear = Math.max(1, Math.min(365, getDayOfYearFromDateString(todayStr)));
  const quoteRow = getQuoteByDayNumber(dayOfYear);
  const quote = quoteRow?.quote_text ?? "Your daily focus.";

  const [dailyState, tasks, calendar, streakRow] = await Promise.all([
    supabase
      .from("daily_state")
      .select("energy, focus")
      .eq("user_id", userId)
      .eq("date", todayStr)
      .maybeSingle(),
    supabase
      .from("tasks")
      .select("title")
      .eq("user_id", userId)
      .eq("due_date", todayStr)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .limit(15),
    supabase
      .from("calendar_events")
      .select("title, start_at")
      .eq("user_id", userId)
      .gte("start_at", `${todayStr}T00:00:00`)
      .lte("start_at", `${todayStr}T23:59:59`)
      .order("start_at", { ascending: true })
      .limit(10),
    supabase
      .from("user_streak")
      .select("current_streak")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const ds = dailyState.data;
  const brainStatusDone = !!(ds && (ds.energy != null || ds.focus != null));
  const taskTitles = (tasks.data ?? []).map((t) => (t.title ?? "Task").trim()).filter(Boolean);
  const calendarTitles = (calendar.data ?? []).map((e) => (e.title ?? "Event").trim()).filter(Boolean);
  const currentStreak = (streakRow.data as { current_streak?: number | null } | null)?.current_streak ?? 0;

  return { quote, brainStatusDone, taskTitles, calendarTitles, currentStreak: currentStreak > 0 ? currentStreak : undefined };
}

/** Build morning email HTML (9 AM): quote, brain state reminder, tasks and calendar overview. */
export function buildMorningEmailHtml(data: MorningEmailData): string {
  const parts: string[] = [];

  parts.push(`<p style="margin:0 0 16px 0; font-size:15px; line-height:1.5;">${escapeHtml(data.quote)}</p>`);

  if (!data.brainStatusDone) {
    parts.push(
      `<p style="margin:0 0 16px 0;"><strong style="color:#00c3ff;">→ Set your brain status</strong> on the dashboard so NEUROHQ can tailor today’s suggestions.</p>`
    );
  }

  if (data.taskTitles.length > 0) {
    parts.push(`<p style="margin:0 0 6px 0; font-weight:600;">Today’s missions (${data.taskTitles.length})</p><ul style="margin:0 0 16px 0; padding-left:20px;">`);
    for (const title of data.taskTitles.slice(0, 10)) {
      parts.push(`<li>${escapeHtml(title)}</li>`);
    }
    if (data.taskTitles.length > 10) {
      parts.push(`<li>… and ${data.taskTitles.length - 10} more</li>`);
    }
    parts.push("</ul>");
  } else {
    parts.push(`<p style="margin:0 0 16px 0; color:rgba(230,253,255,0.7);">No missions due today. Add some on the Missions page if you’d like.</p>`);
  }

  if (data.calendarTitles.length > 0) {
    parts.push(`<p style="margin:0 0 6px 0; font-weight:600;">Calendar today</p><ul style="margin:0; padding-left:20px;">`);
    for (const title of data.calendarTitles) {
      parts.push(`<li>${escapeHtml(title)}</li>`);
    }
    parts.push("</ul>");
  }

  return wrapReminderHtml(parts.join(""), "Good morning");
}

/** Heavy day threshold: use short "light" body to avoid overwhelm. */
const HEAVY_DAY_TASKS = 5;
const HEAVY_DAY_EVENTS = 5;

export function buildMorningPushPayload(data: MorningEmailData): ReminderPushPayload {
  const heavyDay = data.taskTitles.length >= HEAVY_DAY_TASKS || data.calendarTitles.length >= HEAVY_DAY_EVENTS;
  const streakLine = data.currentStreak ? `${data.currentStreak}-day streak. ` : "";
  let body: string;
  if (heavyDay) {
    body = `${streakLine}Heavy day — ${data.taskTitles.length} tasks, ${data.calendarTitles.length} events. One focus at a time.${data.brainStatusDone ? "" : " Set brain status when you can."}`;
  } else if (data.taskTitles.length > 0) {
    body = `${streakLine}Good morning. ${data.taskTitles.length} mission(s) ready today.${data.brainStatusDone ? "" : " Set your brain status first."}`;
  } else {
    body = `${streakLine}Good morning. No missions scheduled yet.${data.brainStatusDone ? "" : " Set your brain status first."}`;
  }
  body = body.replace(/^\s+/, "").trim();
  return {
    title: "NEUROHQ — Morning",
    body,
    url: "/tasks",
    tag: "morning-reminder",
    priority: "normal",
  };
}

/** Fetch data needed for the evening email (tasks completed, expenses, brain state). All data scoped to userId only. */
export async function getEveningEmailData(
  supabase: SupabaseClient,
  userId: string,
  todayStr: string
): Promise<EveningEmailData> {
  assertSingleUserId(userId);
  const dayStart = `${todayStr}T00:00:00.000Z`;
  const dayEnd = `${todayStr}T23:59:59.999Z`;

  const now = new Date();
  const { start: weekStart, end: weekEnd } = getWeekBounds(now);

  const [dailyState, tasksPlanned, tasksCompleted, budgetCount, analyticsToday, weekMissions] = await Promise.all([
    supabase
      .from("daily_state")
      .select("energy, focus")
      .eq("user_id", userId)
      .eq("date", todayStr)
      .maybeSingle(),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("due_date", todayStr)
      .is("deleted_at", null),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("completed", true)
      .gte("completed_at", dayStart)
      .lte("completed_at", dayEnd),
    supabase
      .from("budget_entries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("date", todayStr),
    supabase
      .from("user_analytics_daily")
      .select("learning_minutes")
      .eq("user_id", userId)
      .eq("date", todayStr)
      .maybeSingle(),
    supabase
      .from("user_analytics_daily")
      .select("missions_completed")
      .eq("user_id", userId)
      .gte("date", weekStart)
      .lte("date", weekEnd),
  ]);

  const ds = dailyState.data;
  const brainStatusDone = !!(ds && (ds.energy != null || ds.focus != null));
  const learningMinutesToday = (analyticsToday.data as { learning_minutes?: number } | null)?.learning_minutes ?? 0;
  const missionsCompletedThisWeek = (weekMissions.data ?? []).reduce(
    (acc, r) => acc + ((r as { missions_completed?: number }).missions_completed ?? 0),
    0
  );

  return {
    tasksPlanned: tasksPlanned.count ?? 0,
    tasksCompleted: tasksCompleted.count ?? 0,
    expensesLogged: budgetCount.count ?? 0,
    learningMinutesToday,
    brainStatusDone,
    missionsCompletedThisWeek: missionsCompletedThisWeek > 0 ? missionsCompletedThisWeek : undefined,
  };
}

/** Build evening email HTML (8 PM): check-in reminder (expenses, tasks, brain status). */
export function buildEveningEmailHtml(data: EveningEmailData): string {
  const parts: string[] = [];

  parts.push("<p style=\"margin:0 0 16px 0;\">Quick check-in before you wind down:</p><ul style=\"margin:0 0 16px 0; padding-left:20px;\">");

  if (data.tasksPlanned > 0) {
    const done = data.tasksCompleted;
    const pct = Math.round((done / data.tasksPlanned) * 100);
    parts.push(`<li>Tasks: ${done} of ${data.tasksPlanned} done today (${pct}%)</li>`);
  } else {
    parts.push("<li>No missions were due today</li>");
  }

  parts.push(`<li>Expenses logged today: ${data.expensesLogged}</li>`);
  parts.push(`<li>Learning today: ${data.learningMinutesToday} min</li>`);

  if (!data.brainStatusDone) {
    parts.push("<li><strong style=\"color:#00c3ff;\">Brain status</strong> not set yet — you can still log it for today</li>");
  } else {
    parts.push("<li>Brain status ✓</li>");
  }

  parts.push("</ul><p style=\"margin:0; color:rgba(230,253,255,0.7);\">Catch up in NEUROHQ so tomorrow’s view stays accurate.</p>");

  return wrapReminderHtml(parts.join(""), "Evening check-in");
}

  const { tasksPlanned, tasksCompleted, expensesLogged, learningMinutesToday, brainStatusDone, missionsCompletedThisWeek } = data;
  const nothingLogged = expensesLogged === 0 && learningMinutesToday === 0;
  const lightDay = tasksCompleted <= 1 && (expensesLogged === 0 || learningMinutesToday === 0);
  const weekLine = missionsCompletedThisWeek != null && missionsCompletedThisWeek > 0
    ? ` ${missionsCompletedThisWeek} mission(s) this week so far.`
    : "";

  let body: string;
  if (nothingLogged && tasksCompleted === 0) {
    body = "Nothing logged today. Quick check-in before bed?";
  } else if (lightDay || nothingLogged) {
    const taskBit = tasksPlanned > 0 ? `${tasksCompleted}/${tasksPlanned} missions. ` : "";
    const nudge =
      expensesLogged === 0 && learningMinutesToday === 0
        ? "No budget or learning logged — quick log?"
        : expensesLogged === 0
          ? "No expenses logged today — add a quick log?"
          : "No learning logged today — add a quick log?";
    body = `Evening check-in: ${taskBit}${nudge}${weekLine}`.trim();
  } else if (tasksPlanned > 0) {
    body = `Evening check-in: ${tasksCompleted}/${tasksPlanned} missions done, ${expensesLogged} expense(s), ${learningMinutesToday} min learning.${weekLine}${!brainStatusDone ? " Brain status still missing." : ""}`.trim();
  } else {
    body = `Evening check-in: ${expensesLogged} expense(s), ${learningMinutesToday} min learning today.${weekLine}${!brainStatusDone ? " Brain status still missing." : ""}`.trim();
  }

  return {
    title: "NEUROHQ — Evening",
    body,
    url: "/dashboard",
    tag: "evening-reminder",
    priority: "normal",
  };
}

export function buildWeeklyLearningPushPayload(learningMinutes: number, learningTarget: number): ReminderPushPayload {
  return {
    title: "NEUROHQ — Learning",
    body: `Last week: ${learningMinutes} min logged (target ${learningTarget}). Plan a learning block this week.`,
    url: "/learning",
    tag: "learning-reminder",
    priority: "normal",
  };
}
