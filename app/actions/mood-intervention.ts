"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { todayDateString } from "@/lib/utils/timezone";
import { createTask } from "@/app/actions/tasks";
import type { MoodInterventionPersist } from "@/lib/mood-intervention-config";
import type { MoodLabel } from "@/lib/mood-intervention-config";
import type { MoodTriggerId } from "@/lib/mood-intervention-config";
import { copyForTrigger, pickMoodTrigger, titleForTrigger } from "@/lib/mood-intervention-engine";
import type { AnalyticsDay } from "@/lib/mood-intervention-engine";
import { revalidateTagMax } from "@/lib/revalidate";
import { getUserPreferencesOrDefaults } from "@/app/actions/preferences";
import type { Json } from "@/types/database.types";
import type { MissionIntent } from "@/lib/tasks-actions-shared";

type MoodTaskEngineProfile = {
  mission_intent: MissionIntent;
  task_type: "mental" | "physical" | "mixed" | "recovery";
  base_xp: number;
  duration_minutes: number;
};

const DEFAULT_MOOD_TASK_PROFILE: MoodTaskEngineProfile = {
  mission_intent: "recovery",
  task_type: "recovery",
  base_xp: 8,
  duration_minutes: 15,
};

const MOOD_TASK_ENGINE_PROFILE: Record<Exclude<MoodLabel, "good">, MoodTaskEngineProfile> = {
  overwhelmed: { mission_intent: "recovery", task_type: "recovery", base_xp: 8, duration_minutes: 15 },
  tired: { mission_intent: "recovery", task_type: "recovery", base_xp: 8, duration_minutes: 20 },
  low: { mission_intent: "recovery", task_type: "recovery", base_xp: 8, duration_minutes: 15 },
  sick: { mission_intent: "recovery", task_type: "recovery", base_xp: 6, duration_minutes: 15 },
  physical: { mission_intent: "recovery", task_type: "recovery", base_xp: 7, duration_minutes: 15 },
  hyperfocus: { mission_intent: "discipline", task_type: "mental", base_xp: 12, duration_minutes: 25 },
  hyperactive: { mission_intent: "discipline", task_type: "mental", base_xp: 11, duration_minutes: 15 },
  drained_ok: { mission_intent: "recovery", task_type: "recovery", base_xp: 8, duration_minutes: 12 },
  lazy: { mission_intent: "discipline", task_type: "mental", base_xp: 9, duration_minutes: 10 },
  sunny: { mission_intent: "discipline", task_type: "mental", base_xp: 10, duration_minutes: 15 },
  introverted_day: { mission_intent: "discipline", task_type: "mental", base_xp: 10, duration_minutes: 20 },
  extroverted_day: { mission_intent: "discipline", task_type: "mental", base_xp: 10, duration_minutes: 15 },
  calm: { mission_intent: "discipline", task_type: "mental", base_xp: 10, duration_minutes: 20 },
  focused: { mission_intent: "discipline", task_type: "mental", base_xp: 12, duration_minutes: 25 },
  motivated: { mission_intent: "discipline", task_type: "mental", base_xp: 12, duration_minutes: 20 },
  proud: { mission_intent: "discipline", task_type: "mental", base_xp: 10, duration_minutes: 15 },
  joyful: { mission_intent: "discipline", task_type: "mental", base_xp: 10, duration_minutes: 15 },
};

function parsePersist(raw: unknown): MoodInterventionPersist {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  return {
    lastToastDate: typeof o.lastToastDate === "string" ? o.lastToastDate : null,
    lastTriggerId: typeof o.lastTriggerId === "string" ? o.lastTriggerId : null,
    lateNightBiasMinutes: typeof o.lateNightBiasMinutes === "number" ? o.lateNightBiasMinutes : 0,
  };
}

function localHourMinute(iana: string | null): { hour: number; minute: number } {
  const tz = iana && iana.length > 0 ? iana : "UTC";
  try {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const parts = fmt.formatToParts(new Date());
    const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
    const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
    return { hour, minute };
  } catch {
    return { hour: 12, minute: 0 };
  }
}

