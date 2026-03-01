/**
 * Insight Engine — KPI formulas for Insights 2.0
 * Verklaren, voorspellen, sturen. No UI; pure calculations.
 */

export type TrendDirection = "up" | "plateau" | "down";

export interface MomentumInput {
  xpLast7: number;
  xpPrevious7: number;
  completionRateLast7: number; // 0–1
  streakStabilityScore: number; // 0–1, e.g. currentStreak / max(7, longestStreak)
}

export interface TrendInput {
  xpLast7: number;
  xpPrevious7: number;
}

export interface StreakRiskInput {
  daysSinceLastActive: number;
  energyDropPct: number; // 0–100, e.g. (prevAvg - lastAvg) / prevAvg * 100
  xpDeclinePct: number; // 0–100, last 7 vs previous 7
}

/** Momentum 0–100: growth speed (40) + completion (30) + streak stability (30). Spec formula. */
export function calculateMomentum(input: MomentumInput): number {
  const { xpLast7, xpPrevious7, completionRateLast7, streakStabilityScore } = input;
  const growthRatio = xpPrevious7 > 0 ? xpLast7 / xpPrevious7 : 1;
  const growthComponent = Math.min(40, growthRatio * 40);
  const completionComponent = completionRateLast7 * 30;
  const streakComponent = streakStabilityScore * 30;
  const raw = growthComponent + completionComponent + streakComponent;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

/** Trend: last 7 vs previous 7. +10% = up, -10% = down, else plateau. */
export function detectTrend(input: TrendInput): {
  direction: TrendDirection;
  changePct: number;
  microcopy: string;
} {
  const { xpLast7, xpPrevious7 } = input;
  const changePct =
    xpPrevious7 > 0 ? Math.round(((xpLast7 - xpPrevious7) / xpPrevious7) * 100) : 0;

  let direction: TrendDirection = "plateau";
  if (changePct >= 10) direction = "up";
  else if (changePct <= -10) direction = "down";

  let microcopy: string;
  if (direction === "up") {
    microcopy = `Je momentum stijgt met ${changePct}%`;
  } else if (direction === "down") {
    const below = Math.abs(changePct);
    microcopy = `Je zakt ${below}% onder je gemiddelde`;
  } else {
    microcopy = "Je momentum blijft stabiel";
  }

  return { direction, changePct, microcopy };
}

export type StreakRiskLevel = "low" | "medium" | "high";

/** Streak risk 0–100. Spec: daysSinceLastActive*40 + energyDrop*30 + xpDecline*30. >60 = high. */
export function calculateStreakRisk(input: StreakRiskInput): {
  score: number;
  level: StreakRiskLevel;
} {
  const { daysSinceLastActive, energyDropPct, xpDeclinePct } = input;
  const score = Math.round(
    Math.min(100, daysSinceLastActive * 40 + energyDropPct * 0.3 + xpDeclinePct * 0.3)
  );
  let level: StreakRiskLevel = "low";
  if (score >= 60) level = "high";
  else if (score >= 30) level = "medium";
  return { score, level };
}

export interface CoachRecommendation {
  id: string;
  type: "focus" | "mission_strategy" | "streak" | "friction" | "momentum";
  title: string;
  body: string;
  actionLabel: string;
  actionHref: string;
}

/** Build up to 3 coach recommendations from signals. Call from server with real data. */
export function generateCoachRecommendations(signals: {
  lowCompletionRate?: boolean;
  highFriction?: boolean;
  streakAtRisk?: boolean;
  momentumDown?: boolean;
  bestDayOfWeek?: number; // 0–6
  bestHourStart?: number; // 0–23
}): CoachRecommendation[] {
  const recs: CoachRecommendation[] = [];

  if (signals.streakAtRisk) {
    recs.push({
      id: "streak",
      type: "streak",
      title: "Streak in gevaar",
      body: "Op basis van je recente activiteit en energie is de kans op een streak-breuk verhoogd. Eén kleine missie vandaag houdt je streak intact.",
      actionLabel: "Herstel streak",
      actionHref: "/tasks",
    });
  }

  if (signals.lowCompletionRate) {
    recs.push({
      id: "mission_strategy",
      type: "mission_strategy",
      title: "Completion rate laag",
      body: "Je start meer missies dan je afrondt. Kies vandaag 1–2 korte missies en rond die af vóór je nieuwe start.",
      actionLabel: "Kies aanbevolen missie",
      actionHref: "/tasks",
    });
  }

  if (signals.highFriction) {
    recs.push({
      id: "friction",
      type: "friction",
      title: "Veel twijfel bij missies",
      body: "Je opent missies vaak maar start ze niet meteen. Probeer direct te starten na openen, of kies een makkelijkere missie.",
      actionLabel: "Optimaliseer dit",
      actionHref: "/tasks",
    });
  }

  if (signals.momentumDown && !signals.streakAtRisk) {
    recs.push({
      id: "momentum",
      type: "momentum",
      title: "Momentum daalt",
      body: "Je XP de afgelopen 7 dagen ligt onder de week ervoor. Kleine, consistente acties tillen je momentum weer omhoog.",
      actionLabel: "Optimaliseer dit",
      actionHref: "/report",
    });
  }

  if (signals.bestDayOfWeek != null && recs.length < 3) {
    const dayNames = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];
    recs.push({
      id: "best_day",
      type: "mission_strategy",
      title: "Beste prestatiedag",
      body: `Je presteert het beste op ${dayNames[signals.bestDayOfWeek]}. Plan je zwaarste missies dan.`,
      actionLabel: "Gebruik dit voordeel",
      actionHref: "/tasks",
    });
  }

  return recs.slice(0, 3);
}

/** Level projection: days to next level at current 14-day XP rate. */
export function projectLevelDays(params: {
  totalXP: number;
  xpPerDayLast14: number;
  xpToNextLevel: number;
}): number | null {
  const { totalXP, xpPerDayLast14, xpToNextLevel } = params;
  if (xpToNextLevel <= 0 || xpPerDayLast14 <= 0) return null;
  return Math.ceil(xpToNextLevel / xpPerDayLast14);
}
