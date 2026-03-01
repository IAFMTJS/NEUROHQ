"use server";

import { revalidatePath } from "next/cache";
import { revalidateTagMax } from "@/lib/revalidate";
import { createClient } from "@/lib/supabase/server";
import { getBehaviorProfile } from "@/app/actions/behavior-profile";
import { getAvoidanceTracker } from "@/app/actions/avoidance-tracker";
import { createTask } from "@/app/actions/tasks";
import { getSuggestedTaskCount } from "@/lib/utils/energy";
import { computeBrainMode } from "@/lib/brain-mode";
import { pickMissionsForDay, type PickedMissionTemplate } from "@/lib/master-mission-pool";
import { MASTER_MISSION_POOL } from "@/lib/mission-templates";
import { getUserPreferencesOrDefaults } from "@/app/actions/preferences";
import { todayDateString } from "@/lib/utils/timezone";

type DailyStateRow = {
  energy?: number | null;
  focus?: number | null;
  sensory_load?: number | null;
  social_load?: number | null;
  sleep_hours?: number | null;
};

export type EnsureMasterMissionsResult = { created: number; debug?: string; createError?: string };

/** Uses todayDateString() so the same "today" is used as for brain status — no date mismatch. */
export async function ensureMasterMissionsForToday(): Promise<EnsureMasterMissionsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { created: 0, debug: "no_user" };

  const prefs = await getUserPreferencesOrDefaults();
  if (!prefs.auto_master_missions) {
    return { created: 0, debug: "auto_off" };
  }

  const dateStr = todayDateString();

  // Alle auto-missies van vandaag (ook voltooid/verwijderd) — zo komen ze niet opnieuw terug na afronden of verwijderen.
  const { data: allAutoToday } = await supabase
    .from("tasks")
    .select("id, title, psychology_label, completed, deleted_at")
    .eq("user_id", user.id)
    .eq("due_date", dateStr)
    .eq("psychology_label", "MasterPoolAuto")
    .is("parent_task_id", null);

  const allAutoTasks = allAutoToday ?? [];
  const existingAutoCount = allAutoTasks.length;
  const autoMasterTitles = new Set(
    allAutoTasks.map((t) => (t as { title?: string | null }).title ?? "").filter(Boolean)
  );

  // Only distribute auto-missions when user has set brain status (daily_state) for today.
  const { data: dailyRowRaw } = await supabase
    .from("daily_state")
    .select("energy, focus, sensory_load, social_load, sleep_hours")
    .eq("user_id", user.id)
    .eq("date", dateStr)
    .maybeSingle();

  const dailyRow = dailyRowRaw as DailyStateRow | null;
  if (!dailyRow) {
    return { created: 0, debug: "no_brain_status" };
  }

  const energy = dailyRow?.energy ?? null;
  const focus = dailyRow?.focus ?? null;
  const sensory_load = dailyRow?.sensory_load ?? null;
  const social_load = dailyRow?.social_load ?? null;
  const sleep_hours = dailyRow?.sleep_hours ?? null;

  const profile = await getBehaviorProfile();

  // Auto-missies: streef naar minstens 2 auto-missies per dag (niet op basis van totaal aantal taken).
  const MIN_AUTO_PER_DAY = 2;
  const MAX_AUTO_PER_DAY = 4;
  const slotsToAdd = Math.min(
    MAX_AUTO_PER_DAY - existingAutoCount,
    Math.max(0, MIN_AUTO_PER_DAY - existingAutoCount)
  );

  if (slotsToAdd <= 0) {
    return { created: 0, debug: "already_enough" };
  }

  const remainingSlots = slotsToAdd;

  const headroom = 20;
  const brainMode = computeBrainMode({
    energy,
    focus,
    sensory_load,
    headroom,
  });

  const avoidanceTracker = await getAvoidanceTracker();
  const allowHeavyNow = brainMode.mode !== "LowEnergy";

  // Recently used auto-mission titles (last 5 days, excluding today) so we avoid repeating the same tasks.
  const fiveDaysAgo = new Date(dateStr);
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
  const fiveDaysAgoStr = fiveDaysAgo.toISOString().slice(0, 10);
  const { data: recentAuto } = await supabase
    .from("tasks")
    .select("title")
    .eq("user_id", user.id)
    .eq("psychology_label", "MasterPoolAuto")
    .gte("due_date", fiveDaysAgoStr)
    .lt("due_date", dateStr)
    .is("parent_task_id", null);
  const recentlyUsedTitles = new Set(
    (recentAuto ?? []).map((r) => (r as { title?: string | null }).title ?? "").filter(Boolean)
  );

  const picks = pickMissionsForDay({
    profile,
    weekTheme: profile.weekTheme,
    avoidanceTracker,
    allowHeavyNow,
    recentlyUsedTitles,
    dateStr,
    energy1To10: energy ?? null,
    focus1To10: focus ?? null,
    sensoryLoad1To10: sensory_load ?? null,
    socialLoad1To10: social_load ?? null,
  });

  if (picks.length === 0) return { created: 0, debug: "no_picks" };

  /** Dedupe by title so we never create two tasks with the same title in one run. */
  function uniqueByTitle<T extends { title?: string | null }>(arr: T[]): T[] {
    const seen = new Set<string>();
    return arr.filter((p) => {
      const t = p.title?.trim();
      if (!t || seen.has(t)) return false;
      seen.add(t);
      return true;
    });
  }

  // Prefer missions not used in the last 5 days; fall back to any if none left.
  let toCreate: PickedMissionTemplate[] = uniqueByTitle(
    picks.filter(
      (p) =>
        p.title &&
        !autoMasterTitles.has(p.title) &&
        !recentlyUsedTitles.has(p.title)
    )
  ).slice(0, remainingSlots);
  if (toCreate.length === 0 && remainingSlots > 0) {
    toCreate = uniqueByTitle(picks.filter((p) => p.title && !autoMasterTitles.has(p.title))).slice(0, remainingSlots);
  }

  // Als alle gekozen missies al als taak bestaan: kies andere uit de pool (structure/energy/focus), ook met diversity.
  if (toCreate.length === 0 && remainingSlots > 0) {
    const pool = MASTER_MISSION_POOL.filter(
      (t) =>
        t.title &&
        !autoMasterTitles.has(t.title) &&
        (t.subcategory?.startsWith("structure_") ||
          t.subcategory?.startsWith("energy_") ||
          t.subcategory?.startsWith("focus_"))
    );
    const notRecentFirst = pool.filter((t) => !recentlyUsedTitles.has(t.title ?? ""));
    const source = notRecentFirst.length >= remainingSlots ? notRecentFirst : pool;
    toCreate = uniqueByTitle(
      source.map((t) => ({
        ...t,
        slot: "structure_energy_focus" as const,
        reason: "Extra missie uit de pool.",
      }))
    ).slice(0, remainingSlots);
  }

  if (toCreate.length === 0) return { created: 0, debug: "to_create_empty" };

  let created = 0;
  let firstError: string | undefined;
  for (const tpl of toCreate) {
    const title = tpl.title?.trim();
    if (!title) continue;
    if (autoMasterTitles.has(title)) continue;
    // Re-check: another request may have created this title already (unique constraint also enforces at DB level).
    const { data: existingRows } = await supabase
      .from("tasks")
      .select("id")
      .eq("user_id", user.id)
      .eq("due_date", dateStr)
      .eq("psychology_label", "MasterPoolAuto")
      .eq("title", title)
      .is("parent_task_id", null)
      .is("deleted_at", null)
      .limit(1);
    if (existingRows && existingRows.length > 0) {
      autoMasterTitles.add(title);
      continue;
    }

    const impactRaw = tpl.baseXP ? Math.round((tpl.baseXP / 10) * 1.5) : 2;
    const impact = Math.min(3, Math.max(1, impactRaw));
    try {
      await createTask({
        title,
        due_date: dateStr,
        energy_required: tpl.energy ?? 2,
        category: tpl.category ?? null,
        impact,
        domain: tpl.domain,
        base_xp: tpl.baseXP ?? 50,
        psychology_label: "MasterPoolAuto",
        avoidance_tag: tpl.avoidance_tag ?? null,
        hobby_tag: tpl.hobby_tag ?? null,
        notes: (tpl as { description?: string }).description?.trim() || null,
        mission_intent:
          tpl.tags?.includes("recovery")
            ? "recovery"
            : tpl.slot === "procrastination_attack"
              ? "experiment"
              : tpl.slot === "identity_courage_hobby"
                ? "discipline"
                : "discipline",
      });
      created++;
      autoMasterTitles.add(title);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const isDuplicate = /unique|duplicate|violates|23505/i.test(msg);
      if (isDuplicate) {
        autoMasterTitles.add(title);
        continue;
      }
      if (!firstError) firstError = msg;
    }
  }
  // Do not call revalidatePath/revalidateTag here: this runs during /tasks page render.
  // Next.js forbids revalidation during render. Same request already sees new tasks.
  return {
    created,
    debug: created === 0 ? "create_failed" : undefined,
    createError: created === 0 ? firstError : undefined,
  };
}

/** Removes today's auto-created missions (MasterPoolAuto) so the next load will create fresh ones. Use to test diversity/updates. */
export async function resetAutoMissionsForToday(): Promise<{ deleted: number; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { deleted: 0, error: "Not authenticated" };

  const today = todayDateString();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id")
    .eq("user_id", user.id)
    .eq("due_date", today)
    .eq("psychology_label", "MasterPoolAuto")
    .is("parent_task_id", null);

  const ids = (tasks ?? []).map((t) => (t as { id: string }).id);
  if (ids.length === 0) {
    revalidatePath("/tasks");
    revalidatePath("/dashboard");
    return { deleted: 0 };
  }

  const { error } = await supabase.from("tasks").delete().in("id", ids);
  if (error) return { deleted: 0, error: error.message };

  revalidateTagMax(`tasks-${user.id}-${today}`);
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { deleted: ids.length };
}

