import type { BrainModeLabel } from "@/lib/brain-mode";
import type { MasterMissionTemplate } from "@/lib/mission-templates";

export type MissionDayType = "work" | "off_soft" | "off_hard";

export type MissionTriggerContext = {
  energy1To10?: number | null;
  focus1To10?: number | null;
  sensoryLoad1To10?: number | null;
  socialLoad1To10?: number | null;
  sleepHours?: number | null;
  dayType?: MissionDayType;
  allowHeavyNow: boolean;
  brainMode?: BrainModeLabel | null;
};

export type MissionTrigger = {
  id: string;
  label: string;
  weight: number;
  includeSubcategoryPrefixes?: string[];
  includeTags?: string[];
  excludeTags?: string[];
  minEnergy?: number;
  maxEnergy?: number;
  hardExclude?: boolean;
};

export type TriggerEvaluation = {
  score: number;
  reasons: string[];
  blocked: boolean;
};

function toValidNumber(value: number | null | undefined): number | null {
  return value != null && Number.isFinite(value) ? Number(value) : null;
}

function hasSubcategoryPrefix(
  template: MasterMissionTemplate,
  prefixes: string[] | undefined
): boolean {
  if (!prefixes || prefixes.length === 0) return false;
  const subcategory = template.subcategory ?? "";
  return prefixes.some((prefix) => subcategory.startsWith(prefix));
}

function hasAnyTag(template: MasterMissionTemplate, tags: string[] | undefined): boolean {
  if (!tags || tags.length === 0) return false;
  const templateTags = template.tags ?? [];
  return tags.some((tag) => templateTags.includes(tag));
}

