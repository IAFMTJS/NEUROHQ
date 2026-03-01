import type { BehaviorProfile } from "@/types/behavior-profile.types";
import type { AvoidanceTracker } from "@/app/actions/avoidance-tracker";
import { MASTER_MISSION_POOL, type MasterMissionTemplate } from "@/lib/mission-templates";

export type WeekTheme = BehaviorProfile["weekTheme"];

export type PickedMissionTemplate = MasterMissionTemplate & {
  slot: "structure_energy_focus" | "procrastination_attack" | "identity_courage_hobby";
  reason: string;
};

export type PickContext = {
  profile: BehaviorProfile;
  weekTheme: WeekTheme;
  avoidanceTracker: AvoidanceTracker;
  allowHeavyNow: boolean;
  /** Titles of auto-missions used in the last N days (excluding today). Used to prefer variety. */
  recentlyUsedTitles?: Set<string>;
  /** Date string (YYYY-MM-DD) for deterministic daily rotation so the same brain state gives different missions each day. */
  dateStr?: string;
  /** Brain circles: 1–10. Low energy → prefer energy_recovery; low focus → prefer focus_*; high sensory → prefer calm/recovery; high social → prefer solo focus. */
  energy1To10?: number | null;
  focus1To10?: number | null;
  sensoryLoad1To10?: number | null;
  socialLoad1To10?: number | null;
};

function isHeavy(t: MasterMissionTemplate): boolean {
  return (t.energy ?? 0) >= 4;
}

function pickStructureEnergyFocus(context: PickContext, max: number): PickedMissionTemplate[] {
  const { weekTheme, allowHeavyNow, recentlyUsedTitles, dateStr, energy1To10, focus1To10, sensoryLoad1To10, socialLoad1To10 } = context;

  const base = MASTER_MISSION_POOL.filter((t) =>
    t.subcategory?.startsWith("structure_") ||
    t.subcategory?.startsWith("energy_") ||
    t.subcategory?.startsWith("focus_")
  );

  const themedScore = (t: MasterMissionTemplate): number => {
    let score = 0;
    if (!allowHeavyNow && isHeavy(t)) score -= 5;
    if (weekTheme && t.tags?.includes(weekTheme)) score += 3;
    if (weekTheme === "environment_reset" && t.tags?.includes("environment_reset")) score += 2;
    if (weekTheme === "self_discipline" && t.tags?.includes("self_discipline")) score += 2;
    if (weekTheme === "health_body" && t.tags?.includes("health_body")) score += 2;
    if (weekTheme === "courage" && t.tags?.includes("courage")) score += 2;
    // Prefer lower energy for low‑energy contexts (handled via allowHeavyNow)
    score -= Math.max(0, (t.energy ?? 0) - 3) * 0.2;
    // Brain circles: low energy → prefer energy_recovery / energy_nervous_system
    if (energy1To10 != null && energy1To10 < 5 && (t.subcategory?.startsWith("energy_") ?? false)) score += 2;
    if (energy1To10 != null && energy1To10 < 4 && t.tags?.includes("recovery")) score += 1;
    // Brain circles: low focus → prefer focus_attention / focus_reflection
    if (focus1To10 != null && focus1To10 < 5 && (t.subcategory?.startsWith("focus_") ?? false)) score += 2;
    // Brain circles: high sensory load → prefer calm, recovery, nervous system (low-stimulus)
    if (sensoryLoad1To10 != null && sensoryLoad1To10 >= 6 && (t.subcategory?.startsWith("energy_") ?? false)) score += 1.5;
    if (sensoryLoad1To10 != null && sensoryLoad1To10 >= 6 && t.tags?.includes("recovery")) score += 1;
    // Brain circles: high social load → prefer solo, focus, structure (less social)
    if (socialLoad1To10 != null && socialLoad1To10 >= 6 && (t.subcategory?.startsWith("focus_") ?? false)) score += 1;
    if (socialLoad1To10 != null && socialLoad1To10 >= 6 && (t.subcategory?.startsWith("structure_") ?? false)) score += 0.5;
    return score;
  };

  const sorted = [...base].sort((a, b) => themedScore(b) - themedScore(a));

  // Prefer missions not used recently; then apply date-based rotation so we don’t always get the same top 2.
  const notRecent = recentlyUsedTitles?.size
    ? sorted.filter((t) => t.title && !recentlyUsedTitles.has(t.title))
    : sorted;
  const pool = notRecent.length >= max ? notRecent : sorted;
  const topN = Math.min(8, pool.length);
  const takeFrom = pool.slice(0, topN);

  let chosen: MasterMissionTemplate[];
  if (dateStr && takeFrom.length > max) {
    const daySeed = dateStr.split("-").map(Number).reduce((a, b) => a + b, 0);
    const start = daySeed % takeFrom.length;
    chosen = [];
    const seen = new Set<string>();
    for (let i = 0; chosen.length < max && i < takeFrom.length; i++) {
      const t = takeFrom[(start + i) % takeFrom.length];
      if (t.title && !seen.has(t.title)) {
        seen.add(t.title);
        chosen.push(t);
      }
    }
  } else {
    chosen = takeFrom.slice(0, max);
  }

  return chosen.map((t) => ({
    ...t,
    slot: "structure_energy_focus" as const,
    reason:
      weekTheme === "environment_reset"
        ? "Structure/Energy/Focus missie die past bij Environment Reset."
        : weekTheme === "self_discipline"
          ? "Structure/Energy/Focus missie die zelfdiscipline traint."
          : weekTheme === "health_body"
            ? "Structure/Energy/Focus missie die je lichaam en energie ondersteunt."
            : weekTheme === "courage"
              ? "Structure/Energy/Focus missie met lichte courage‑component."
              : "Structure/Energy/Focus missie voor vandaag.",
  }));
}

