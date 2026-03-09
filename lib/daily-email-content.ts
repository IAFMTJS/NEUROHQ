/**
 * Build HTML content for daily morning (9 AM) and evening (8 PM) reminder emails.
 * Used by the hourly cron when local hour is 9 or 20 and user has email_reminders_enabled.
 *
 * SECURITY: Every query MUST be scoped by the single `userId` argument only. Never pass
 * or use any other user id; cross-user data in emails would be a serious privacy breach.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getQuoteByDayNumber } from "@/lib/quotes";
import { getDayOfYearFromDateString } from "@/lib/utils/timezone";
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
};

export type EveningEmailData = {
  tasksPlanned: number;
  tasksCompleted: number;
  expensesLogged: number;
  brainStatusDone: boolean;
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

  const [dailyState, tasks, calendar] = await Promise.all([
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
  ]);

  const ds = dailyState.data;
  const brainStatusDone = !!(ds && (ds.energy != null || ds.focus != null));
  const taskTitles = (tasks.data ?? []).map((t) => (t.title ?? "Task").trim()).filter(Boolean);
  const calendarTitles = (calendar.data ?? []).map((e) => (e.title ?? "Event").trim()).filter(Boolean);

  return { quote, brainStatusDone, taskTitles, calendarTitles };
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

export function buildMorningPushPayload(data: MorningEmailData): ReminderPushPayload {
  const body = data.taskTitles.length > 0
    ? `Good morning. ${data.taskTitles.length} mission(s) ready today.${data.brainStatusDone ? "" : " Set your brain status first."}`
    : `Good morning. No missions scheduled yet.${data.brainStatusDone ? "" : " Set your brain status first."}`;
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

  const [dailyState, tasksPlanned, tasksCompleted, budgetCount] = await Promise.all([
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
  ]);

  const ds = dailyState.data;
  const brainStatusDone = !!(ds && (ds.energy != null || ds.focus != null));

  return {
    tasksPlanned: tasksPlanned.count ?? 0,
    tasksCompleted: tasksCompleted.count ?? 0,
    expensesLogged: budgetCount.count ?? 0,
    brainStatusDone,
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

  if (!data.brainStatusDone) {
    parts.push("<li><strong style=\"color:#00c3ff;\">Brain status</strong> not set yet — you can still log it for today</li>");
  } else {
    parts.push("<li>Brain status ✓</li>");
  }

  parts.push("</ul><p style=\"margin:0; color:rgba(230,253,255,0.7);\">Catch up in NEUROHQ so tomorrow’s view stays accurate.</p>");

  return wrapReminderHtml(parts.join(""), "Evening check-in");
}

export function buildEveningPushPayload(data: EveningEmailData): ReminderPushPayload {
  const body =
    data.tasksPlanned > 0
      ? `Evening check-in: ${data.tasksCompleted}/${data.tasksPlanned} missions done today, ${data.expensesLogged} expense log(s).`
      : `Evening check-in: ${data.expensesLogged} expense log(s) today.${data.brainStatusDone ? "" : " Brain status still missing."}`;
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
