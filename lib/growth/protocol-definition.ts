/**
 * Protocol content model — matches seed JSON and protocol_library.definition_json.
 * Concept: PHASES → WEEKS → SESSIONS (tasks), with optional difficulty scaling (Updates 22-03 D.3).
 */
import type { DifficultyTier } from "@/lib/growth/adaptive-engine";

export const PROTOCOL_DEFINITION_VERSION = 1 as const;

export type TaskScaling = {
  concrete: string;
  minutes: number;
};

/** Optionele bron of referentie bij een taak (geen harde URL vereiste). */
export type ProtocolTaskResource = {
  label: string;
  note?: string;
  url?: string;
};

export type ProtocolTask = {
  id: string;
  title: string;
  /** Human-readable instruction — default if no tier chosen */
  concrete: string;
  minutes: number;
  success_criteria?: string;
  scaling?: Partial<Record<DifficultyTier, TaskScaling>>;
  /** Waarom deze stap in het traject (motivatie / koppeling). */
  why_it_matters?: string;
  /** Suggestie: 1 = ma … 7 = zo (ISO-achtig). */
  preferred_days?: number[];
  /** "3× per week", "dagelijks", etc. */
  frequency_note?: string;
  checklist?: string[];
  reflection_prompt?: string;
  resources?: ProtocolTaskResource[];
};

/** Suggestie per weekdag: geen validatie tegen taken, puur voor planning. */
export type WeekDayOverview = {
  /** 1 = ma … 7 = zo */
  day_of_week: number;
  focus_line: string;
  /** Optioneel: welke taken uit deze week extra prioriteit krijgen. */
  task_ids?: string[];
};

export type ProtocolWeek = {
  week_index: number;
  phase_id: string;
  title: string;
  objective: string;
  tasks: ProtocolTask[];
  /** Korte intentie: wat deze week anders is dan “nog een week”. */
  week_intent?: string;
  /** Langere begeleiding / randvoorwaarden. */
  coach_notes?: string;
  /** Suggestie-rooster (Ma–Zo). */
  day_overview?: WeekDayOverview[];
  /** Afronding van de week (checklist-stijl). */
  weekly_checklist?: string[];
};

export type ProtocolPhase = {
  id: string;
  order: number;
  title: string;
  summary: string;
  /** Inclusive week range (1-based), aligned with doc “Phase 1 → week 1–6” */
  week_start: number;
  week_end: number;
};

export type ProtocolDefinitionV1 = {
  version: typeof PROTOCOL_DEFINITION_VERSION;
  goal_one_liner: string;
  estimated_weeks_min: number;
  estimated_weeks_max: number;
  phases: ProtocolPhase[];
  weeks: ProtocolWeek[];
  /** Traject-niveau: voor wie, wat wel/niet verwachten. */
  trajectory_context?: string;
  prerequisites?: string[];
  outcomes?: string[];
  /** Vrij te gebruiken voor filter/SEO later. */
  tags?: string[];
};

export function parseProtocolDefinition(raw: unknown): ProtocolDefinitionV1 | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.version !== PROTOCOL_DEFINITION_VERSION) return null;
  if (!Array.isArray(o.phases) || !Array.isArray(o.weeks)) return null;
  return raw as ProtocolDefinitionV1;
}

export function getScaledTask(task: ProtocolTask, tier: DifficultyTier): { concrete: string; minutes: number } {
  const s = task.scaling?.[tier];
  if (s) return { concrete: s.concrete, minutes: s.minutes };
  return { concrete: task.concrete, minutes: task.minutes };
}

export function weekForIndex(def: ProtocolDefinitionV1, weekIndex: number): ProtocolWeek | undefined {
  return def.weeks.find((w) => w.week_index === weekIndex);
}

export function phaseForWeek(def: ProtocolDefinitionV1, weekIndex: number): ProtocolPhase | undefined {
  return def.phases.find((p) => weekIndex >= p.week_start && weekIndex <= p.week_end);
}

export function maxWeekIndex(def: ProtocolDefinitionV1): number {
  if (def.weeks.length === 0) return 1;
  return Math.max(...def.weeks.map((w) => w.week_index));
}

/** 1 = ma … 7 = zo (Nederlands, kort). */
export function dayOfWeekLabelNl(day: number): string {
  const labels: Record<number, string> = {
    1: "Ma",
    2: "Di",
    3: "Wo",
    4: "Do",
    5: "Vr",
    6: "Za",
    7: "Zo",
  };
  return labels[day] ?? `Dag ${day}`;
}

export function sortedDayOverview(week: ProtocolWeek): WeekDayOverview[] {
  const raw = week.day_overview ?? [];
  return [...raw].sort((a, b) => a.day_of_week - b.day_of_week);
}
