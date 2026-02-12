"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getWeekBounds } from "@/lib/utils/learning";

const WEEKLY_TARGET_MINUTES = 60;

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

export async function addLearningSession(params: { minutes: number; date: string; topic?: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from("learning_sessions").insert({
    user_id: user.id,
    minutes: params.minutes,
    date: params.date,
    topic: params.topic ?? null,
  });
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
  const sortedWeeks = Object.keys(weekMinutes).sort().reverse();
  let streak = 0;
  let prevWeek: string | null = null;
  for (const week of sortedWeeks) {
    if (weekMinutes[week] >= WEEKLY_TARGET_MINUTES) {
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

export async function getEducationOptions() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("education_options")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function createEducationOption(params: {
  name: string;
  interest_score?: number;
  future_value_score?: number;
  effort_score?: number;
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
  });
  if (error) throw new Error(error.message);
  revalidatePath("/learning");
}

export async function updateEducationOption(id: string, params: {
  name?: string;
  interest_score?: number | null;
  future_value_score?: number | null;
  effort_score?: number | null;
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

export async function deleteEducationOption(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from("education_options").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/learning");
}
