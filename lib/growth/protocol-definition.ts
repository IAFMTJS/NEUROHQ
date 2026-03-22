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

export type ProtocolTask = {
  id: string;
  title: string;
  /** Human-readable instruction — default if no tier chosen */
  concrete: string;
  minutes: number;
  success_criteria?: string;
  scaling?: Partial<Record<DifficultyTier, TaskScaling>>;
};

export type ProtocolWeek = {
  week_index: number;
  phase_id: string;
  title: string;
  objective: string;
  tasks: ProtocolTask[];
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
