"use server";

import { cache } from "react";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getBudgetWeekBounds } from "@/lib/utils/budget-date";
import { todayDateString } from "@/lib/utils/timezone";

export type PersonalGrowthIntensity = "light" | "normal" | "intense";

export type PersonalGrowthFocusState = {
  area: string | null;
  goal: string | null;
  tags: string[];
  intensity: PersonalGrowthIntensity;
  horizonDays: number;
  updatedAt: string | null;
};

const DEFAULTS: Omit<PersonalGrowthFocusState, "updatedAt"> & { updatedAt: null } = {
  area: null,
  goal: null,
  tags: [],
  intensity: "normal",
  horizonDays: 14,
  updatedAt: null,
};

function normLabel(v: string | null | undefined, max: number): string | null {
  if (v == null) return null;
  const t = String(v).trim();
  if (!t) return null;
  return t.slice(0, max);
}

function normTags(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === "string")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function normIntensity(v: unknown): PersonalGrowthIntensity {
  return v === "light" || v === "intense" ? v : "normal";
}

function normHorizonDays(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return DEFAULTS.horizonDays;
  return Math.max(7, Math.min(28, Math.floor(n)));
}

/** Cached per request — Personal Growth hub. */
export const getPersonalGrowthFocus = cache(async (): Promise<PersonalGrowthFocusState> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return DEFAULTS;

  const { data, error } = await supabase
    .from("user_preferences")
    .select(
      "personal_growth_focus_area, personal_growth_focus_goal, personal_growth_focus_tags, personal_growth_intensity, personal_growth_horizon_days, personal_growth_updated_at",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    const msg = error.message ?? "";
    if (
      error.code === "42703" ||
      msg.includes("personal_growth_") ||
      msg.toLowerCase().includes("schema cache")
    ) {
      return DEFAULTS;
    }
    throw new Error(error.message);
  }

  if (!data) return DEFAULTS;

  const row = data as {
    personal_growth_focus_area?: string | null;
    personal_growth_focus_goal?: string | null;
    personal_growth_focus_tags?: unknown;
    personal_growth_intensity?: string | null;
    personal_growth_horizon_days?: number | null;
    personal_growth_updated_at?: string | null;
  };

  return {
    area: normLabel(row.personal_growth_focus_area, 42),
    goal: normLabel(row.personal_growth_focus_goal, 400),
    tags: normTags(row.personal_growth_focus_tags),
    intensity: normIntensity(row.personal_growth_intensity),
    horizonDays: normHorizonDays(row.personal_growth_horizon_days ?? DEFAULTS.horizonDays),
    updatedAt: row.personal_growth_updated_at ?? null,
  };
});

export async function setPersonalGrowthFocus(params: {
  area: string | null;
  goal: string | null;
  tags: string[];
  intensity: PersonalGrowthIntensity;
  horizonDays: number;
}): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Niet ingelogd.");

  const patch = {
    personal_growth_focus_area: normLabel(params.area, 42),
    personal_growth_focus_goal: normLabel(params.goal, 400),
    personal_growth_focus_tags: normTags(params.tags),
    personal_growth_intensity: normIntensity(params.intensity),
    personal_growth_horizon_days: normHorizonDays(params.horizonDays),
    personal_growth_updated_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data: existing, error: selErr } = await supabase
    .from("user_preferences")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (selErr && selErr.code !== "PGRST116") throw new Error(selErr.message);

  const write = existing
    ? supabase.from("user_preferences").update(patch).eq("user_id", user.id)
    : supabase.from("user_preferences").insert({ user_id: user.id, ...patch });

  const { error } = await write;
  if (error) {
    const msg = error.message ?? "";
    if (error.code === "42703" || msg.includes("personal_growth_") || msg.toLowerCase().includes("schema cache")) {
      throw new Error("Database nog niet gemigreerd (Personal Growth prefs).");
    }
    throw new Error(error.message);
  }

  revalidatePath("/learning");
  revalidatePath("/dashboard");
}

export type PersonalGrowthWeekStats = {
  weekStart: string;
  weekEnd: string;
  total: number;
  done: number;
  open: number;
};

function hasPersonalGrowthTag(taskTags: unknown): boolean {
  if (!Array.isArray(taskTags)) return false;
  return taskTags.some((t) => typeof t === "string" && (t === "personal_growth" || t.startsWith("pg_") || t.startsWith("pg:")));
}

