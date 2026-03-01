"use server";

import { createClient } from "@/lib/supabase/server";
import { getWeekBounds } from "@/lib/utils/learning";

export type WeeklyLearningPoint = {
  weekStart: string;
  minutes: number;
  sessions: number;
};

export type LearningAnalytics = {
  velocity: WeeklyLearningPoint[];
  trendLabel: "rising" | "stable" | "declining" | "flat";
  trendChangePct: number;
  knowledgeDensity: {
    topTopics: { topic: string; minutes: number }[];
    otherMinutes: number;
    densityRatio: number;
  };
};

export async function getLearningAnalytics(): Promise<LearningAnalytics> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      velocity: [],
      trendLabel: "flat",
      trendChangePct: 0,
      knowledgeDensity: {
        topTopics: [],
        otherMinutes: 0,
        densityRatio: 0,
      },
    };
  }

  const today = new Date();
  const weeksBack = 10;
  const endDate = today.toISOString().slice(0, 10);
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - weeksBack * 7);
  const startStr = startDate.toISOString().slice(0, 10);

  const { data: sessions } = await supabase
    .from("learning_sessions")
    .select("date, minutes, topic")
    .eq("user_id", user.id)
    .gte("date", startStr)
    .lte("date", endDate)
    .order("date", { ascending: true });

  const byWeek: Record<string, { minutes: number; sessions: number }> = {};
  const byTopic: Record<string, number> = {};

  for (const row of sessions ?? []) {
    const dateStr = (row as { date: string }).date;
    const { start } = getWeekBounds(new Date(dateStr));
    const mins = (row as { minutes?: number | null }).minutes ?? 0;
    const topic = ((row as { topic?: string | null }).topic ?? "").trim() || "No topic";

    if (!byWeek[start]) byWeek[start] = { minutes: 0, sessions: 0 };
    byWeek[start].minutes += mins;
    byWeek[start].sessions += 1;

    byTopic[topic] = (byTopic[topic] ?? 0) + mins;
  }

  const velocity: WeeklyLearningPoint[] = Object.entries(byWeek)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekStart, v]) => ({
      weekStart,
      minutes: v.minutes,
      sessions: v.sessions,
    }));

  let trendLabel: LearningAnalytics["trendLabel"] = "flat";
  let trendChangePct = 0;

  if (velocity.length >= 4) {
    const recent = velocity.slice(-4);
    const first = recent[0].minutes;
    const last = recent[recent.length - 1].minutes;
    if (first > 0) {
      trendChangePct = Math.round(((last - first) / first) * 100);
      const abs = Math.abs(trendChangePct);
      if (abs < 5) {
        trendLabel = "stable";
      } else if (trendChangePct > 0) {
        trendLabel = "rising";
      } else {
        trendLabel = "declining";
      }
    } else if (last > 0) {
      trendLabel = "rising";
      trendChangePct = 100;
    }
  }

  const topicsSorted = Object.entries(byTopic)
    .map(([topic, minutes]) => ({ topic, minutes }))
    .sort((a, b) => b.minutes - a.minutes);

  const topTopics = topicsSorted.slice(0, 2);
  const totalMinutes = topicsSorted.reduce((sum, t) => sum + t.minutes, 0);
  const topMinutes = topTopics.reduce((sum, t) => sum + t.minutes, 0);
  const otherMinutes = totalMinutes - topMinutes;
  const densityRatio = totalMinutes > 0 ? topMinutes / totalMinutes : 0;

  return {
    velocity,
    trendLabel,
    trendChangePct,
    knowledgeDensity: {
      topTopics,
      otherMinutes,
      densityRatio,
    },
  };
}

