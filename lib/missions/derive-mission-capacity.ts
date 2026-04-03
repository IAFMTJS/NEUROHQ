import type { DecisionBlocksResult } from "@/app/actions/missions-performance";
import type { EnergyBudget } from "@/app/actions/energy";

export type MissionCapacitySnapshot = {
  maxTasks: number | null;
  recommendedLoad: number | null;
  overloadRisk: "low" | "medium" | "high";
  reasonCodes?: string[];
};

export type MissionsPipelinePayload = {
  decisionBlocks: DecisionBlocksResult;
  capacity: MissionCapacitySnapshot;
  buildMeta: { builtAt: number };
  /** Compacte UMS-volgorde (zelfde als `decisionBlocks.tasksSortedByUMS.map(t => t.id)`). */
  rankedTaskIds: string[];
};

export function deriveMissionCapacity(
  decisionBlocks: DecisionBlocksResult,
  energyBudget: EnergyBudget
): MissionCapacitySnapshot {
  const ranked = decisionBlocks.tasksSortedByUMS.length;
  const suggested = energyBudget.suggestedTaskCount ?? null;
  const maxSlots = energyBudget.maxSlots ?? null;
  const reasonCodes: string[] = [];
  let overloadRisk: "low" | "medium" | "high" = "low";

  if (decisionBlocks.recoveryOnly) {
    overloadRisk = "high";
    reasonCodes.push("recovery_only");
  } else if (decisionBlocks.pressureZone === "risk") {
    overloadRisk = "high";
    reasonCodes.push("pressure_risk");
  } else if (decisionBlocks.pressureZone === "healthy") {
    overloadRisk = "medium";
    reasonCodes.push("pressure_healthy");
  }

  if (suggested != null && ranked > suggested + 2) {
    overloadRisk = overloadRisk === "low" ? "medium" : overloadRisk;
    reasonCodes.push("ranked_over_suggested");
  }

  if (energyBudget.consequence?.energyDepleted) {
    reasonCodes.push("energy_depleted");
  }

  return {
    maxTasks: maxSlots ?? suggested,
    recommendedLoad: suggested,
    overloadRisk,
    reasonCodes: reasonCodes.length ? reasonCodes : undefined,
  };
}

export function buildMissionsPipelinePayload(
  decisionBlocks: DecisionBlocksResult,
  energyBudget: EnergyBudget
): MissionsPipelinePayload {
  return {
    decisionBlocks,
    capacity: deriveMissionCapacity(decisionBlocks, energyBudget),
    buildMeta: { builtAt: Date.now() },
    rankedTaskIds: decisionBlocks.tasksSortedByUMS.map((t) => t.id),
  };
}
