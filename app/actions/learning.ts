"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getWeekBounds } from "@/lib/utils/learning";

const DEFAULT_WEEKLY_TARGET_MINUTES = 60;

export async function getWeeklyLearningTarget(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return DEFAULT_WEEKLY_TARGET_MINUTES;
  const { data } = await supabase
    .from("users")
    .select("weekly_learning_target_minutes")
    .eq("id", user.id)
    .single();
  const v = (data as { weekly_learning_target_minutes?: number | null } | null)?.weekly_learning_target_minutes;
  return v != null && v > 0 ? v : DEFAULT_WEEKLY_TARGET_MINUTES;
}

export async function updateWeeklyLearningTarget(minutes: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const value = Math.max(1, Math.min(999, Math.round(minutes)));
  const { error } = await supabase
    .from("users")
    .update({ weekly_learning_target_minutes: value })
    .eq("id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/learning");
  revalidatePath("/dashboard");
  revalidatePath("/report");
}

export async function getLearningSessions(weekStart?: string, weekEnd?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  let query = supabase
    .from("learning_sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false });
  if (weekStart) query = query.gte("date", weekStart);
  if (weekEnd) query = query.lte("date", weekEnd);
  const { data } = await query;
  return data ?? [];
}

/** Topic breakdown for a week: minutes per topic. */
export async function getTopicBreakdown(weekStart: string, weekEnd: string): Promise<{ topic: string; minutes: number }[]> {
  const sessions = await getLearningSessions(weekStart, weekEnd);
  const byTopic: Record<string, number> = {};
  for (const s of sessions) {
    const topic = (s.topic ?? "").trim() || "No topic";
    byTopic[topic] = (byTopic[topic] ?? 0) + (s.minutes ?? 0);
  }
  return Object.entries(byTopic)
    .map(([topic, minutes]) => ({ topic, minutes }))
    .sort((a, b) => b.minutes - a.minutes);
}

/** Weekly totals for the given month (weeks that start in that month). */
export async function getMonthlyLearningWeeks(year: number, month: number): Promise<{ weekStart: string; minutes: number }[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const { start: firstWeekStart } = getWeekBounds(firstDay);
  const { start: lastWeekStart } = getWeekBounds(lastDay);
  const sessions = await getLearningSessions(firstWeekStart, lastDay.toISOString().slice(0, 10));
  const weekMinutes: Record<string, number> = {};
  for (const s of sessions) {
    const { start } = getWeekBounds(new Date(s.date));
    if (start >= firstWeekStart && start <= lastWeekStart) {
      weekMinutes[start] = (weekMinutes[start] ?? 0) + (s.minutes ?? 0);
    }
  }
  return Object.entries(weekMinutes)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekStart, minutes]) => ({ weekStart, minutes }));
}

