import type { BehaviorProfile } from "@/types/behavior-profile.types";
import type { AvoidanceTracker } from "@/app/actions/avoidance-tracker";
import { MASTER_MISSION_POOL, type MasterMissionTemplate } from "@/lib/mission-templates";
import { evaluateTemplateAgainstTriggers, resolveMissionTriggers } from "@/lib/mission-triggers";
import { bandFor10Scale, getMissionCountRangeForEnergyBand, missionEquivalentFromEnergyRequired } from "@/lib/behavioral-engine";
import type { MissionProgressionStateMap } from "@/lib/mission-progression";
import { deriveProgressionKeyFromTemplate } from "@/lib/mission-progression";

/** Deterministic 32-bit hash for daily ordering (no Math.random). */
function djb2Hash(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h, 33) ^ str.charCodeAt(i);
  }
  return h >>> 0;
}

/** Round-robin interleave so picks mix structure / energy / focus instead of one subcategory dominating. */
function diversifyBySubcategoryPrefix(templates: MasterMissionTemplate[]): MasterMissionTemplate[] {
  const buckets: MasterMissionTemplate[][] = [[], [], [], []];
  for (const t of templates) {
    const sc = t.subcategory ?? "";
    if (sc.startsWith("structure_")) buckets[0].push(t);
    else if (sc.startsWith("energy_")) buckets[1].push(t);
    else if (sc.startsWith("focus_")) buckets[2].push(t);
    else buckets[3].push(t);
  }
  const out: MasterMissionTemplate[] = [];
  for (let guard = 0; guard < 400; guard++) {
    let moved = false;
    for (const b of buckets) {
      if (b.length) {
        out.push(b.shift()!);
        moved = true;
      }
    }
    if (!moved) break;
  }
  return out.length ? out : templates;
}

export type WeekTheme = BehaviorProfile["weekTheme"];

export type AutoMissionSlot =
  | "structure"
  | "energy"
  | "focus"
  | "procrastination_attack"
  | "identity_courage_hobby";

export type PickedMissionTemplate = MasterMissionTemplate & {
  slot: AutoMissionSlot | "structure_energy_focus";
  reason: string;
  reason_code?: string;
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
  sleepHours?: number | null;
  brainMode?: "Stable" | "Driven" | "Cautious" | "LowEnergy" | null;
  /** Day type for scheduling bias (work vs typical days off). */
  dayType?: "work" | "off_soft" | "off_hard";
  /** Existing non-auto missions already on the day (open). Used to avoid overfilling. */
  existingNonAutoCount?: number;
  /** Existing non-auto mission equivalents (approx via energy_required). */
  existingNonAutoEquivalents?: number;
  /** Optional progression map: helps bias toward incremental “ladder” missions. */
  progressionStateMap?: MissionProgressionStateMap;
  /** Optional cooldown set: subcategories used recently (derived from recent titles). */
  recentlyUsedSubcategories?: Set<string>;
};

function isHeavy(t: MasterMissionTemplate): boolean {
  return (t.energy ?? 0) >= 4;
}

export function computeAutoMissionTarget(context: PickContext, input: { min: number; max: number }): number {
  const min = Math.max(0, Math.round(input.min));
  const max = Math.max(min, Math.round(input.max));

  const dayType = context.dayType ?? "work";
  const energy = context.energy1To10 ?? 5;
  const focus = context.focus1To10 ?? 5;
  const load = context.sensoryLoad1To10 ?? 5;

  // Base: lean toward the upper bound on good days; toward the lower bound on low energy/high load.
  let target = max;

  if (dayType === "off_hard") target = Math.min(target, min + 1);
  if (dayType === "off_soft") target = Math.min(target, Math.max(min, max - 1));

  // Low energy / low focus / high load → fewer auto missions.
  if (energy <= 3) target = Math.min(target, min + 0);
  else if (energy <= 5) target = Math.min(target, Math.max(min, max - 1));

  if (focus <= 3) target = Math.min(target, Math.max(min, max - 1));
  if (load >= 7) target = Math.min(target, Math.max(min, max - 1));

  // Don’t overfill days that already have a lot of user tasks.
  const existingCount = Math.max(0, context.existingNonAutoCount ?? 0);
  const existingEq = Math.max(0, context.existingNonAutoEquivalents ?? 0);

  // If the day is already “full”, reduce auto target aggressively.
  if (existingCount >= 8 || existingEq >= 10) target = min;
  else if (existingCount >= 6 || existingEq >= 8) target = Math.max(min, target - 1);
  else if (existingCount >= 4 || existingEq >= 6) target = Math.max(min, target - 0);

  return Math.max(min, Math.min(max, Math.round(target)));
}

