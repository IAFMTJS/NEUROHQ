"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getBehaviorProfile } from "@/app/actions/behavior-profile";
import { getAvoidanceTracker } from "@/app/actions/avoidance-tracker";
import { createTask } from "@/app/actions/tasks";
import { getSuggestedTaskCount } from "@/lib/utils/energy";
import { computeBrainMode } from "@/lib/brain-mode";
import { pickMissionsForDay, type PickedMissionTemplate } from "@/lib/master-mission-pool";
import { MASTER_MISSION_POOL } from "@/lib/mission-templates";
import { getUserPreferencesOrDefaults } from "@/app/actions/preferences";

type DailyStateRow = {
  energy?: number | null;
  focus?: number | null;
  sensory_load?: number | null;
  social_load?: number | null;
  sleep_hours?: number | null;
};

export type EnsureMasterMissionsResult = { created: number; debug?: string; createError?: string };

export async function ensureMasterMissionsForToday(dateStr: string): Promise<EnsureMasterMissionsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { created: 0, debug: "no_user" };

  const prefs = await getUserPreferencesOrDefaults();
  if (!prefs.auto_master_missions) {
    return { created: 0, debug: "auto_off" };
  }

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

  // Read daily_state for brain mode
  const { data: dailyRowRaw } = await supabase
    .from("daily_state")
    .select("energy, focus, sensory_load, social_load, sleep_hours, headroom")
    .eq("user_id", user.id)
    .eq("date", dateStr)
    .single();

  const dailyRow = (dailyRowRaw as (DailyStateRow & { headroom?: number | null })) ?? null;

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

  const headroom = typeof dailyRow?.headroom === "number" ? dailyRow.headroom : 20;
  const brainMode = computeBrainMode({
    energy,
    focus,
    sensory_load,
    headroom,
  });

  const avoidanceTracker = await getAvoidanceTracker();
  const allowHeavyNow = brainMode.mode !== "LowEnergy";

  const picks = pickMissionsForDay({
    profile,
    weekTheme: profile.weekTheme,
    avoidanceTracker,
    allowHeavyNow,
  });

  if (picks.length === 0) return { created: 0, debug: "no_picks" };

  let toCreate: PickedMissionTemplate[] = picks
    .filter((p) => p.title && !autoMasterTitles.has(p.title))
    .slice(0, remainingSlots);

  // Als alle gekozen missies al als taak bestaan: kies andere uit de pool (structure/energy/focus).
  if (toCreate.length === 0 && remainingSlots > 0) {
    const structureEnergyFocus = MASTER_MISSION_POOL.filter(
      (t) =>
        t.title &&
        !autoMasterTitles.has(t.title) &&
        (t.subcategory?.startsWith("structure_") ||
          t.subcategory?.startsWith("energy_") ||
          t.subcategory?.startsWith("focus_"))
    );
    toCreate = structureEnergyFocus.slice(0, remainingSlots).map((t) => ({
      ...t,
      slot: "structure_energy_focus" as const,
      reason: "Extra missie uit de pool.",
    }));
  }

  if (toCreate.length === 0) return { created: 0, debug: "to_create_empty" };

  let created = 0;
  let firstError: string | undefined;
  for (const tpl of toCreate) {
    // impact in DB is 1–3 only (see migration 013)
    const impactRaw = tpl.baseXP ? Math.round((tpl.baseXP / 10) * 1.5) : 2;
    const impact = Math.min(3, Math.max(1, impactRaw));
    try {
      await createTask({
        title: tpl.title ?? "Auto-missie",
        due_date: dateStr,
        energy_required: tpl.energy ?? 2,
        category: tpl.category ?? null,
        impact,
        domain: tpl.domain,
        base_xp: tpl.baseXP ?? 50,
        psychology_label: "MasterPoolAuto",
        avoidance_tag: tpl.avoidance_tag ?? null,
        hobby_tag: tpl.hobby_tag ?? null,
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
    } catch (e) {
      if (!firstError && e instanceof Error) firstError = e.message;
    }
  }
  if (created > 0) {
    revalidateTag(`tasks-${user.id}-${dateStr}`, "max");
    revalidatePath("/tasks");
    revalidatePath("/dashboard");
  }
  return {
    created,
    debug: created === 0 ? "create_failed" : undefined,
    createError: created === 0 ? firstError : undefined,
  };
}