/** Lightweight stats for the current budget week (Mon–Sun) for Personal Growth tasks. */
export const getPersonalGrowthWeekStats = cache(async (): Promise<PersonalGrowthWeekStats> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const today = todayDateString();
  const { start, end } = getBudgetWeekBounds(today);
  if (!user) return { weekStart: start, weekEnd: end, total: 0, done: 0, open: 0 };

  const { data, error } = await supabase
    .from("tasks")
    .select("completed, task_tags, deleted_at")
    .eq("user_id", user.id)
    .gte("due_date", start)
    .lte("due_date", end)
    .is("deleted_at", null);
  if (error) return { weekStart: start, weekEnd: end, total: 0, done: 0, open: 0 };

  const rows = (data ?? []) as Array<{ completed?: boolean | null; task_tags?: unknown }>;
  const scoped = rows.filter((r) => hasPersonalGrowthTag(r.task_tags));
  const total = scoped.length;
  const done = scoped.filter((r) => r.completed === true).length;
  const open = Math.max(0, total - done);
  return { weekStart: start, weekEnd: end, total, done, open };
});

export type PersonalGrowthWeeklyHighlights = {
  biggestWin: { title: string; occurredAt: string } | null;
  biggestFailure: { title: string; detail: string; occurredAt: string | null } | null;
};

function nextDayIso(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString();
}

/** Key events (win/failure) for the current budget week for Personal Growth tasks. */
export const getPersonalGrowthWeeklyHighlights = cache(async (): Promise<PersonalGrowthWeeklyHighlights> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const today = todayDateString();
  const { start, end } = getBudgetWeekBounds(today);
  if (!user) return { biggestWin: null, biggestFailure: null };

  const { data: tasks, error: tErr } = await supabase
    .from("tasks")
    .select("id, title, completed, completed_at, task_tags, deleted_at")
    .eq("user_id", user.id)
    .gte("due_date", start)
    .lte("due_date", end)
    .is("deleted_at", null);
  if (tErr) return { biggestWin: null, biggestFailure: null };

  const growthTasks = (tasks ?? [])
    .map((t) => t as { id: string; title: string; completed?: boolean | null; completed_at?: string | null; task_tags?: unknown })
    .filter((t) => hasPersonalGrowthTag(t.task_tags));

  const biggestWinTask = growthTasks
    .filter((t) => t.completed === true && !!t.completed_at)
    .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())[0];

  const biggestWin = biggestWinTask
    ? { title: biggestWinTask.title, occurredAt: String(biggestWinTask.completed_at) }
    : null;

  // Failures = skip/reschedule/delete outcomes on growth tasks, inside the week.
  const growthIds = growthTasks.map((t) => t.id);
  let biggestFailure: PersonalGrowthWeeklyHighlights["biggestFailure"] = null;

  if (growthIds.length > 0) {
    const { data: outcomes } = await supabase
      .from("mission_outcome_events")
      .select("outcome, task_id, occurred_at")
      .eq("user_id", user.id)
      .in("task_id", growthIds)
      .gte("occurred_at", `${start}T00:00:00.000Z`)
      .lt("occurred_at", nextDayIso(end));

    const rows = (outcomes ?? []) as Array<{ outcome?: string | null; task_id?: string | null; occurred_at?: string | null }>;
    const bad = rows.filter((r) => r.outcome === "skip" || r.outcome === "reschedule" || r.outcome === "delete");
    if (bad.length > 0) {
      const counts = { skip: 0, reschedule: 0, delete: 0 } as Record<"skip" | "reschedule" | "delete", number>;
      for (const r of bad) counts[r.outcome as "skip" | "reschedule" | "delete"]++;

      const topOutcome = (Object.entries(counts) as Array<[keyof typeof counts, number]>).sort((a, b) => b[1] - a[1])[0]!;
      const lastBad = bad
        .slice()
        .sort((a, b) => new Date(String(b.occurred_at)).getTime() - new Date(String(a.occurred_at)).getTime())[0];

      const label =
        topOutcome[0] === "skip" ? "momenten genegeerd" : topOutcome[0] === "delete" ? "missies verwijderd" : "missies verschoven";
      biggestFailure = {
        title: `${topOutcome[1]} ${label}`,
        detail: `Outcome: ${topOutcome[0]} · ${topOutcome[1]}× deze week`,
        occurredAt: lastBad?.occurred_at ?? null,
      };
    }
  }

  return { biggestWin, biggestFailure };
});