export function resolveMissionTriggers(
  context: MissionTriggerContext
): MissionTrigger[] {
  const triggers: MissionTrigger[] = [
    {
      id: "baseline_structure_energy_focus",
      label: "Basisset voor structuur/energie/focus",
      weight: 0.5,
      includeSubcategoryPrefixes: ["structure_", "energy_", "focus_"],
    },
  ];

  const energy = toValidNumber(context.energy1To10);
  const focus = toValidNumber(context.focus1To10);
  const sensoryLoad = toValidNumber(context.sensoryLoad1To10);
  const socialLoad = toValidNumber(context.socialLoad1To10);
  const sleepHours = toValidNumber(context.sleepHours);
  const dayType = context.dayType ?? "work";

  if (!context.allowHeavyNow) {
    triggers.push({
      id: "guard_no_heavy_now",
      label: "Geen heavy missions toegestaan in huidige staat",
      weight: 1.5,
      maxEnergy: 3,
      hardExclude: true,
    });
  }

  if (energy != null && energy <= 4) {
    triggers.push({
      id: "low_energy_recovery_bias",
      label: "Lage energie: herstel en lage activatie",
      weight: 2.5,
      includeSubcategoryPrefixes: ["energy_"],
      includeTags: ["recovery"],
      maxEnergy: 3,
      hardExclude: true,
    });
  } else if (energy != null && energy >= 8 && dayType === "work") {
    triggers.push({
      id: "high_energy_execution_bias",
      label: "Hoge energie: meer executie en focus",
      weight: 1.25,
      includeSubcategoryPrefixes: ["focus_", "structure_"],
      minEnergy: 2,
    });
  }

  if (focus != null && focus <= 4) {
    triggers.push({
      id: "low_focus_structure_bias",
      label: "Lage focus: structuur en korte focusblokken",
      weight: 1.75,
      includeSubcategoryPrefixes: ["structure_", "focus_"],
      maxEnergy: 4,
    });
  } else if (focus != null && focus >= 8 && dayType === "work") {
    triggers.push({
      id: "high_focus_deep_work_bias",
      label: "Hoge focus: dieper werk toegestaan",
      weight: 1,
      includeSubcategoryPrefixes: ["focus_"],
      minEnergy: 2,
    });
  }

  if (sensoryLoad != null && sensoryLoad >= 7) {
    triggers.push({
      id: "high_sensory_load_downshift",
      label: "Hoge mentale belasting: downshift naar recovery",
      weight: 2,
      includeSubcategoryPrefixes: ["energy_"],
      includeTags: ["recovery"],
      maxEnergy: 3,
      hardExclude: true,
    });
  }

  if (socialLoad != null && socialLoad >= 7) {
    triggers.push({
      id: "high_social_load_solo_bias",
      label: "Hoge sociale load: solo taken prefereren",
      weight: 1,
      includeSubcategoryPrefixes: ["focus_", "structure_"],
      excludeTags: ["courage"],
    });
  }

  if (sleepHours != null && sleepHours < 6) {
    triggers.push({
      id: "sleep_debt_recovery_guard",
      label: "Slaaptekort: herstel en lagere intensiteit",
      weight: 1.5,
      includeSubcategoryPrefixes: ["energy_", "structure_"],
      includeTags: ["recovery"],
      maxEnergy: 3,
    });
  }

  if (dayType === "off_soft") {
    triggers.push({
      id: "day_off_soft_recovery_mix",
      label: "Vrije dag (soft): herstel + lichte structuur",
      weight: 1.5,
      includeSubcategoryPrefixes: ["energy_", "structure_"],
      excludeTags: ["push"],
      maxEnergy: 4,
    });
  } else if (dayType === "off_hard") {
    triggers.push({
      id: "day_off_hard_recovery_guard",
      label: "Vrije dag (hard): alleen lage intensiteit herstel/structuur",
      weight: 2,
      includeSubcategoryPrefixes: ["energy_", "structure_"],
      includeTags: ["recovery"],
      excludeTags: ["push"],
      maxEnergy: 3,
      hardExclude: true,
    });
  }

  if (context.brainMode === "LowEnergy" || context.brainMode === "Cautious") {
    triggers.push({
      id: "brain_mode_recovery_guard",
      label: "Brain mode voorzichtig/laag: extra recovery-guard",
      weight: 1.5,
      includeSubcategoryPrefixes: ["energy_"],
      includeTags: ["recovery"],
      maxEnergy: 3,
    });
  } else if (context.brainMode === "Driven" && dayType === "work") {
    triggers.push({
      id: "brain_mode_driven_bias",
      label: "Brain mode driven: focus/execution bias",
      weight: 1,
      includeSubcategoryPrefixes: ["focus_", "structure_"],
    });
  }

  return triggers;
}

export function evaluateTemplateAgainstTriggers(
  template: MasterMissionTemplate,
  triggers: MissionTrigger[]
): TriggerEvaluation {
  let score = 0;
  const reasons: string[] = [];
  let blocked = false;

  for (const trigger of triggers) {
    const subMatch = hasSubcategoryPrefix(template, trigger.includeSubcategoryPrefixes);
    const tagMatch = hasAnyTag(template, trigger.includeTags);
    const includeMatch =
      !trigger.includeSubcategoryPrefixes && !trigger.includeTags
        ? true
        : subMatch || tagMatch;

    if (!includeMatch) continue;

    const energy = toValidNumber(template.energy);
    const aboveMax =
      trigger.maxEnergy != null && energy != null && energy > trigger.maxEnergy;
    const belowMin =
      trigger.minEnergy != null && energy != null && energy < trigger.minEnergy;
    const excludedByTag = hasAnyTag(template, trigger.excludeTags);

    const violatesGuard = aboveMax || belowMin || excludedByTag;
    if (violatesGuard && trigger.hardExclude) {
      blocked = true;
      reasons.push(`${trigger.id}:blocked`);
      continue;
    }

    if (violatesGuard) {
      score -= Math.max(0.5, trigger.weight * 0.5);
      reasons.push(`${trigger.id}:penalized`);
      continue;
    }

    score += trigger.weight;
    reasons.push(trigger.id);
  }

  return {
    score,
    reasons,
    blocked,
  };
}
