/**
 * Cognitive Load Forecast: overload risk from load trend, energy decline, failure increase.
 * >60% → suggest recovery week, difficulty -10%, social cap.
 * Adviserend, niet dramatisch.
 */

export interface LoadForecastInputs {
  /** Load trend last 3 days (e.g. slope -1 to 1 or delta). */
  loadTrend3d: number;
  /** Energy decline (0–1, e.g. average daily energy drop). */
  energyDecline: number;
  /** Failure/completion drop (0–1). */
  failureIncrease: number;
}

export interface CognitiveLoadForecast {
  overloadRisk: number;
  recoveryWeekSuggested: boolean;
  difficultyModifier: number;
  socialCap: boolean;
  /** Optional: "Projected overload Wednesday" */
  message: string | null;
}

const OVERLOAD_THRESHOLD = 0.6;
const DIFFICULTY_PENALTY = -0.1;

export function computeOverloadRisk(inputs: LoadForecastInputs): number {
  const { loadTrend3d, energyDecline, failureIncrease } = inputs;
  return Math.max(0, Math.min(1, loadTrend3d * 0.4 + energyDecline * 0.3 + failureIncrease * 0.3));
}

export function getCognitiveLoadForecast(inputs: LoadForecastInputs): CognitiveLoadForecast {
  const overloadRisk = computeOverloadRisk(inputs);
  const recoveryWeekSuggested = overloadRisk > OVERLOAD_THRESHOLD;
  const difficultyModifier = recoveryWeekSuggested ? DIFFICULTY_PENALTY : 0;
  const socialCap = recoveryWeekSuggested;
  const dayNames = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];
  const nextWed = (() => {
    const d = new Date();
    const dow = d.getDay();
    const toWed = dow <= 3 ? 3 - dow : 10 - dow;
    d.setDate(d.getDate() + toWed);
    return dayNames[d.getDay()];
  })();
  const message =
    overloadRisk > OVERLOAD_THRESHOLD
      ? `Projected overload ${nextWed}. Recovery week aanbevolen.`
      : null;
  return {
    overloadRisk,
    recoveryWeekSuggested,
    difficultyModifier,
    socialCap,
    message,
  };
}
