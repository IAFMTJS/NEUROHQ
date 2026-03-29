"use server";

import { getBehaviorProfile } from "@/app/actions/behavior-profile";
import { getEnergyBudget } from "@/app/actions/energy";
import { getTodaysTasks } from "@/app/actions/tasks";
import { missionTemplatesForXpPayload } from "@/lib/mission-templates";
import type { MissionTemplateItem } from "@/components/xp/XPPageContent";
import type { BehaviorProfile } from "@/types/behavior-profile.types";
import type { BrainMode } from "@/lib/brain-mode";

export type ProfileDailyChallengeContext = {
  missionTemplates: MissionTemplateItem[];
  behaviorProfile: BehaviorProfile;
  brainModeToday: BrainMode;
  activeMissionCountToday: number;
};

export async function getProfileDailyChallengeContext(dateStr: string): Promise<ProfileDailyChallengeContext> {
  const [behaviorProfile, energyBudget, todaysTasks] = await Promise.all([
    getBehaviorProfile(),
    getEnergyBudget(dateStr),
    getTodaysTasks(dateStr, "normal"),
  ]);

  return {
    missionTemplates: missionTemplatesForXpPayload(),
    behaviorProfile,
    brainModeToday: energyBudget.brainMode,
    activeMissionCountToday: todaysTasks.tasks.length,
  };
}