export type MoodInterventionCandidate = {
  triggerId: MoodTriggerId;
  title: string;
  body: string;
  mood: Exclude<MoodLabel, "good">;
};

/**
 * Returns at most one automated mood toast candidate per day, or null.
 * Respects cooldown, simplified UI, and existing mood label for today.
 */
export async function getMoodInterventionCandidate(): Promise<MoodInterventionCandidate | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const prefs = await getUserPreferencesOrDefaults();
  if (prefs.simplified_content === true) return null;

  const today = todayDateString();

  const [{ data: tzRow }, { data: prefRow }, { data: dailyRow }] = await Promise.all([
    supabase.from("users").select("timezone").eq("id", user.id).maybeSingle(),
    supabase.from("user_preferences").select("mood_intervention_json").eq("user_id", user.id).maybeSingle(),
    supabase.from("daily_state").select("mood_label, physical_health, energy, focus").eq("user_id", user.id).eq("date", today).maybeSingle(),
  ]);

  if (dailyRow?.mood_label && dailyRow.mood_label !== "") {
    return null;
  }

  const persist = parsePersist((prefRow as { mood_intervention_json?: unknown } | null)?.mood_intervention_json);
  if (persist.lastToastDate === today) {
    return null;
  }

  const { hour, minute } = localHourMinute((tzRow as { timezone?: string | null } | null)?.timezone ?? null);

  const from = new Date(today + "T00:00:00Z");
  from.setUTCDate(from.getUTCDate() - 14);
  const fromStr = from.toISOString().slice(0, 10);

  const { data: analyticsRows } = await supabase
    .from("user_analytics_daily")
    .select("date, active_seconds, tasks_completed, tasks_planned, learning_minutes")
    .eq("user_id", user.id)
    .gte("date", fromStr)
    .lte("date", today)
    .order("date", { ascending: true });

  const rows = (analyticsRows ?? []) as AnalyticsDay[];
  const todayAnalytics = rows.find((r) => r.date === today) ?? null;
  const prevDays = rows.filter((r) => r.date < today);

  const { data: taskRows } = await supabase
    .from("tasks")
    .select("completed, carry_over_count")
    .eq("user_id", user.id)
    .eq("due_date", today)
    .is("deleted_at", null);

  const tasks = (taskRows ?? []) as { completed: boolean; carry_over_count: number | null }[];
  const plannedToday = tasks.length;
  const completedToday = tasks.filter((t) => t.completed).length;
  const incompleteToday = tasks.filter((t) => !t.completed).length;
  const carryOverTotal = tasks.reduce((s, t) => s + (t.carry_over_count ?? 0), 0);

  const ds = dailyRow as { physical_health?: number | null; energy?: number | null; focus?: number | null } | null;
  const physicalHealth1to10 =
    ds?.energy != null && ds?.focus != null && ds?.physical_health != null ? Number(ds.physical_health) : null;

  const bias = Math.min(120, Math.max(0, persist.lateNightBiasMinutes ?? 0));

  const triggerId = pickMoodTrigger({
    today,
    localHour: hour,
    localMinute: minute,
    lateNightBiasMinutes: bias,
    todayAnalytics,
    prevDaysAnalytics: prevDays,
    incompleteToday,
    plannedToday,
    completedToday,
    carryOverTotal,
    physicalHealth1to10,
  });

  if (!triggerId) return null;

  const { mood, body } = copyForTrigger(triggerId);
  const title = titleForTrigger(triggerId, user.id.charCodeAt(0) + today.charCodeAt(today.length - 1));

  return { triggerId, title, body, mood };
}

async function patchMoodInterventionJson(
  mutator: (prev: MoodInterventionPersist) => MoodInterventionPersist
): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { data: prefRow } = await supabase
    .from("user_preferences")
    .select("mood_intervention_json")
    .eq("user_id", user.id)
    .maybeSingle();
  const prev = parsePersist((prefRow as { mood_intervention_json?: unknown } | null)?.mood_intervention_json);
  const next = mutator(prev);
  const payload = {
    mood_intervention_json: JSON.parse(JSON.stringify(next)) as Json,
    updated_at: new Date().toISOString(),
  };

  const { data: updated, error: upErr } = await supabase
    .from("user_preferences")
    .update(payload)
    .eq("user_id", user.id)
    .select("user_id");

  if (!upErr && updated && updated.length > 0) return { ok: true };

  const { error: insErr } = await supabase.from("user_preferences").insert({
    user_id: user.id,
    ...payload,
  });
  if (insErr) return { ok: false };
  return { ok: true };
}

