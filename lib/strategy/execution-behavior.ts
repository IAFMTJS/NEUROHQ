/**
 * Executie-/gedragspijler: welke "focus" de gebruiker kiest bepaalt welke missie-signalen tellen.
 * Data komt uit task_events + tasks (+ mission_outcome_events voor negatieve uitkomsten).
 */
import type { QuarterPillarScore } from "@/lib/strategy/quarter-engine";

const NEUTRAL = 0.5;

export const EXECUTION_BEHAVIOR_OPTIONS = [
  "balanced",
  "structure",
  "routine",
  "discipline",
  "proactive",
  "consistency",
] as const;

export type ExecutionBehaviorFocus = (typeof EXECUTION_BEHAVIOR_OPTIONS)[number];

export function normalizeExecutionBehaviorFocus(raw: unknown): ExecutionBehaviorFocus {
  if (typeof raw !== "string") return "balanced";
  return EXECUTION_BEHAVIOR_OPTIONS.includes(raw as ExecutionBehaviorFocus)
    ? (raw as ExecutionBehaviorFocus)
    : "balanced";
}

export const EXECUTION_BEHAVIOR_LABELS_NL: Record<ExecutionBehaviorFocus, { title: string; measure: string }> = {
  balanced: {
    title: "Gebalanceerd",
    measure: "Afgeronde missies vs skip, verzet en verwijderen (legacy).",
  },
  structure: {
    title: "Structuur",
    measure: "Hoeveel afgeronde missies op of vóór de geplande datum (due date) liggen.",
  },
  routine: {
    title: "Routine",
    measure: "Hoeveel terugkerende taken met deadline dit kwartaal minstens één keer zijn afgerond.",
  },
  discipline: {
    title: "Discipline",
    measure: "Weerstand: voltooien vs skip/verzet/verwijderen + afhaken; strenger gewogen.",
  },
  proactive: {
    title: "Proactief",
    measure: "Hoe vaak je taken vóór de deadline dag afrondt (voorsprong).",
  },
  consistency: {
    title: "Consistentie",
    measure: "Op hoeveel verschillende dagen je minstens één missie afrondt t.o.v. verwachte contactdagen in het kwartaal.",
  },
};

export type ExecutionQuarterMetrics = {
  /** Afgerond met bijbehorende taak-context */
  completesWithDue: { completeDay: string; dueDate: string | null; isRecurring: boolean }[];
  skipRescheduleDelete: number;
  startCount: number;
  abandonCount: number;
  distinctCompleteDays: number;
  quarterElapsedDays: number;
  recurringTasksDueInQuarter: number;
  recurringTasksTouchedInQuarter: number;
};

function pillarFromRatio(ratio: number, committed: boolean): QuarterPillarScore {
  const r = Math.min(1, Math.max(0, ratio));
  return {
    value01: r,
    displayPct: Math.round(r * 100),
    committed,
  };
}

function neutralPillar(): QuarterPillarScore {
  return { value01: NEUTRAL, displayPct: 50, committed: false };
}

/**
 * Score voor de discipline-pijler afhankelijk van gekozen gedragsfocus.
 * `completes` / `negatives` = ruwe tellingen (zelfde als legacy) voor balanced fallback in caller.
 */
export function computeExecutionDisciplinePillar(
  focus: ExecutionBehaviorFocus,
  m: ExecutionQuarterMetrics,
  completes: number,
  negatives: number
): QuarterPillarScore {
  if (focus === "balanced") {
    const denom = completes + negatives;
    if (denom <= 0) return neutralPillar();
    return pillarFromRatio(completes / denom, true);
  }

  if (focus === "discipline") {
    const denom = completes + 2 * negatives + 0.75 * m.abandonCount;
    if (denom <= 0) return neutralPillar();
    return pillarFromRatio(completes / denom, true);
  }

  const withDue = m.completesWithDue.filter((x) => x.dueDate != null && x.dueDate.length >= 10);
  if (focus === "structure") {
    if (withDue.length === 0) return completes > 0 ? neutralPillar() : neutralPillar();
    const onTime = withDue.filter((x) => x.completeDay <= (x.dueDate as string)).length;
    return pillarFromRatio(onTime / withDue.length, true);
  }

  if (focus === "proactive") {
    if (withDue.length === 0) return neutralPillar();
    const early = withDue.filter((x) => x.completeDay < (x.dueDate as string)).length;
    return pillarFromRatio(early / withDue.length, true);
  }

  if (focus === "routine") {
    const den = Math.max(1, m.recurringTasksDueInQuarter);
    const num = Math.min(m.recurringTasksTouchedInQuarter, den);
    return pillarFromRatio(num / den, m.recurringTasksDueInQuarter > 0);
  }

  if (focus === "consistency") {
    const expected = Math.max(10, Math.ceil(m.quarterElapsedDays * 0.35));
    if (m.quarterElapsedDays <= 0) return neutralPillar();
    const ratio = m.distinctCompleteDays / expected;
    return pillarFromRatio(Math.min(1, ratio), completes > 0 || m.distinctCompleteDays > 0);
  }

  return neutralPillar();
}
