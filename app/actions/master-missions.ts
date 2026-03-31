"use server";

import { revalidatePath } from "next/cache";
import { revalidateTagMax } from "@/lib/revalidate";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { getBehaviorProfile } from "@/app/actions/behavior-profile";
import { getAvoidanceTracker } from "@/app/actions/avoidance-tracker";
import { createTask } from "@/app/actions/tasks";
import { bandFor10Scale, getMissionCountRangeForEnergyBand, missionEquivalentFromEnergyRequired } from "@/lib/behavioral-engine";
import { getSuggestedTaskCount } from "@/lib/utils/energy";
import { computeBrainMode } from "@/lib/brain-mode";
import { computeAutoMissionTarget, pickAutoMissionsSmart, type PickedMissionTemplate } from "@/lib/master-mission-pool";
import { MASTER_MISSION_POOL } from "@/lib/mission-templates";
import { getUserPreferencesOrDefaults } from "@/app/actions/preferences";
import { trackEvent } from "@/app/actions/analytics-events";
import { todayDateString } from "@/lib/utils/timezone";
import { classifyTaskPreset, deriveBaseXpFromIntensityDuration } from "@/lib/task-presets";
import { buildMissionProgressionStateMap, resolveMissionProgressionPlan } from "@/lib/mission-progression";

type DailyStateRow = {
  energy?: number | null;
  focus?: number | null;
  sensory_load?: number | null;
  social_load?: number | null;
  physical_health?: number | null;
  sleep_hours?: number | null;
  auto_master_missions_generated?: boolean | null;
};

export type EnsureMasterMissionsResult = {
  created: number;
  debug?: string;
  createError?: string;
  /** True when service-role client was available (SUPABASE_SERVICE_ROLE_KEY set). Used to show the right hint on the mission page. */
  serviceRoleAvailable?: boolean;
};

/** When provided (by saveDailyState or getDailyStateForAllocator), we skip the daily_state read so the allocator always sees the row. */
export type DailyStateFromSave = {
  energy: number | null;
  focus: number | null;
  sensory_load: number | null;
  social_load: number | null;
  physical_health?: number | null;
  sleep_hours: number | null;
  auto_master_missions_generated: boolean;
};

/** Fetch today's daily_state with service-role so the mission page always sees the row if it exists. Call this before ensureMasterMissionsForToday and pass the result so the allocator doesn't rely on an internal read. */
export async function getDailyStateForAllocator(): Promise<DailyStateFromSave | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const serviceSupabase = createServiceRoleClient();
  if (!serviceSupabase) return null;
  const dateStr = todayDateString();
  const { data: row } = await serviceSupabase
    .from("daily_state")
    .select("energy, focus, sensory_load, social_load, physical_health, sleep_hours, auto_master_missions_generated")
    .eq("user_id", user.id)
    .eq("date", dateStr)
    .maybeSingle();
  if (!row) return null;
  return {
    energy: row.energy ?? null,
    focus: row.focus ?? null,
    sensory_load: row.sensory_load ?? null,
    social_load: row.social_load ?? null,
      physical_health: (row as { physical_health?: number | null }).physical_health ?? null,
    sleep_hours: row.sleep_hours ?? null,
    auto_master_missions_generated: row.auto_master_missions_generated ?? false,
  };
}

