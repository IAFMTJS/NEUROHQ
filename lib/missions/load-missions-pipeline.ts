import { cache } from "react";
import { getDecisionBlocksCached } from "@/app/actions/missions-performance";
import { getEnergyBudget } from "@/app/actions/energy";
import { buildMissionsPipelinePayload, type MissionsPipelinePayload } from "@/lib/missions/derive-mission-capacity";

/**
 * Request-scoped cache: one UMS/decision pipeline per date per HTTP/RSC request
 * (bootstrap + dashboard critical + tasks page in the same request share work).
 */
export const loadMissionsPipeline = cache(async (dateStr: string): Promise<MissionsPipelinePayload> => {
  const [decisionBlocks, energyBudget] = await Promise.all([
    getDecisionBlocksCached(dateStr),
    getEnergyBudget(dateStr),
  ]);
  return buildMissionsPipelinePayload(decisionBlocks, energyBudget);
});
