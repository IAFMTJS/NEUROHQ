"use server";

import { createClient } from "@/lib/supabase/server";
import { getWeekBounds } from "@/lib/utils/learning";
import {
  getWeeklyLearningTarget,
  getLearningSessions,
  getLearningStreak,
  getEducationOptions,
  getMonthlyBooksForCurrentMonth,
} from "@/app/actions/learning";
import { getQuarterlyStrategy } from "@/app/actions/strategy";

export type LearningFocus = {
  primary: {
    id: string | null;
    name: string | null;
    why: string | null;
    category: string | null;
    sessionsThisWeek: number;
  } | null;
  secondary: {
    id: string | null;
    name: string | null;
    category: string | null;
    sessionsThisWeek: number;
  } | null;
};

export type LearningStream = {
  id: string;
  type: "skill" | "book";
  title: string;
  sessionsThisWeek: number;
  totalSessions: number;
  lastActive: string | null;
  momentumScore: number;
  pagesTotal?: number | null;
  pagesRead?: number | null;
};

export type LearningConsistency = {
  currentStreak: number;
  longestStreak: number;
  sessionsThisWeek: number;
  weeklyTargetSessions: number;
  completionRatio: number;
};

export type LearningReflectionState = {
  lastEntryDate: string | null;
  reflectionRequired: boolean;
};

export type LearningState = {
  focus: LearningFocus;
  streams: LearningStream[];
  consistency: LearningConsistency;
  reflection: LearningReflectionState;
};

