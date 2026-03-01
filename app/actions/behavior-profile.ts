"use server";

import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_BEHAVIOR_PROFILE,
  type BehaviorProfile,
  type WeekTheme,
  type AvoidancePattern,
} from "@/types/behavior-profile.types";

export async function getBehaviorProfile(): Promise<BehaviorProfile> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return DEFAULT_BEHAVIOR_PROFILE;

  const { data } = await supabase
    .from("behavior_profile")
    .select("*")
    .eq("user_id", user.id)
    .single();
  if (!data) return DEFAULT_BEHAVIOR_PROFILE;

  const row = data as {
    identity_targets?: string[] | null;
    avoidance_patterns?: unknown;
    energy_pattern?: string | null;
    discipline_level?: string | null;
    minimal_integrity_threshold_days?: number | null;
    confrontation_mode?: string | null;
    pet_type?: string | null;
    pet_attachment_level?: number | null;
    hobby_commitment?: unknown;
    week_theme?: string | null;
  };

  const weekTheme: WeekTheme | null =
    row.week_theme === "environment_reset" ||
    row.week_theme === "self_discipline" ||
    row.week_theme === "health_body" ||
    row.week_theme === "courage"
      ? row.week_theme
      : null;

  return {
    identityTargets: Array.isArray(row.identity_targets) ? row.identity_targets : [],
    avoidancePatterns: Array.isArray(row.avoidance_patterns as AvoidancePattern[])
      ? (row.avoidance_patterns as AvoidancePattern[])
      : [],
    energyPattern:
      row.energy_pattern === "morning_low" ||
      row.energy_pattern === "stable" ||
      row.energy_pattern === "evening_crash"
        ? row.energy_pattern
        : "stable",
    disciplineLevel:
      row.discipline_level === "low" ||
      row.discipline_level === "medium" ||
      row.discipline_level === "high"
        ? row.discipline_level
        : "medium",
    minimalIntegrityThresholdDays:
      typeof row.minimal_integrity_threshold_days === "number"
        ? (Math.min(5, Math.max(2, row.minimal_integrity_threshold_days)) as 2 | 3 | 4 | 5)
        : DEFAULT_BEHAVIOR_PROFILE.minimalIntegrityThresholdDays,
    confrontationMode:
      row.confrontation_mode === "mild" ||
      row.confrontation_mode === "standard" ||
      row.confrontation_mode === "strong"
        ? row.confrontation_mode
        : "standard",
    petType:
      row.pet_type === "dog" ||
      row.pet_type === "cat" ||
      row.pet_type === "other" ||
      row.pet_type === "none"
        ? row.pet_type
        : "none",
    petAttachmentLevel:
      row.pet_attachment_level === 1 || row.pet_attachment_level === 2 ? row.pet_attachment_level : 0,
    hobbyCommitment:
      row.hobby_commitment && typeof row.hobby_commitment === "object"
        ? (row.hobby_commitment as Record<string, number>)
        : {},
    weekTheme,
  };
}

export async function updateBehaviorProfile(profile: BehaviorProfile): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const payload = {
    user_id: user.id,
    identity_targets: profile.identityTargets,
    avoidance_patterns: profile.avoidancePatterns,
    energy_pattern: profile.energyPattern,
    discipline_level: profile.disciplineLevel,
    minimal_integrity_threshold_days: profile.minimalIntegrityThresholdDays,
    confrontation_mode: profile.confrontationMode,
    pet_type: profile.petType,
    pet_attachment_level: profile.petAttachmentLevel,
    hobby_commitment: profile.hobbyCommitment,
    week_theme: profile.weekTheme,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("behavior_profile")
    .upsert(payload, { onConflict: "user_id" });
  if (error) throw new Error(error.message);
}