function pickHighestAvoidanceTag(tracker: AvoidanceTracker): { tag: "household" | "administration" | "social"; skipped: number } | null {
  const tags: ("household" | "administration" | "social")[] = ["household", "administration", "social"];
  let best: { tag: "household" | "administration" | "social"; skipped: number } | null = null;
  for (const tag of tags) {
    const stats = tracker[tag];
    if (!stats) continue;
    if (!best || stats.skipped > best.skipped) {
      best = { tag, skipped: stats.skipped };
    }
  }
  if (!best || best.skipped <= 0) return null;
  return best;
}

function pickProcrastinationAttack(context: PickContext): PickedMissionTemplate[] {
  const top = pickHighestAvoidanceTag(context.avoidanceTracker);
  if (!top) return [];

  const candidates = MASTER_MISSION_POOL.filter(
    (t) => t.subcategory?.startsWith("procrastination_") && t.avoidance_tag === top.tag
  );
  if (candidates.length === 0) return [];

  const t = candidates[0];
  return [
    {
      ...t,
      slot: "procrastination_attack",
      reason: `Procrastination Attack voor ${top.tag} (skipped ${top.skipped}×).`,
    },
  ];
}

function pickIdentityCourageHobby(context: PickContext): PickedMissionTemplate[] {
  const { profile } = context;
  const picks: PickedMissionTemplate[] = [];

  // Identity first
  const firstIdentity = profile.identityTargets[0] as
    | "disciplined"
    | "fit_person"
    | "good_dog_owner"
    | "financial_control"
    | undefined;
  if (firstIdentity) {
    const idTemplate = MASTER_MISSION_POOL.find((t) => t.identity_tag === firstIdentity);
    if (idTemplate) {
      picks.push({
        ...idTemplate,
        slot: "identity_courage_hobby",
        reason: "Identity‑missie op basis van je gekozen identity target.",
      });
      return picks;
    }
  }

  // Then courage
  const courage = MASTER_MISSION_POOL.find((t) => t.subcategory === "courage");
  if (courage) {
    picks.push({
      ...courage,
      slot: "identity_courage_hobby",
      reason: "Korte courage‑missie om sociale avoidance te doorbreken.",
    });
    return picks;
  }

  // Finally hobby, gebaseerd op hoogst commitment
  const entries = Object.entries(profile.hobbyCommitment);
  if (entries.length > 0) {
    const [key, value] =
      entries.reduce<[string, number] | null>((acc, [k, v]) => {
        if (typeof v !== "number") return acc;
        if (!acc || v > acc[1]) return [k, v];
        return acc;
      }, null) ?? ["", 0];
    if (key && value >= 0.4) {
      const hobbyTemplate = MASTER_MISSION_POOL.find((t) => t.hobby_tag === key);
      if (hobbyTemplate) {
        picks.push({
          ...hobbyTemplate,
          slot: "identity_courage_hobby",
          reason: "Hobby‑missie op basis van je hoogste hobby‑commitment.",
        });
      }
    }
  }

  return picks;
}

/** Return array with unique titles only (first occurrence wins). */
function uniqueByTitle<T extends { title?: string | null }>(arr: T[]): T[] {
  const seen = new Set<string>();
  return arr.filter((p) => {
    const t = p.title?.trim();
    if (!t || seen.has(t)) return false;
    seen.add(t);
    return true;
  });
}

/**
 * Selectielaag boven de Master Mission Pool.
 *
 * Doel:
 * - 1–2 Structure/Energy/Focus‑missies (altijd), geen dubbele titels.
 * - 1 Procrastination Attack (indien avoidance hoog genoeg).
 * - 1 Identity/Courage/Hobby‑missie (op basis van BehaviorProfile).
 */
export function pickMissionsForDay(context: PickContext): PickedMissionTemplate[] {
  const structureEnergy = pickStructureEnergyFocus(context, 2);
  const procrastination = pickProcrastinationAttack(context);
  const identityCourageHobby = pickIdentityCourageHobby(context);

  return uniqueByTitle([...structureEnergy, ...procrastination, ...identityCourageHobby]);
}