function computeRecentActivityWeight(lastActive: string | null, today: Date): number {
  if (!lastActive) return 0;
  const last = new Date(lastActive + "T00:00:00");
  const diffDays = Math.floor((today.getTime() - last.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays <= 3) return 1;
  if (diffDays <= 7) return 0.7;
  if (diffDays <= 14) return 0.4;
  if (diffDays <= 30) return 0.2;
  return 0.1;
}

export async function getLearningState(): Promise<LearningState> {
  const today = new Date();
  const { start: weekStart, end: weekEnd } = getWeekBounds(today);

  const [weeklyMinutesTarget, sessions, streak, options, books, strategy] = await Promise.all([
    getWeeklyLearningTarget(),
    getLearningSessions(),
    getLearningStreak(),
    getEducationOptions(false),
    getMonthlyBooksForCurrentMonth(),
    getQuarterlyStrategy(),
  ]);

  const weeklyTargetSessions = Math.max(1, Math.round(weeklyMinutesTarget / 25));

  const weekSessions = sessions.filter(
    (s) => (s as { date: string }).date >= weekStart && (s as { date: string }).date <= weekEnd,
  );
  const sessionsThisWeek = weekSessions.length;

  // Build streams from education options
  const todayStr = today.toISOString().slice(0, 10);
  const streams: LearningStream[] = [];

  for (const opt of options) {
    const id = (opt as { id: string }).id;
    const name = (opt as { name: string }).name;
    const optionSessions = sessions.filter((s) => (s as { education_option_id?: string | null }).education_option_id === id);
    const totalSessions = optionSessions.length;
    const optionWeekSessions = optionSessions.filter(
      (s) => (s as { date: string }).date >= weekStart && (s as { date: string }).date <= weekEnd,
    ).length;
    const lastActive = optionSessions[0]?.date ?? null;
    const momentumScoreRaw =
      (weeklyTargetSessions > 0 ? (optionWeekSessions / weeklyTargetSessions) * 0.6 : 0) +
      computeRecentActivityWeight(lastActive, today) * 0.4;

    streams.push({
      id,
      type: "skill",
      title: name,
      sessionsThisWeek: optionWeekSessions,
      totalSessions,
      lastActive,
      momentumScore: Math.max(0, Math.min(1, momentumScoreRaw)),
    });
  }

  // Streams from current monthly books
  for (const book of books) {
    const bookId = (book as { id: string }).id;
    const title = (book as { title: string }).title;
    const pagesTotal = (book as { total_pages?: number | null }).total_pages ?? null;
    const pagesRead = (book as { pages_read?: number | null }).pages_read ?? null;

    const bookSessions = sessions.filter((s) => (s as { monthly_book_id?: string | null }).monthly_book_id === bookId);
    const totalSessions = bookSessions.length;
    const bookWeekSessions = bookSessions.filter(
      (s) => (s as { date: string }).date >= weekStart && (s as { date: string }).date <= weekEnd,
    ).length;
    const lastActive =
      bookSessions[0]?.date ??
      ((book as { pages_updated_at?: string | null }).pages_updated_at?.slice(0, 10) ?? null);

    const momentumScoreRaw =
      (weeklyTargetSessions > 0 ? (bookWeekSessions / weeklyTargetSessions) * 0.6 : 0) +
      computeRecentActivityWeight(lastActive, today) * 0.4;

    streams.push({
      id: bookId,
      type: "book",
      title,
      sessionsThisWeek: bookWeekSessions,
      totalSessions,
      lastActive,
      momentumScore: Math.max(0, Math.min(1, momentumScoreRaw)),
      pagesTotal,
      pagesRead,
    });
  }

  // Sort by momentum (internal, not shown)
  streams.sort((a, b) => b.momentumScore - a.momentumScore);

  // Focus: derive from streams and quarterly strategy
  const primaryStream = streams[0] ?? null;
  const secondaryStream = streams[1] ?? null;
  const s = strategy as
    | {
        primary_theme?: string | null;
        secondary_theme?: string | null;
        identity_statement?: string | null;
      }
    | null;

  const primaryFocusName =
    (primaryStream?.title ?? null) || (s?.primary_theme?.trim() || null) || null;
  const secondaryFocusName =
    (secondaryStream?.title ?? null) || (s?.secondary_theme?.trim() || null) || null;

  const focus: LearningFocus = {
    primary: primaryFocusName
      ? {
          id: primaryStream?.id ?? null,
          name: primaryFocusName,
          why: s?.identity_statement?.trim() || null,
          category: null,
          sessionsThisWeek: primaryStream?.sessionsThisWeek ?? 0,
        }
      : null,
    secondary: secondaryFocusName
      ? {
          id: secondaryStream?.id ?? null,
          name: secondaryFocusName,
          category: null,
          sessionsThisWeek: secondaryStream?.sessionsThisWeek ?? 0,
        }
      : null,
  };

  // Consistency block
  const consistency: LearningConsistency = {
    currentStreak: streak,
    longestStreak: streak, // We don't have historical longest streak yet; reuse current for now.
    sessionsThisWeek,
    weeklyTargetSessions,
    completionRatio: weeklyTargetSessions > 0 ? Math.min(1, sessionsThisWeek / weeklyTargetSessions) : 0,
  };

  // Reflection
  const reflection = await getReflectionState(weekStart, todayStr);

  return {
    focus,
    streams,
    consistency,
    reflection,
  };
}

async function getReflectionState(weekStart: string, todayStr: string): Promise<LearningReflectionState> {
  const supabase = await createClient();
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- table may be missing from generated types
    const { data, error } = await (supabase as any)
      .from("learning_reflections")
      .select("date")
      .order("date", { ascending: false })
      .limit(1);

    if (error) {
      // Table may not exist yet; fail silently for now.
      return { lastEntryDate: null, reflectionRequired: todayStr >= weekStart };
    }

    const lastDate = (data?.[0] as { date?: string } | undefined)?.date ?? null;
    const reflectionRequired = !lastDate || lastDate < weekStart;
    return { lastEntryDate: lastDate, reflectionRequired };
  } catch {
    // Safety net; keep UI working even if schema is missing.
    return { lastEntryDate: null, reflectionRequired: todayStr >= weekStart };
  }
}

export async function submitLearningReflection(params: {
  date: string;
  understood: string;
  difficult: string;
  adjust: string;
}): Promise<boolean> {
  const supabase = await createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const trimmed = {
      understood: params.understood.trim().slice(0, 500),
      difficult: params.difficult.trim().slice(0, 500),
      adjust: params.adjust.trim().slice(0, 500),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- table may be missing from generated types
    const { error } = await (supabase as any).from("learning_reflections").insert({
      user_id: user.id,
      date: params.date,
      understood: trimmed.understood || null,
      difficult: trimmed.difficult || null,
      adjust: trimmed.adjust || null,
    });

    if (error) {
      // If table doesn't exist or other error, don't crash Growth page.
      console.error("submitLearningReflection error", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error("submitLearningReflection exception", e);
    return false;
  }
}

