import type { MissionTemplateItem } from "@/components/xp/XPPageContent";
import type { BehaviorProfile } from "@/types/behavior-profile.types";

/** Same ordering as XP Command Bridge: identity + hobby signals boost relevant domains. */
export function recommendedMissionTemplates(
  missionTemplates: MissionTemplateItem[],
  behaviorProfile: BehaviorProfile
): MissionTemplateItem[] {
  const identityTargets = new Set(behaviorProfile.identityTargets);
  const fitnessCommitment = behaviorProfile.hobbyCommitment.fitness ?? 0;

  const scoreTemplate = (t: MissionTemplateItem): number => {
    let score = 0;
    if (identityTargets.has("fit_person") && t.domain === "health") score += 2;
    if (identityTargets.has("disciplined") && t.domain === "discipline") score += 2;
    if (identityTargets.has("financial_control") && t.domain === "business") score += 2;
    if (fitnessCommitment >= 0.5 && t.domain === "health") score += 1;
    return score;
  };

  return [...missionTemplates].sort((a, b) => scoreTemplate(b) - scoreTemplate(a));
}
