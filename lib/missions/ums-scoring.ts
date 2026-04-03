/**
 * Pure UMS scoring (no DB, no React). Shared by missions server actions and buildMissionState.
 */
import type { TaskWithMeta, UnifiedMissionScore } from "@/app/actions/missions-performance";

function strategyAlignmentForTask(
  taskDomain: string | null | undefined,
  primaryDomain: string,
  secondaryDomains: string[]
): number {
  if (!taskDomain) return 0.5;
  if (taskDomain === primaryDomain) return 1;
  if (secondaryDomains.includes(taskDomain)) return 0.6;
  return 0.2;
}

function estimateXP(task: TaskWithMeta): number {
  const impact = task.impact ?? 2;
  return Math.max(10, Math.min(100, impact * 35)) || 50;
}

function estimateMinutes(task: TaskWithMeta): number {
  const energy = Math.min(10, Math.max(1, task.energy_required ?? 3));
  return energy * 8;
}

function roiScore(task: TaskWithMeta): number {
  const xp = estimateXP(task);
  const min = Math.max(1, estimateMinutes(task));
  const xpPerMin = xp / min;
  return Math.min(1, xpPerMin / 5);
}

function energyMatchScore(userEnergy: number, task: TaskWithMeta): number {
  const taskEnergy = Math.min(10, Math.max(1, task.energy_required ?? 5));
  const diff = Math.abs(userEnergy - taskEnergy);
  return Math.max(0, 1 - diff / 5);
}

function pressureImpactScore(
  pressureZone: "comfort" | "healthy" | "risk",
  task: TaskWithMeta
): number {
  if (pressureZone === "comfort") return 0.3;
  const impact = (task.impact ?? 1) / 3;
  const urgency = (task.urgency ?? 1) / 3;
  const taskPressure = (impact + urgency) / 2;
  if (pressureZone === "risk") return 0.4 + taskPressure * 0.6;
  return 0.3 + taskPressure * 0.4;
}

export function computeUMS(
  task: TaskWithMeta,
  opts: {
    strategyPrimary: string;
    strategySecondary: string[];
    completionRate: number;
    userEnergy: number;
    pressureZone: "comfort" | "healthy" | "risk";
  }
): UnifiedMissionScore {
  const strategyAlignment = strategyAlignmentForTask(
    task.domain,
    opts.strategyPrimary,
    opts.strategySecondary
  );
  let completionProbability = Math.min(1, Math.max(0.2, opts.completionRate));
  const roi = roiScore(task);
  const energyMatch = energyMatchScore(opts.userEnergy, task);
  const pressureImpact = pressureImpactScore(opts.pressureZone, task);

  if (energyMatch < 0.3) {
    completionProbability = Math.max(0.2, completionProbability - 0.15);
  }

  const ums =
    strategyAlignment * 0.3 +
    completionProbability * 0.2 +
    roi * 0.2 +
    energyMatch * 0.15 +
    pressureImpact * 0.15;

  return {
    ums: Math.round(ums * 100) / 100,
    strategyAlignment,
    completionProbability,
    roi,
    energyMatch,
    pressureImpact,
  };
}
