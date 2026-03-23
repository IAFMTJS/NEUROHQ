import type { MasterMissionTemplate } from "@/lib/mission-templates";

export type MissionProgressionKey =
  | "deep_focus"
  | "energy_walk"
  | "recovery_reset"
  | "structure_reset";

type ProgressionTier = {
  tier: number;
  durationMinutes: number;
  baseXP: number;
  energy: number;
  label: string;
};

export type MissionProgressionState = {
  currentTier: number;
  completions: number;
};

export type MissionProgressionStateMap = Record<string, MissionProgressionState>;

export type MissionProgressionPlan = {
  key: MissionProgressionKey;
  tier: number;
  nextTier: number | null;
  maxTier: number;
  durationMinutes: number;
  baseXP: number;
  energy: number;
  noteLine: string;
  taskTags: string[];
};

export type MissionProgressionTagMeta = {
  key: MissionProgressionKey;
  tier: number;
  nextTier: number | null;
  maxTier: number;
};

const PROGRESSION_LADDERS: Record<MissionProgressionKey, ProgressionTier[]> = {
  deep_focus: [
    { tier: 1, durationMinutes: 30, baseXP: 50, energy: 3, label: "Focus Tier 1" },
    { tier: 2, durationMinutes: 45, baseXP: 75, energy: 4, label: "Focus Tier 2" },
    { tier: 3, durationMinutes: 60, baseXP: 100, energy: 5, label: "Focus Tier 3" },
    { tier: 4, durationMinutes: 90, baseXP: 120, energy: 6, label: "Focus Tier 4" },
  ],
  energy_walk: [
    { tier: 1, durationMinutes: 10, baseXP: 25, energy: 2, label: "Walk Tier 1" },
    { tier: 2, durationMinutes: 20, baseXP: 50, energy: 2, label: "Walk Tier 2" },
    { tier: 3, durationMinutes: 30, baseXP: 75, energy: 3, label: "Walk Tier 3" },
    { tier: 4, durationMinutes: 45, baseXP: 100, energy: 4, label: "Walk Tier 4" },
  ],
  recovery_reset: [
    { tier: 1, durationMinutes: 5, baseXP: 25, energy: 1, label: "Recovery Tier 1" },
    { tier: 2, durationMinutes: 10, baseXP: 40, energy: 2, label: "Recovery Tier 2" },
    { tier: 3, durationMinutes: 15, baseXP: 60, energy: 2, label: "Recovery Tier 3" },
    { tier: 4, durationMinutes: 20, baseXP: 80, energy: 3, label: "Recovery Tier 4" },
  ],
  structure_reset: [
    { tier: 1, durationMinutes: 5, baseXP: 25, energy: 2, label: "Structure Tier 1" },
    { tier: 2, durationMinutes: 10, baseXP: 50, energy: 3, label: "Structure Tier 2" },
    { tier: 3, durationMinutes: 15, baseXP: 75, energy: 3, label: "Structure Tier 3" },
    { tier: 4, durationMinutes: 25, baseXP: 100, energy: 4, label: "Structure Tier 4" },
  ],
};

type TemplateLike = Pick<
  MasterMissionTemplate,
  "id" | "title" | "subcategory" | "tags" | "energy" | "baseXP"
>;