/** Uses todayDateString() so the same "today" is used as for brain status — no date mismatch. */
export async function ensureMasterMissionsForToday(dailyStateFromSave?: DailyStateFromSave | null): Promise<EnsureMasterMissionsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    if (process.env.NODE_ENV === "development") console.log("[auto-missions] exit: no_user");
    return { created: 0, debug: "no_user" };
  }

  const serviceSupabase = createServiceRoleClient();
  const db = serviceSupabase ?? supabase;
  const dateStr = todayDateString();

  const prefs = await getUserPreferencesOrDefaults();
  if (!prefs.auto_master_missions) {
    if (process.env.NODE_ENV === "development") console.log("[auto-missions] exit: auto_off");
    return { created: 0, debug: "auto_off" };
  }

  const usualDaysOff = prefs.usual_days_off ?? null;
  const dayOffMode = prefs.day_off_mode ?? "soft";
  const today = new Date(dateStr + "T12:00:00Z");
  const isoWeekday = ((today.getUTCDay() || 7) as 1 | 2 | 3 | 4 | 5 | 6 | 7);
  const isUsualDayOff = usualDaysOff?.includes(isoWeekday) ?? false;

  let dailyRow: DailyStateRow | null;
  if (dailyStateFromSave != null) {
    dailyRow = {
      energy: dailyStateFromSave.energy,
      focus: dailyStateFromSave.focus,
      sensory_load: dailyStateFromSave.sensory_load,
      social_load: dailyStateFromSave.social_load,
      physical_health: (dailyStateFromSave as { physical_health?: number | null }).physical_health ?? null,
      sleep_hours: dailyStateFromSave.sleep_hours,
      auto_master_missions_generated: dailyStateFromSave.auto_master_missions_generated,
    };
    if (process.env.NODE_ENV === "development") console.log("[auto-missions] using daily_state from save (skip read)", { dateStr });
  } else {
    const { data: dailyRowRaw } = await db
      .from("daily_state")
      .select("energy, focus, sensory_load, social_load, physical_health, sleep_hours, auto_master_missions_generated")
      .eq("user_id", user.id)
      .eq("date", dateStr)
      .maybeSingle();
    dailyRow = dailyRowRaw as DailyStateRow | null;
    if (!dailyRow && supabase !== db) {
      const { data: fallback } = await supabase
        .from("daily_state")
        .select("energy, focus, sensory_load, social_load, physical_health, sleep_hours, auto_master_missions_generated")
        .eq("user_id", user.id)
        .eq("date", dateStr)
        .maybeSingle();
      dailyRow = fallback as DailyStateRow | null;
    }
    if (process.env.NODE_ENV === "development") console.log("[auto-missions] daily_state read", { dateStr, hasRow: !!dailyRow, hasServiceRole: !!serviceSupabase });
  }

  // First-time users: only allocate auto missions once brain state exists and is set (energy & focus).
  const hasBrainStatus = !!dailyRow;
  if (!hasBrainStatus) {
    if (process.env.NODE_ENV === "development") console.log("[auto-missions] exit: no_brain_status", { dateStr });
    return { created: 0, debug: "no_brain_status", serviceRoleAvailable: !!serviceSupabase };
  }

  const stateRow = dailyRow as DailyStateRow;
  if (stateRow.energy == null || stateRow.focus == null) {
    if (process.env.NODE_ENV === "development") console.log("[auto-missions] exit: brain_status_default", { dateStr });
    return { created: 0, debug: "no_brain_status", serviceRoleAvailable: !!serviceSupabase };
  }

  // Count existing auto-missions first so we can self-heal when flag is set but no tasks exist.
  const { data: allAutoToday } = await db
    .from("tasks")
    .select("id, title, psychology_label, completed")
    .eq("user_id", user.id)
    .eq("due_date", dateStr)
    .eq("psychology_label", "MasterPoolAuto")
    .is("parent_task_id", null)
    .is("deleted_at", null);
  const allAutoTasks = allAutoToday ?? [];
  const existingAutoCount = allAutoTasks.length;
  const autoMasterTitles = new Set(
    allAutoTasks.map((t) => (t as { title?: string | null }).title ?? "").filter(Boolean)
  );

  const DEFAULT_SLIDER = 5;
  const energy = stateRow.energy ?? DEFAULT_SLIDER;
  const energyBand = bandFor10Scale(energy);
  const missionRange = getMissionCountRangeForEnergyBand(energyBand);
  const MIN_AUTO_PER_DAY = missionRange.min;
  const MAX_AUTO_PER_DAY = missionRange.max;

  // Smarter target (clamped to band min/max) so we don’t overfill on days with many user tasks.
  const { data: allOpenToday } = await db
    .from("tasks")
    .select("energy_required, psychology_label, completed")
    .eq("user_id", user.id)
    .eq("due_date", dateStr)
    .eq("completed", false)
    .is("parent_task_id", null)
    .is("deleted_at", null);
  const openToday = (allOpenToday ?? []) as Array<{
    energy_required?: number | null;
    psychology_label?: string | null;
    completed?: boolean | null;
  }>;
  const nonAutoOpen = openToday.filter(
    (t) => (t.psychology_label ?? null) !== "MasterPoolAuto" && (t.psychology_label ?? null) !== "MasterPoolBonus"
  );
  const existingNonAutoCount = nonAutoOpen.length;
  const existingNonAutoEquivalents = nonAutoOpen.reduce((sum, t) => {
    const eq = missionEquivalentFromEnergyRequired(t.energy_required ?? null);
    return sum + (Number.isFinite(eq) ? eq : 1);
  }, 0);

  const focus = stateRow.focus ?? DEFAULT_SLIDER;
  const sensory_load = stateRow.sensory_load ?? DEFAULT_SLIDER;
  const social_load = stateRow.social_load ?? DEFAULT_SLIDER;
  const sleep_hours = stateRow.sleep_hours ?? null;

  const profile = await getBehaviorProfile();
  let progressionStateMap = buildMissionProgressionStateMap([]);
  try {
    const { data: progressionRows } = await (db as any)
      .from("mission_progression_state")
      .select("progression_key, current_tier, completions")
      .eq("user_id", user.id);
    progressionStateMap = buildMissionProgressionStateMap(
      (progressionRows ?? []) as Array<{
        progression_key?: unknown;
        current_tier?: unknown;
        completions?: unknown;
      }>
    );
  } catch {
    progressionStateMap = buildMissionProgressionStateMap([]);
  }

  // Remaining slots will be computed after we compute the smart target for today.
  let remainingSlots = 0;

  const headroom = 20;
  const brainMode = computeBrainMode({
    energy,
    focus,
    sensory_load,
    headroom,
  });

  const avoidanceTracker = await getAvoidanceTracker();
  const allowHeavyNow = brainMode.mode !== "LowEnergy" && (!isUsualDayOff || dayOffMode === "soft");

  // Recently used auto-mission titles (last 42 days, excluding today) so the pool avoids repeats longer.
  const recentHistoryStart = new Date(dateStr);
  recentHistoryStart.setDate(recentHistoryStart.getDate() - 42);
  const recentHistoryStartStr = recentHistoryStart.toISOString().slice(0, 10);
  const { data: recentAuto } = await db
    .from("tasks")
    .select("title")
    .eq("user_id", user.id)
    .eq("psychology_label", "MasterPoolAuto")
    .gte("due_date", recentHistoryStartStr)
    .lt("due_date", dateStr)
    .is("parent_task_id", null)
    .is("deleted_at", null);
  const recentlyUsedTitles = new Set(
    (recentAuto ?? []).map((r) => (r as { title?: string | null }).title ?? "").filter(Boolean)
  );

  const recentlyUsedSubcategories = new Set<string>();
  for (const title of recentlyUsedTitles) {
    const tpl = MASTER_MISSION_POOL.find((t) => (t.title ?? "").trim() === title);
    if (tpl?.subcategory) recentlyUsedSubcategories.add(tpl.subcategory);
  }

  const targetAuto = computeAutoMissionTarget(
    {
      profile,
      weekTheme: profile.weekTheme,
      avoidanceTracker,
      allowHeavyNow,
      recentlyUsedTitles,
      recentlyUsedSubcategories,
      dateStr,
      energy1To10: energy ?? null,
      focus1To10: focus ?? null,
      sensoryLoad1To10: sensory_load ?? null,
      socialLoad1To10: social_load ?? null,
      sleepHours: sleep_hours ?? null,
      brainMode: brainMode.mode,
      dayType: isUsualDayOff ? (dayOffMode === "hard" ? "off_hard" : "off_soft") : "work",
      existingNonAutoCount,
      existingNonAutoEquivalents,
      progressionStateMap,
    },
    { min: MIN_AUTO_PER_DAY, max: MAX_AUTO_PER_DAY }
  );

  const desiredToCreate = Math.max(0, targetAuto - existingAutoCount);

  if (desiredToCreate <= 0) {
    // Mark as generated so we don’t re-run unnecessarily; missions are already assigned.
    try {
      await db
        .from("daily_state")
        .update({ auto_master_missions_generated: true } as any)
        .eq("user_id", user.id)
        .eq("date", dateStr);
    } catch {
      // best-effort
    }
    if (process.env.NODE_ENV === "development") console.log("[auto-missions] exit: already_enough", { existingAutoCount, targetAuto });
    return { created: 0, debug: "already_enough" };
  }

  if (stateRow.auto_master_missions_generated && existingAutoCount < MIN_AUTO_PER_DAY && process.env.NODE_ENV === "development") {
    console.log("[auto-missions] self-heal: flag was true but only", existingAutoCount, "auto-missions, creating more");
  }

  remainingSlots = desiredToCreate;

  const picks = pickAutoMissionsSmart(
    {
      profile,
      weekTheme: profile.weekTheme,
      avoidanceTracker,
      allowHeavyNow,
      recentlyUsedTitles,
      recentlyUsedSubcategories,
      dateStr,
      energy1To10: energy ?? null,
      focus1To10: focus ?? null,
      sensoryLoad1To10: sensory_load ?? null,
      socialLoad1To10: social_load ?? null,
      sleepHours: sleep_hours ?? null,
      brainMode: brainMode.mode,
      dayType: isUsualDayOff ? (dayOffMode === "hard" ? "off_hard" : "off_soft") : "work",
      existingNonAutoCount,
      existingNonAutoEquivalents,
      progressionStateMap,
    },
    desiredToCreate
  );

  if (picks.length === 0) {
    if (process.env.NODE_ENV === "development") console.log("[auto-missions] exit: no_picks");
    return { created: 0, debug: "no_picks" };
  }

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

  // Smart picker already avoids repeats; keep final guardrails here.
  let toCreate: PickedMissionTemplate[] = uniqueByTitle(
    picks.filter((p) => p.title && !autoMasterTitles.has(p.title))
  ).slice(0, remainingSlots);

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

  if (toCreate.length === 0) {
    if (process.env.NODE_ENV === "development") console.log("[auto-missions] exit: to_create_empty");
    return { created: 0, debug: "to_create_empty" };
  }

  let created = 0;
  let firstError: string | undefined;
  for (const tpl of toCreate) {
    const title = tpl.title?.trim();
    if (!title) continue;
    if (autoMasterTitles.has(title)) continue;
    // Re-check: another request may have created this title already (unique constraint also enforces at DB level).
    const { data: existingRows } = await db
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
    const missionIntent =
      tpl.tags?.includes("recovery") || tpl.slot === "energy" || (tpl.subcategory?.startsWith("energy_") ?? false)
        ? "recovery"
        : tpl.slot === "procrastination_attack"
          ? "experiment"
          : "discipline";

    try {
      const preset = classifyTaskPreset(title);
      const progressionPlan = resolveMissionProgressionPlan(tpl, progressionStateMap);
      const fallbackBaseXp = deriveBaseXpFromIntensityDuration(preset.intensity, preset.durationMinutes);
      const progressionEnergy = progressionPlan?.energy ?? null;
      const energyRequired =
        progressionEnergy ??
        tpl.energy ??
        Math.min(10, Math.max(1, Math.round(preset.intensity / 10)));
      const focusRequired = preset.type === "mental" ? 7 : preset.type === "mixed" ? 5 : 3;
      const mentalLoad = preset.type === "mental" ? 8 : preset.type === "mixed" ? 5 : preset.type === "recovery" ? 2 : 3;
      const socialLoad = preset.type === "physical" ? 3 : preset.type === "recovery" ? 2 : 5;
      /** DB cognitive_load is 0.1–1; mental_load is 1–10. */
      const cognitiveLoadNorm = Math.min(1, Math.max(0.1, Math.round((mentalLoad / 10) * 100) / 100));
      const templateTags = Array.from(
        new Set([...(tpl.tags ?? []), ...(progressionPlan?.taskTags ?? [])])
      );
      const resolvedDurationMinutes = progressionPlan?.durationMinutes ?? preset.durationMinutes;
      const resolvedBaseXp = Math.max(
        progressionPlan?.baseXP ?? tpl.baseXP ?? 0,
        fallbackBaseXp
      );
      const notesBase = (tpl as { description?: string }).description?.trim() || null;
      const autoReason = tpl.reason?.trim() || null;
      const progressionNote = progressionPlan?.noteLine ?? null;
      const notesWithReason =
        notesBase && autoReason
          ? `${notesBase}\n\n[Auto reason] ${autoReason}`
          : notesBase ?? (autoReason ? `[Auto reason] ${autoReason}` : null);
      const notes =
        notesWithReason && progressionNote
          ? `${notesWithReason}\n\n${progressionNote}`
          : notesWithReason ?? progressionNote;
      if (serviceSupabase) {
        const row = {
          user_id: user.id,
          title,
          due_date: dateStr,
          energy_required: energyRequired,
          focus_required: focusRequired,
          mental_load: mentalLoad,
          social_load: socialLoad,
          cognitive_load: cognitiveLoadNorm,
          category: tpl.category ?? null,
          impact,
          domain: tpl.domain ?? null,
          base_xp: resolvedBaseXp,
          psychology_label: "MasterPoolAuto",
          avoidance_tag: tpl.avoidance_tag ?? null,
          hobby_tag: tpl.hobby_tag ?? null,
          notes,
          mission_intent: missionIntent,
          task_type: preset.type,
          intensity: preset.intensity,
          duration_minutes: resolvedDurationMinutes,
          task_tags: templateTags,
        } satisfies Record<string, unknown>;
        const { error } = await serviceSupabase.from("tasks").insert(row as any);
        if (error) throw new Error(error.message);
        revalidateTagMax(`tasks-${user.id}-${dateStr}`);
        revalidatePath("/dashboard");
        revalidatePath("/tasks");
      } else {
        await createTask({
          title,
          due_date: dateStr,
          energy_required: energyRequired,
          focus_required: focusRequired,
          mental_load: mentalLoad,
          social_load: socialLoad,
          cognitive_load: cognitiveLoadNorm,
          category: tpl.category ?? null,
          impact,
          domain: tpl.domain,
          base_xp: resolvedBaseXp,
          psychology_label: "MasterPoolAuto",
          avoidance_tag: tpl.avoidance_tag ?? null,
          hobby_tag: tpl.hobby_tag ?? null,
          notes,
          mission_intent: missionIntent,
          task_type: preset.type,
          intensity: preset.intensity,
          duration_minutes: resolvedDurationMinutes,
          task_tags: templateTags,
        });
      }
      created++;
      if (progressionPlan) {
        const prev = progressionStateMap[progressionPlan.key];
        progressionStateMap[progressionPlan.key] = {
          currentTier: Math.max(prev?.currentTier ?? 0, progressionPlan.tier),
          completions: prev?.completions ?? 0,
        };
      }
      autoMasterTitles.add(title);
      await trackEvent("mission_suggested", {
        taskTitle: title,
        source: "auto_master_pool",
        date: dateStr,
        psychology_label: "MasterPoolAuto",
      });
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
  // Mark that auto-missions have been generated for today so we never auto-add
  // more until tomorrow. Cast payload to any to avoid drift with generated
  // Supabase types while the SQL migration adds this column.
  try {
    await db
      .from("daily_state")
      .update({ auto_master_missions_generated: true } as any)
      .eq("user_id", user.id)
      .eq("date", dateStr);
  } catch {
    // best-effort; if this fails we still created tasks.
  }

  if (process.env.NODE_ENV === "development") console.log("[auto-missions] done", { created, createError: created === 0 ? firstError : undefined });
  return {
    created,
    debug: created === 0 ? "create_failed" : undefined,
    createError: created === 0 ? firstError : undefined,
    serviceRoleAvailable: !!serviceSupabase,
  };
}

/** Soft-delete newest MasterPoolAuto tasks past the cap for the current energy band (brain status update). */
export async function trimAutoMasterMissionsToEnergyBand(
  userId: string,
  dateStr: string,
  energy: number | null
): Promise<{ removed: number }> {
  const band = bandFor10Scale(energy ?? 5);
  const { max } = getMissionCountRangeForEnergyBand(band);
  const serviceSupabase = createServiceRoleClient();
  const db = serviceSupabase ?? (await createClient());
  const { data: rows } = await db
    .from("tasks")
    .select("id, created_at")
    .eq("user_id", userId)
    .eq("due_date", dateStr)
    .eq("psychology_label", "MasterPoolAuto")
    .is("parent_task_id", null)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  const list = (rows ?? []) as { id: string }[];
  if (list.length <= max) return { removed: 0 };
  const toRemove = list.slice(max);
  const now = new Date().toISOString();
  let removed = 0;
  for (const r of toRemove) {
    const { error } = await db.from("tasks").update({ deleted_at: now }).eq("id", r.id);
    if (!error) removed++;
  }
  if (removed > 0) {
    revalidateTagMax(`tasks-${userId}-${dateStr}`);
    revalidatePath("/tasks");
    revalidatePath("/dashboard");
  }
  return { removed };
}

/** Optional: add 1–2 bonus auto-missions for today after baseline is done. */
export async function addBonusAutoMissionsForToday(): Promise<EnsureMasterMissionsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { created: 0, debug: "no_user" };

  const dateStr = todayDateString();

  const { data: dailyRowRaw } = await supabase
    .from("daily_state")
    .select("energy, focus, sensory_load, social_load, physical_health, sleep_hours")
    .eq("user_id", user.id)
    .eq("date", dateStr)
    .maybeSingle();
  const dailyRow = dailyRowRaw as DailyStateRow | null;
  if (!dailyRow) return { created: 0, debug: "no_brain_status" };
  if (dailyRow.energy == null || dailyRow.focus == null) return { created: 0, debug: "no_brain_status" };

  const energy = dailyRow.energy ?? null;
  const focus = dailyRow.focus ?? null;
  const sensory_load = dailyRow.sensory_load ?? null;
  const social_load = dailyRow.social_load ?? null;

  const profile = await getBehaviorProfile();
  const avoidanceTracker = await getAvoidanceTracker();

  const headroom = 15;
  const brainMode = computeBrainMode({
    energy,
    focus,
    sensory_load,
    headroom,
  });

  const allowHeavyNow = brainMode.mode !== "LowEnergy";

  const fiveDaysAgo = new Date(dateStr);
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
  const fiveDaysAgoStr = fiveDaysAgo.toISOString().slice(0, 10);
  const { data: recentAuto } = await supabase
    .from("tasks")
    .select("title")
    .eq("user_id", user.id)
    .in("psychology_label", ["MasterPoolAuto", "MasterPoolBonus"])
    .gte("due_date", fiveDaysAgoStr)
    .lte("due_date", dateStr)
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

  const toCreate = picks.slice(0, 2);
  let created = 0;
  let firstError: string | undefined;

  for (const tpl of toCreate) {
    const title = tpl.title?.trim();
    if (!title) continue;

    try {
      const preset = classifyTaskPreset(title);
      const fallbackBaseXp = deriveBaseXpFromIntensityDuration(preset.intensity, preset.durationMinutes);
      const energyRequired = tpl.energy ?? Math.min(10, Math.max(1, Math.round(preset.intensity / 10)));
      const focusRequired = preset.type === "mental" ? 7 : preset.type === "mixed" ? 5 : 3;
      const mentalLoad = preset.type === "mental" ? 8 : preset.type === "mixed" ? 5 : preset.type === "recovery" ? 2 : 3;
      const socialLoad = preset.type === "physical" ? 3 : preset.type === "recovery" ? 2 : 5;
      const cognitiveLoadNorm = Math.min(1, Math.max(0.1, Math.round((mentalLoad / 10) * 100) / 100));
      const impactRaw = tpl.baseXP ? Math.round((tpl.baseXP / 10) * 1.5) : 2;
      const impact = Math.min(3, Math.max(1, impactRaw));
      await createTask({
        title,
        due_date: dateStr,
        energy_required: energyRequired,
        focus_required: focusRequired,
        mental_load: mentalLoad,
        social_load: socialLoad,
        cognitive_load: cognitiveLoadNorm,
        category: tpl.category ?? null,
        impact,
        domain: tpl.domain,
        base_xp: Math.max(tpl.baseXP ?? 0, fallbackBaseXp),
        psychology_label: "MasterPoolBonus",
        avoidance_tag: tpl.avoidance_tag ?? null,
        hobby_tag: tpl.hobby_tag ?? null,
        notes: (tpl as { description?: string }).description?.trim() || "Bonus-missie uit de pool.",
        mission_intent:
          tpl.tags?.includes("recovery") || brainMode.mode === "LowEnergy"
            ? "recovery"
            : "discipline",
        task_type: preset.type,
        intensity: preset.intensity,
        duration_minutes: preset.durationMinutes,
        task_tags: tpl.tags ?? [],
      });
      created++;
      await trackEvent("mission_suggested", {
        taskTitle: title,
        source: "auto_master_bonus",
        date: dateStr,
        psychology_label: "MasterPoolBonus",
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!firstError) firstError = msg;
    }
  }

  return {
    created,
    debug: created === 0 ? "bonus_failed" : "bonus_ok",
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
    // Also reset the generated flag so next run can create fresh ones.
    await supabase
      .from("daily_state")
      .update({ auto_master_missions_generated: false } as any)
      .eq("user_id", user.id)
      .eq("date", today);
    revalidatePath("/tasks");
    revalidatePath("/dashboard");
    return { deleted: 0 };
  }

  const { error } = await supabase.from("tasks").delete().in("id", ids);
  if (error) return { deleted: 0, error: error.message };

  await supabase
    .from("daily_state")
    .update({ auto_master_missions_generated: false } as any)
    .eq("user_id", user.id)
    .eq("date", today);

  revalidateTagMax(`tasks-${user.id}-${today}`);
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { deleted: ids.length };
}