/** Call when the toast is actually shown so refresh doesn't repeat the same day. */
export async function recordMoodToastShown(triggerId: MoodTriggerId): Promise<{ ok: boolean }> {
  const today = todayDateString();
  return patchMoodInterventionJson((prev) => ({
    ...prev,
    lastToastDate: today,
    lastTriggerId: triggerId,
  }));
}

/** User tapped "Nee" — alleen vandaag geen herhaling (zelfde slot als toast getoond). */
export async function dismissMoodInterventionForToday(): Promise<{ ok: boolean }> {
  const today = todayDateString();
  return patchMoodInterventionJson((prev) => ({
    ...prev,
    lastToastDate: today,
  }));
}

/** Na "Ja" op late-night toast: volgende keer iets eerder signaleren. */
export async function recordLateNightMoodConfirm(): Promise<{ ok: boolean }> {
  return patchMoodInterventionJson((prev) => {
    const nextBias = Math.min(120, (prev.lateNightBiasMinutes ?? 0) + 20);
    return { ...prev, lateNightBiasMinutes: nextBias };
  });
}

export async function getTodayMoodLabel(): Promise<{ mood: MoodLabel | null; updatedAt: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { mood: null, updatedAt: null };
  const today = todayDateString();
  const { data } = await supabase
    .from("daily_state")
    .select("mood_label, updated_at")
    .eq("user_id", user.id)
    .eq("date", today)
    .maybeSingle();
  const row = data as { mood_label?: string | null; updated_at?: string | null } | null;
  const m = row?.mood_label;
  if (!m || m === "") return { mood: null, updatedAt: row?.updated_at ?? null };
  return { mood: m as MoodLabel, updatedAt: row?.updated_at ?? null };
}

export async function saveDailyMoodLabel(label: MoodLabel): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Niet ingelogd." };
  const today = todayDateString();

  const { data: existing } = await supabase
    .from("daily_state")
    .select("id")
    .eq("user_id", user.id)
    .eq("date", today)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("daily_state").update({ mood_label: label }).eq("user_id", user.id).eq("date", today);
    if (error) {
      if (error.message.includes("daily_state_mood_label_check")) {
        return {
          ok: false,
          error:
            "Deze mood-optie staat nog niet in je database schema. Draai de nieuwste migraties en probeer opnieuw.",
        };
      }
      return { ok: false, error: error.message };
    }
  } else {
    const { error } = await supabase.from("daily_state").insert({
      user_id: user.id,
      date: today,
      mood_label: label,
    });
    if (error) {
      if (error.message.includes("daily_state_mood_label_check")) {
        return {
          ok: false,
          error:
            "Deze mood-optie staat nog niet in je database schema. Draai de nieuwste migraties en probeer opnieuw.",
        };
      }
      return { ok: false, error: error.message };
    }
  }

  revalidateTagMax(`daily-${user.id}-${today}`);
  revalidatePath("/dashboard");
  revalidatePath("/profile");
  revalidatePath("/tasks");
  return { ok: true };
}

export async function addMoodInterventionTask(
  taskTitle: string,
  mood?: Exclude<MoodLabel, "good">
): Promise<{ ok: boolean; error?: string }> {
  try {
    const today = todayDateString();
    const profile = (mood ? MOOD_TASK_ENGINE_PROFILE[mood] : null) ?? DEFAULT_MOOD_TASK_PROFILE;
    await createTask({
      title: taskTitle,
      due_date: today,
      category: "personal",
      mission_intent: profile.mission_intent,
      task_type: profile.task_type,
      base_xp: profile.base_xp,
      duration_minutes: profile.duration_minutes,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Kon taak niet toevoegen." };
  }
}
