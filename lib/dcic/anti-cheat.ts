import type { GameState, Mission } from "./types";

export type AbuseLevel = "none" | "low" | "medium" | "high";

export type AbuseEvaluation = {
  level: AbuseLevel;
  reasons: string[];
};

export function recordMissionCompletionPattern(
  gameState: GameState,
  mission: Mission
): void {
  const patterns = gameState.authority.patterns;

  if (!mission.completed) return;

  const xp = mission.xpReward;
  const risk = mission.riskLevel ?? "low";

  if (xp <= 50 && risk === "low") {
    patterns.missionSpamCount += 1;
  } else {
    patterns.missionSpamCount = Math.max(0, patterns.missionSpamCount - 1);
  }

  if (xp <= 30 && risk === "low") {
    patterns.easyTaskAbuseCount += 1;
  } else {
    patterns.easyTaskAbuseCount = Math.max(0, patterns.easyTaskAbuseCount - 1);
  }
}

export function evaluateAbuse(gameState: GameState, todayStr: string): AbuseEvaluation {
  const patterns = gameState.authority.patterns;
  const reasons: string[] = [];
  let level: AbuseLevel = "none";

  if (patterns.missionSpamCount >= 5) {
    reasons.push("missionSpam");
    level = "low";
  }
  if (patterns.easyTaskAbuseCount >= 5) {
    reasons.push("easyTaskAbuse");
    level = level === "none" ? "low" : "medium";
  }
  if (patterns.modeSwitchAbuseCount >= 5) {
    reasons.push("modeSwitchAbuse");
    level = "high";
  }

  if (level !== "none") {
    patterns.lastAbuseDate = todayStr;
  }

  return { level, reasons };
}