/** Export learning sessions as CSV string. */
export async function exportLearningSessionsCSV(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data } = await supabase
    .from("learning_sessions")
    .select("date, minutes, topic, learning_type")
    .eq("user_id", user.id)
    .order("date", { ascending: false });
  const rows = data ?? [];
  const header = "date,minutes,topic,learning_type";
  const lines = [header, ...rows.map((r) => {
    const d = (r as { date: string }).date;
    const m = (r as { minutes: number }).minutes;
    const t = ((r as { topic: string | null }).topic ?? "").replace(/"/g, '""');
    const lt = ((r as { learning_type?: string }).learning_type ?? "general").replace(/"/g, '""');
    return `${d},${m},"${t}","${lt}"`;
  })];
  return lines.join("\n");
}

/** Total learning minutes ever (for calm milestones). */
export async function getTotalLearningMinutes(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const { data } = await supabase
    .from("learning_sessions")
    .select("minutes")
    .eq("user_id", user.id);
  return (data ?? []).reduce((s, r) => s + ((r as { minutes: number }).minutes ?? 0), 0);
}

/** Distinct topics from all learning sessions (for autocomplete). */
export async function getPastTopics(): Promise<string[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("learning_sessions")
    .select("topic")
    .eq("user_id", user.id)
    .not("topic", "is", null);
  const topics = (data ?? [])
    .map((r) => (r as { topic: string | null }).topic?.trim())
    .filter((t): t is string => !!t);
  return [...new Set(topics)].sort().slice(0, 30);
}

export async function addLearningSession(params: {
  minutes: number;
  date: string;
  topic?: string;
  education_option_id?: string | null;
  learning_type?: "general" | "reading" | "course" | "podcast" | "video";
  monthly_book_id?: string | null;
  strategy_quarter?: number | null;
  strategy_year?: number | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from("learning_sessions").insert({
    user_id: user.id,
    minutes: params.minutes,
    date: params.date,
    topic: params.topic ?? null,
    education_option_id: params.education_option_id ?? null,
    learning_type: params.learning_type ?? "general",
    monthly_book_id: params.monthly_book_id ?? null,
    strategy_quarter: params.strategy_quarter ?? null,
    strategy_year: params.strategy_year ?? null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/learning");
  revalidatePath("/dashboard");
}

export async function updateLearningSession(
  id: string,
  params: { minutes?: number; date?: string; topic?: string | null; learning_type?: "general" | "reading" | "course" | "podcast" | "video" }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const updates: Record<string, unknown> = {};
  if (params.minutes != null) updates.minutes = params.minutes;
  if (params.date != null) updates.date = params.date;
  if (params.topic !== undefined) updates.topic = params.topic;
  if (params.learning_type != null) updates.learning_type = params.learning_type;
  if (Object.keys(updates).length === 0) return;
  const { error } = await supabase
    .from("learning_sessions")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/learning");
  revalidatePath("/dashboard");
}

export async function deleteLearningSession(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from("learning_sessions").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/learning");
  revalidatePath("/dashboard");
}

export async function getWeeklyMinutes(weekStart: string, weekEnd: string): Promise<number> {
  const sessions = await getLearningSessions(weekStart, weekEnd);
  return sessions.reduce((sum, s) => sum + (s.minutes ?? 0), 0);
}

export async function getLearningStreak(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const { data: sessions } = await supabase
    .from("learning_sessions")
    .select("date, minutes")
    .eq("user_id", user.id)
    .order("date", { ascending: false });
  if (!sessions?.length) return 0;
  const weekMinutes: Record<string, number> = {};
  for (const s of sessions) {
    const { start } = getWeekBounds(new Date(s.date));
    weekMinutes[start] = (weekMinutes[start] ?? 0) + (s.minutes ?? 0);
  }
  const { data: userRow } = await supabase
    .from("users")
    .select("weekly_learning_target_minutes")
    .eq("id", user.id)
    .single();
  const target = (userRow as { weekly_learning_target_minutes?: number | null } | null)?.weekly_learning_target_minutes;
  const weeklyTarget = target != null && target > 0 ? target : DEFAULT_WEEKLY_TARGET_MINUTES;

  const sortedWeeks = Object.keys(weekMinutes).sort().reverse();
  let streak = 0;
  let prevWeek: string | null = null;
  for (const week of sortedWeeks) {
    if (weekMinutes[week] >= weeklyTarget) {
      if (prevWeek === null) {
        const thisMonday = new Date(week + "T00:00:00");
        const today = new Date();
        const diffDays = Math.floor((today.getTime() - thisMonday.getTime()) / (24 * 60 * 60 * 1000));
        if (diffDays <= 7) streak = 1;
        else break;
      } else {
        const prev = new Date(prevWeek + "T00:00:00");
        const curr = new Date(week + "T00:00:00");
        const diff = (prev.getTime() - curr.getTime()) / (7 * 24 * 60 * 60 * 1000);
        if (Math.abs(diff - 1) < 0.1) streak++;
        else break;
      }
      prevWeek = week;
    } else break;
  }
  return streak;
}

export async function getEducationOptions(includeArchived = true) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  let query = supabase
    .from("education_options")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (!includeArchived) query = query.is("archived_at", null);
  const { data } = await query;
  return data ?? [];
}

export async function createEducationOption(params: {
  name: string;
  interest_score?: number;
  future_value_score?: number;
  effort_score?: number;
  category?: string | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from("education_options").insert({
    user_id: user.id,
    name: params.name,
    interest_score: params.interest_score ?? null,
    future_value_score: params.future_value_score ?? null,
    effort_score: params.effort_score ?? null,
    category: params.category ?? null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/learning");
}

export async function updateEducationOption(id: string, params: {
  name?: string;
  interest_score?: number | null;
  future_value_score?: number | null;
  effort_score?: number | null;
  category?: string | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase
    .from("education_options")
    .update(params)
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/learning");
}

export async function archiveEducationOption(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase
    .from("education_options")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/learning");
}

export async function unarchiveEducationOption(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase
    .from("education_options")
    .update({ archived_at: null })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/learning");
}

export async function deleteEducationOption(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from("education_options").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/learning");
}

export type MonthlyBookRow = {
  id: string;
  year: number;
  month: number;
  title: string;
  completed_at: string | null;
  slot?: number;
  pages_per_day?: number | null;
  chapters_per_week?: number | null;
};

export async function getMonthlyBookForCurrentMonth(): Promise<MonthlyBookRow | null> {
  const books = await getMonthlyBooksForCurrentMonth();
  return books[0] ?? null;
}

export async function getMonthlyBooksForCurrentMonth(): Promise<MonthlyBookRow[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const { data } = await supabase
    .from("monthly_books")
    .select("id, year, month, title, completed_at, slot, pages_per_day, chapters_per_week")
    .eq("user_id", user.id)
    .eq("year", year)
    .eq("month", month)
    .order("slot", { ascending: true });
  return (data ?? []) as MonthlyBookRow[];
}

/** Past months' books for history (last 12 months). */
export async function getMonthlyBooksHistory(): Promise<MonthlyBookRow[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const now = new Date();
  const { data } = await supabase
    .from("monthly_books")
    .select("id, year, month, title, completed_at, slot")
    .eq("user_id", user.id)
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .order("slot", { ascending: true })
    .limit(24);
  return (data ?? []) as MonthlyBookRow[];
}

export async function setMonthlyBook(title: string, slot = 1) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const books = await getMonthlyBooksForCurrentMonth();
  const existing = books.find((b) => b.slot === slot);
  if (existing) {
    const { error } = await supabase
      .from("monthly_books")
      .update({ title })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("monthly_books")
      .insert({ user_id: user.id, year, month, title, slot });
    if (error) throw new Error(error.message);
  }
  revalidatePath("/learning");
  revalidatePath("/dashboard");
}

export async function setMonthlyBookReadingGoal(bookId: string, pagesPerDay?: number | null, chaptersPerWeek?: number | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase
    .from("monthly_books")
    .update({
      pages_per_day: pagesPerDay ?? null,
      chapters_per_week: chaptersPerWeek ?? null,
    })
    .eq("id", bookId)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/learning");
}

export async function addMonthlyBook(title: string) {
  const books = await getMonthlyBooksForCurrentMonth();
  const nextSlot = books.length > 0 ? Math.max(...books.map((b) => b.slot ?? 1)) + 1 : 1;
  return setMonthlyBook(title, nextSlot);
}

export async function completeMonthlyBook(bookId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  if (bookId) {
    const { error } = await supabase
      .from("monthly_books")
      .update({ completed_at: new Date().toISOString() })
      .eq("id", bookId)
      .eq("user_id", user.id);
    if (error) throw new Error(error.message);
  } else {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const { error } = await supabase
      .from("monthly_books")
      .update({ completed_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("year", year)
      .eq("month", month)
      .eq("slot", 1);
    if (error) throw new Error(error.message);
  }
  revalidatePath("/learning");
  revalidatePath("/dashboard");
}