export function buildAutoMissionSlotPlan(context: PickContext, target: number): AutoMissionSlot[] {
  const n = Math.max(0, Math.round(target));
  if (n === 0) return [];

  const dayType = context.dayType ?? "work";
  const energy = context.energy1To10 ?? 5;
  const focus = context.focus1To10 ?? 5;
  const load = context.sensoryLoad1To10 ?? 5;

  const isRecoveryDay = dayType === "off_soft" || dayType === "off_hard";

  const slots: AutoMissionSlot[] = [];

  // Recovery day: only structure/energy, alternating.
  if (isRecoveryDay) {
    for (let i = 0; i < n; i++) {
      slots.push(i % 2 === 0 ? "structure" : "energy");
    }
    return slots;
  }

  // Work day baseline: structure first.
  slots.push("structure");

  const wantsEnergy = energy <= 4 || load >= 7;
  const wantsFocus = focus <= 5 && load <= 7;

  if (wantsEnergy && slots.length < n) slots.push("energy");
  if (wantsFocus && slots.length < n) slots.push("focus");

  // Avoidance: ensure at least one procrastination attack when meaningful.
  const topAvoidance = pickHighestAvoidanceTag(context.avoidanceTracker);
  if (topAvoidance && topAvoidance.skipped >= 2 && slots.length < n) {
    slots.push("procrastination_attack");
  }

  // Identity/hobby: add once when there is room.
  if ((context.profile?.identityTargets?.length ?? 0) > 0 && slots.length < n) {
    slots.push("identity_courage_hobby");
  }

  // Fill remaining with a deficit-driven cycle.
  while (slots.length < n) {
    const last = slots[slots.length - 1];
    const pick =
      energy <= 4 ? "energy" : focus <= 5 ? "focus" : load >= 7 ? "energy" : "structure";
    // Avoid 3 of the same in a row.
    const last2 = slots.slice(-2);
    if (last2.length === 2 && last2[0] === pick && last2[1] === pick) {
      slots.push(last === "structure" ? "focus" : "structure");
    } else {
      slots.push(pick);
    }
  }

  return slots;
}