function toLower(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function clampTier(tier: number, maxTier: number): number {
  return Math.max(1, Math.min(maxTier, Math.round(tier)));
}

function maxTierForKey(key: MissionProgressionKey): number {
  return PROGRESSION_LADDERS[key].length;
}

export function deriveProgressionKeyFromTemplate(
  template: TemplateLike
): MissionProgressionKey | null {
  const subcategory = toLower(template.subcategory ?? null);
  const title = toLower(template.title);
  const id = toLower(template.id);
  const tags = Array.isArray(template.tags)
    ? template.tags.map((tag) => toLower(tag))
    : [];

  if (subcategory.startsWith("focus_") || id.includes("deep-work") || title.includes("deep work")) {
    return "deep_focus";
  }
  if (
    subcategory === "energy_movement" ||
    title.includes("walk") ||
    id.includes("walk")
  ) {
    return "energy_walk";
  }
  if (
    subcategory === "energy_recovery" ||
    tags.includes("recovery") ||
    title.includes("recovery")
  ) {
    return "recovery_reset";
  }
  if (subcategory.startsWith("structure_")) {
    return "structure_reset";
  }
  return null;
}

export function buildMissionProgressionStateMap(
  rows: Array<{ progression_key?: unknown; current_tier?: unknown; completions?: unknown }>
): MissionProgressionStateMap {
  const out: MissionProgressionStateMap = {};
  for (const row of rows) {
    const key = typeof row.progression_key === "string" ? row.progression_key : null;
    if (!key) continue;
    const currentTierRaw =
      typeof row.current_tier === "number" && Number.isFinite(row.current_tier)
        ? row.current_tier
        : 0;
    const completionsRaw =
      typeof row.completions === "number" && Number.isFinite(row.completions)
        ? row.completions
        : 0;
    out[key] = {
      currentTier: Math.max(0, Math.round(currentTierRaw)),
      completions: Math.max(0, Math.round(completionsRaw)),
    };
  }
  return out;
}

export function resolveMissionProgressionPlan(
  template: TemplateLike,
  stateMap: MissionProgressionStateMap
): MissionProgressionPlan | null {
  const key = deriveProgressionKeyFromTemplate(template);
  if (!key) return null;

  const ladder = PROGRESSION_LADDERS[key];
  const maxTier = ladder.length;
  const currentTier = stateMap[key]?.currentTier ?? 0;
  const targetTier = clampTier(currentTier + 1, maxTier);
  const tierConfig = ladder[targetTier - 1];
  const nextTier = targetTier < maxTier ? targetTier + 1 : null;

  return {
    key,
    tier: tierConfig.tier,
    nextTier,
    maxTier,
    durationMinutes: tierConfig.durationMinutes,
    baseXP: tierConfig.baseXP,
    energy: tierConfig.energy,
    noteLine: `[Progression] ${tierConfig.label} (${tierConfig.durationMinutes} min, ${tierConfig.baseXP} XP)${
      nextTier ? ` → next tier ${nextTier}` : " (max tier)"
    }`,
    taskTags: [
      `progression_key:${key}`,
      `progression_tier:${tierConfig.tier}`,
      `progression_next:${nextTier ?? "max"}`,
      `progression_max:${maxTier}`,
    ],
  };
}

function extractStringTags(taskTags: unknown): string[] {
  if (!Array.isArray(taskTags)) return [];
  return taskTags.filter((tag): tag is string => typeof tag === "string");
}

function extractTagValue(tags: string[], prefix: string): string | null {
  const match = tags.find((tag) => tag.startsWith(prefix));
  if (!match) return null;
  return match.slice(prefix.length) || null;
}

export function parseMissionProgressionFromTaskTags(
  taskTags: unknown
): MissionProgressionTagMeta | null {
  const tags = extractStringTags(taskTags);
  if (tags.length === 0) return null;

  const keyRaw = extractTagValue(tags, "progression_key:");
  if (!keyRaw || !(keyRaw in PROGRESSION_LADDERS)) return null;
  const key = keyRaw as MissionProgressionKey;
  const maxTierRaw = extractTagValue(tags, "progression_max:");
  const maxTier = maxTierRaw ? clampTier(Number(maxTierRaw), maxTierForKey(key)) : maxTierForKey(key);

  const tierRaw = extractTagValue(tags, "progression_tier:");
  const tier = tierRaw ? clampTier(Number(tierRaw), maxTier) : 1;

  const nextRaw = extractTagValue(tags, "progression_next:");
  const nextTier =
    nextRaw == null || nextRaw === "max"
      ? null
      : clampTier(Number(nextRaw), maxTier);

  return {
    key,
    tier,
    nextTier,
    maxTier,
  };
}