function pickStructureEnergyFocus(context: PickContext, max: number): PickedMissionTemplate[] {
  const {
    weekTheme,
    allowHeavyNow,
    recentlyUsedTitles,
    dateStr,
    energy1To10,
    focus1To10,
    sensoryLoad1To10,
    socialLoad1To10,
    sleepHours,
    brainMode,
    dayType,
  } = context;

  let base = MASTER_MISSION_POOL.filter((t) =>
    t.subcategory?.startsWith("structure_") ||
    t.subcategory?.startsWith("energy_") ||
    t.subcategory?.startsWith("focus_")
  );
  // Recovery mode on day off: only structure + energy, no pressure. off_hard = strict (no focus, energy ≤ 3, no push).
  if (dayType === "off_hard") {
    base = base.filter(
      (t) =>
        (t.subcategory?.startsWith("structure_") || t.subcategory?.startsWith("energy_")) &&
        (t.energy ?? 0) <= 3 &&
        !t.tags?.includes("push")
    );
  } else if (dayType === "off_soft") {
    base = base.filter(
      (t) => (t.subcategory?.startsWith("structure_") || t.subcategory?.startsWith("energy_")) && !t.tags?.includes("push")
    );
  }

  const activeTriggers = resolveMissionTriggers({
    energy1To10,
    focus1To10,
    sensoryLoad1To10,
    socialLoad1To10,
    sleepHours,
    dayType,
    allowHeavyNow,
    brainMode,
  });
  const triggerEvalCache = new Map<string, ReturnType<typeof evaluateTemplateAgainstTriggers>>();
  const triggerEval = (template: MasterMissionTemplate) => {
    const key = template.id;
    const cached = triggerEvalCache.get(key);
    if (cached) return cached;
    const next = evaluateTemplateAgainstTriggers(template, activeTriggers);
    triggerEvalCache.set(key, next);
    return next;
  };

  const triggerFiltered = base.filter((template) => !triggerEval(template).blocked);
  if (triggerFiltered.length > 0) {
    base = triggerFiltered;
  }

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
    // Day-off bias: op vrije dagen meer recovery/omgeving/huishouden, minder zware "push".
    if (dayType === "off_soft" || dayType === "off_hard") {
      if (t.tags?.includes("recovery") || t.subcategory?.startsWith("energy_")) score += 1.5;
      if (t.subcategory?.startsWith("structure_")) score += 0.5;
      if (dayType === "off_hard" && t.tags?.includes("push")) score -= 2;
    }
    score += triggerEval(t).score;
    return score;
  };

  const sorted = [...base].sort((a, b) => themedScore(b) - themedScore(a));
  const diversified = diversifyBySubcategoryPrefix(sorted);

  // Prefer missions not used recently; then apply date-based rotation so we don’t always get the same top 2.
  const notRecent = recentlyUsedTitles?.size
    ? diversified.filter((t) => t.title && !recentlyUsedTitles.has(t.title))
    : diversified;
  const pool = notRecent.length >= max ? notRecent : diversified;
  /**
   * How many score-ranked templates enter the daily shuffle. It used to be 8, so the same ~8
   * missions (top of sort + weektheme/brain bias) rotated forever despite a 100+ pool.
   */
  const topN = Math.min(72, pool.length);
  const takeFrom = pool.slice(0, topN);

  let chosen: MasterMissionTemplate[];
  if (dateStr && takeFrom.length > 0) {
    const shuffled = [...takeFrom].sort(
      (a, b) => djb2Hash(`${dateStr}|${a.id}`) - djb2Hash(`${dateStr}|${b.id}`)
    );
    chosen = [];
    const seen = new Set<string>();
    for (const t of shuffled) {
      if (chosen.length >= max) break;
      if (t.title && !seen.has(t.title)) {
        seen.add(t.title);
        chosen.push(t);
      }
    }
  } else {
    chosen = [];
    const seen = new Set<string>();
    for (const t of takeFrom) {
      if (chosen.length >= max) break;
      if (t.title && !seen.has(t.title)) {
        seen.add(t.title);
        chosen.push(t);
      }
    }
  }

  return chosen.map((t) => ({
    ...t,
    slot: "structure_energy_focus" as const,
    reason: (() => {
      const triggerReasons = triggerEval(t).reasons.slice(0, 4);
      const triggerReasonText =
        triggerReasons.length > 0
          ? ` Triggers: ${triggerReasons.join(", ")}.`
          : "";
      const baseReason =
        weekTheme === "environment_reset"
          ? "Structure/Energy/Focus missie die past bij Environment Reset."
          : weekTheme === "self_discipline"
            ? "Structure/Energy/Focus missie die zelfdiscipline traint."
            : weekTheme === "health_body"
              ? "Structure/Energy/Focus missie die je lichaam en energie ondersteunt."
              : weekTheme === "courage"
                ? "Structure/Energy/Focus missie met lichte courage‑component."
                : "Structure/Energy/Focus missie voor vandaag.";
      return baseReason + triggerReasonText;
    })(),
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

function slotToPrefixes(slot: AutoMissionSlot): { prefixes: string[]; allowMixed?: boolean } {
  if (slot === "structure") return { prefixes: ["structure_"] };
  if (slot === "energy") return { prefixes: ["energy_"] };
  if (slot === "focus") return { prefixes: ["focus_"] };
  return { prefixes: [] };
}

function scoreTemplateForSlot(context: PickContext, t: MasterMissionTemplate, slot: AutoMissionSlot): number {
  let score = 0;

  const energy = context.energy1To10 ?? 5;
  const focus = context.focus1To10 ?? 5;
  const load = context.sensoryLoad1To10 ?? 5;
  const dayType = context.dayType ?? "work";

  // Cooldowns: titles and subcategories.
  if (context.recentlyUsedTitles?.has(t.title)) score -= 6;
  if (context.recentlyUsedSubcategories?.has(t.subcategory ?? "")) score -= 2.5;

  // Heavy handling.
  if (!context.allowHeavyNow && isHeavy(t)) score -= 5;

  // Slot alignment.
  if (slot === "energy") {
    if (t.tags?.includes("recovery")) score += 1.5;
    if (energy <= 4 && (t.subcategory?.startsWith("energy_") ?? false)) score += 1.5;
  }
  if (slot === "focus") {
    if (focus <= 5 && (t.subcategory?.startsWith("focus_") ?? false)) score += 1.5;
    if (load >= 7 && t.tags?.includes("social")) score -= 2;
  }
  if (slot === "structure") {
    if (t.tags?.includes("structure")) score += 0.75;
    if (dayType !== "work" && t.subcategory?.startsWith("structure_")) score += 0.5;
  }

  // High load: reduce stimulation & social/courage; prefer calm/recovery.
  if (load >= 7) {
    if (t.tags?.includes("courage") || t.tags?.includes("social")) score -= 3;
    if (t.tags?.includes("recovery")) score += 1.2;
    if (t.subcategory === "energy_nervous_system") score += 1.2;
  }

  // Week theme alignment.
  const weekTheme = context.weekTheme;
  if (weekTheme && t.tags?.includes(weekTheme)) score += 2.5;

  // Progression bias (gentle): prefer missions with a progression ladder that isn’t maxed.
  if (context.progressionStateMap) {
    const key = deriveProgressionKeyFromTemplate(t);
    if (key) {
      const currentTier = context.progressionStateMap[key]?.currentTier ?? 0;
      // Ladders are 4 tiers today.
      if (currentTier < 4) score += 0.9;
      // Avoid pushing deep focus on low energy.
      if (key === "deep_focus" && energy <= 4) score -= 2;
    }
  }

  return score;
}

function pickOneForSlot(context: PickContext, slot: AutoMissionSlot, usedTitles: Set<string>): PickedMissionTemplate | null {
  if (slot === "procrastination_attack") {
    const pick = pickProcrastinationAttack(context)[0] ?? null;
    if (pick && pick.title && !usedTitles.has(pick.title)) return pick;
    return null;
  }
  if (slot === "identity_courage_hobby") {
    const pick = pickIdentityCourageHobby(context)[0] ?? null;
    if (pick && pick.title && !usedTitles.has(pick.title)) return pick;
    return null;
  }

  const { prefixes } = slotToPrefixes(slot);
  let candidates = MASTER_MISSION_POOL.filter((t) => {
    const sc = t.subcategory ?? "";
    return prefixes.some((p) => sc.startsWith(p));
  });

  // Day-type restrictions.
  if (context.dayType === "off_hard") {
    candidates = candidates.filter((t) => (t.energy ?? 0) <= 3 && !t.tags?.includes("push"));
  }
  if (context.dayType === "off_soft") {
    candidates = candidates.filter((t) => !t.tags?.includes("push"));
  }

  // Trigger gating for structure/energy/focus candidates.
  const activeTriggers = resolveMissionTriggers({
    energy1To10: context.energy1To10,
    focus1To10: context.focus1To10,
    sensoryLoad1To10: context.sensoryLoad1To10,
    socialLoad1To10: context.socialLoad1To10,
    sleepHours: context.sleepHours,
    dayType: context.dayType,
    allowHeavyNow: context.allowHeavyNow,
    brainMode: context.brainMode,
  });
  const triggerEvalCache = new Map<string, ReturnType<typeof evaluateTemplateAgainstTriggers>>();
  const triggerEval = (template: MasterMissionTemplate) => {
    const cached = triggerEvalCache.get(template.id);
    if (cached) return cached;
    const next = evaluateTemplateAgainstTriggers(template, activeTriggers);
    triggerEvalCache.set(template.id, next);
    return next;
  };
  const filtered = candidates.filter((t) => !triggerEval(t).blocked);
  if (filtered.length > 0) candidates = filtered;

  // Deterministic daily rotation over top-scoring candidates.
  const scored = [...candidates]
    .filter((t) => t.title && !usedTitles.has(t.title))
    .sort((a, b) => scoreTemplateForSlot(context, b, slot) - scoreTemplateForSlot(context, a, slot));

  if (scored.length === 0) return null;

  const topN = Math.min(48, scored.length);
  const top = scored.slice(0, topN);
  const dateStr = context.dateStr ?? "1970-01-01";
  const idx = top.length > 1 ? djb2Hash(`${dateStr}|${slot}`) % top.length : 0;
  const chosen = top[idx] ?? top[0]!;

  const trig = triggerEval(chosen);
  const triggerReasons = trig.reasons.slice(0, 3);
  const triggerText = triggerReasons.length ? ` Triggers: ${triggerReasons.join(", ")}.` : "";

  return {
    ...chosen,
    slot,
    reason_code: `slot:${slot}`,
    reason: `${slot === "structure" ? "Structure" : slot === "energy" ? "Energy" : "Focus"} missie die past bij je status vandaag.` + triggerText,
  };
}

export function pickAutoMissionsSmart(context: PickContext, target: number): PickedMissionTemplate[] {
  const slots = buildAutoMissionSlotPlan(context, target);
  const usedTitles = new Set<string>();
  const out: PickedMissionTemplate[] = [];

  for (const slot of slots) {
    const pick = pickOneForSlot(context, slot, usedTitles);
    if (!pick?.title) continue;
    if (usedTitles.has(pick.title)) continue;
    usedTitles.add(pick.title);
    out.push(pick);
  }

  return uniqueByTitle(out);
}

function pickProcrastinationAttack(context: PickContext): PickedMissionTemplate[] {
  const top = pickHighestAvoidanceTag(context.avoidanceTracker);
  if (!top) return [];

  const candidates = MASTER_MISSION_POOL.filter(
    (t) => t.subcategory?.startsWith("procrastination_") && t.avoidance_tag === top.tag
  );
  if (candidates.length === 0) return [];

  const ordered = [...candidates].sort((a, b) => a.id.localeCompare(b.id));
  const notRecent =
    context.recentlyUsedTitles?.size
      ? ordered.filter((t) => !context.recentlyUsedTitles?.has(t.title))
      : ordered;
  const pool = notRecent.length > 0 ? notRecent : ordered;
  const idx =
    context.dateStr && pool.length > 1
      ? djb2Hash(`${context.dateStr}|procrastination|${top.tag}`) % pool.length
      : 0;
  const t = pool[idx]!;
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
  const isRecent = (title: string) => (context.recentlyUsedTitles?.has(title) ?? false);

  // Identity first
  const firstIdentity = profile.identityTargets[0] as
    | "disciplined"
    | "fit_person"
    | "good_dog_owner"
    | "financial_control"
    | undefined;
  if (firstIdentity) {
    const identityCandidates = MASTER_MISSION_POOL.filter((t) => t.identity_tag === firstIdentity);
    const preferred = identityCandidates.find((t) => t.title && !isRecent(t.title)) ?? identityCandidates[0];
    const idTemplate = preferred ?? null;
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
  const courageCandidates = MASTER_MISSION_POOL.filter((t) => t.subcategory === "courage");
  const courage = courageCandidates.find((t) => t.title && !isRecent(t.title)) ?? courageCandidates[0];
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
      const hobbyCandidates = MASTER_MISSION_POOL.filter((t) => t.hobby_tag === key);
      const hobbyTemplate = hobbyCandidates.find((t) => t.title && !isRecent(t.title)) ?? hobbyCandidates[0];
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
 *
 * On usual days off (off_soft / off_hard): recovery mode — only structure + energy picks,
 * no procrastination or identity/courage/hobby; 2–3 slots from structure/energy pool.
 */
export function pickMissionsForDay(context: PickContext): PickedMissionTemplate[] {
  const isRecoveryDay = context.dayType === "off_soft" || context.dayType === "off_hard";
  const structureEnergy = pickStructureEnergyFocus(context, isRecoveryDay ? 3 : 2);
  if (isRecoveryDay) {
    return uniqueByTitle(structureEnergy);
  }
  const procrastination = pickProcrastinationAttack(context);
  const identityCourageHobby = pickIdentityCourageHobby(context);
  return uniqueByTitle([...structureEnergy, ...procrastination, ...identityCourageHobby]);
}

