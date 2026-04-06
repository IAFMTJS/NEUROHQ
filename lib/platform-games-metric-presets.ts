/**
 * Catalogus van meetbare game-regels voor platform_games.config.progress (mode: auto).
 * Wordt gebruikt door admin UI en door lib/platform-games-metrics-eval.ts.
 */

export type MetricAggregation =
  | "period_total"
  | "period_average_per_active_day"
  | "each_calendar_day"
  | "snapshot_now";

export type MetricOperator = "gte" | "lte" | "eq";

export type MetricUnit = "count" | "percent" | "minutes" | "days" | "boolean";

export type PlatformGameMetricPresetId =
  | "missions_completed_in_window"
  | "missions_due_completion_rate_pct"
  | "protocol_missions_completed_in_window"
  | "growth_tagged_missions_completed_in_window"
  | "learning_minutes_total"
  | "learning_logged_days_count"
  | "budget_entries_count"
  | "brain_checkin_days"
  | "rest_days_logged"
  | "distinct_mission_completion_days"
  | "max_single_day_missions_completed"
  | "user_streak_current"
  | "days_meeting_daily_mission_quota"
  | "days_meeting_daily_learning_minutes";

export type PlatformGameMetricPresetDef = {
  id: PlatformGameMetricPresetId;
  label: string;
  shortHint: string;
  /** Welke aggregaties de evaluator ondersteunt. */
  aggregations: MetricAggregation[];
  defaultAggregation: MetricAggregation;
  defaultThreshold: number;
  defaultOperator: MetricOperator;
  unit: MetricUnit;
  /** Minimaal / maximaal voor drempel in admin UI. */
  thresholdMin?: number;
  thresholdMax?: number;
  /** Stap voor number input. */
  thresholdStep?: number;
  /** Standaard extra parameters voor complexe regels. */
  defaultParams?: { minPerDay?: number; minMinutesPerDay?: number };
};

export const PLATFORM_GAME_METRIC_PRESETS: PlatformGameMetricPresetDef[] = [
  {
    id: "missions_completed_in_window",
    label: "Missies afgerond (totaal in periode)",
    shortHint: "Telt afgeronde top-level taken waarvan completed_at binnen het gamevenster valt.",
    aggregations: ["period_total"],
    defaultAggregation: "period_total",
    defaultThreshold: 5,
    defaultOperator: "gte",
    unit: "count",
    thresholdMin: 0,
    thresholdMax: 10_000,
  },
  {
    id: "missions_due_completion_rate_pct",
    label: "Missie-completion op due-dagen (%)",
    shortHint:
      "Van alle top-level taken met due_date in het venster: welk percentage is afgerond. Zonder zo'n missie in de periode is de score 0% (niet meteen 100%). 100 = alles wat gepland was in de periode is gedaan.",
    aggregations: ["period_total"],
    defaultAggregation: "period_total",
    defaultThreshold: 100,
    defaultOperator: "gte",
    unit: "percent",
    thresholdMin: 0,
    thresholdMax: 100,
    thresholdStep: 1,
  },
  {
    id: "protocol_missions_completed_in_window",
    label: "Protocol-/growth-missies afgerond",
    shortHint: "Taken met task_tags die \"protocol\" bevatten, afgerond binnen het venster (completed_at).",
    aggregations: ["period_total"],
    defaultAggregation: "period_total",
    defaultThreshold: 3,
    defaultOperator: "gte",
    unit: "count",
    thresholdMin: 0,
    thresholdMax: 5000,
  },
  {
    id: "growth_tagged_missions_completed_in_window",
    label: "Growth-getagde missies afgerond",
    shortHint: "Zelfde als protocol-filter maar task_tags bevat \"growth\" (aanbevolen voor Growth-pagina flows).",
    aggregations: ["period_total"],
    defaultAggregation: "period_total",
    defaultThreshold: 2,
    defaultOperator: "gte",
    unit: "count",
    thresholdMin: 0,
    thresholdMax: 5000,
  },
  {
    id: "learning_minutes_total",
    label: "Leertijd (minuten, totaal)",
    shortHint: "Som van learning_sessions.minutes op dagen binnen het venster.",
    aggregations: ["period_total", "period_average_per_active_day", "each_calendar_day"],
    defaultAggregation: "period_total",
    defaultThreshold: 120,
    defaultOperator: "gte",
    unit: "minutes",
    thresholdMin: 0,
    thresholdMax: 100_000,
  },
  {
    id: "learning_logged_days_count",
    label: "Dagen met leerlog",
    shortHint: "Aantal kalenderdagen in het venster met minstens één learning_session.",
    aggregations: ["period_total"],
    defaultAggregation: "period_total",
    defaultThreshold: 5,
    defaultOperator: "gte",
    unit: "days",
    thresholdMin: 0,
    thresholdMax: 366,
  },
  {
    id: "budget_entries_count",
    label: "Budgetregels gelogd",
    shortHint: "Aantal budget_entries met datum in het venster (bewuste uitgaven registreren).",
    aggregations: ["period_total"],
    defaultAggregation: "period_total",
    defaultThreshold: 3,
    defaultOperator: "gte",
    unit: "count",
    thresholdMin: 0,
    thresholdMax: 50_000,
  },
  {
    id: "brain_checkin_days",
    label: "Dagen met brain check-in",
    shortHint: "Kalenderdagen met daily_state waarin energy én focus zijn ingevuld.",
    aggregations: ["period_total", "each_calendar_day"],
    defaultAggregation: "period_total",
    defaultThreshold: 5,
    defaultOperator: "gte",
    unit: "days",
    thresholdMin: 0,
    thresholdMax: 366,
  },
  {
    id: "rest_days_logged",
    label: "Rustdagen gemarkeerd",
    shortHint: "Aantal dagen met daily_state.is_rest_day = true binnen het venster.",
    aggregations: ["period_total"],
    defaultAggregation: "period_total",
    defaultThreshold: 1,
    defaultOperator: "gte",
    unit: "days",
    thresholdMin: 0,
    thresholdMax: 366,
  },
  {
    id: "distinct_mission_completion_days",
    label: "Dagen waarop je minstens 1 missie afrondde",
    shortHint: "Unieke due_date (of completed dag) met ≥1 afgeronde top-level taak — bouwt consistentie.",
    aggregations: ["period_total"],
    defaultAggregation: "period_total",
    defaultThreshold: 4,
    defaultOperator: "gte",
    unit: "days",
    thresholdMin: 0,
    thresholdMax: 366,
  },
  {
    id: "max_single_day_missions_completed",
    label: "Max. missies op één dag",
    shortHint: "Hoogste aantal afgeronde top-level taken op één kalenderdag (completed_at) binnen het venster.",
    aggregations: ["period_total"],
    defaultAggregation: "period_total",
    defaultThreshold: 3,
    defaultOperator: "gte",
    unit: "count",
    thresholdMin: 0,
    thresholdMax: 500,
  },
  {
    id: "user_streak_current",
    label: "Huidige streak (nu)",
    shortHint: "Leest user_streak.current_streak op dit moment — geen historische replay; geschikt voor \"behoud streak ≥ N tijdens event\".",
    aggregations: ["snapshot_now"],
    defaultAggregation: "snapshot_now",
    defaultThreshold: 7,
    defaultOperator: "gte",
    unit: "count",
    thresholdMin: 0,
    thresholdMax: 10_000,
  },
  {
    id: "days_meeting_daily_mission_quota",
    label: "Dagen die missie-quota halen",
    shortHint:
      "Teller = aantal dagen (UTC) waarop je minstens \"min. missies/dag\" afrondde. Drempel hieronder = minimaal aantal zo'n dagen. Stel min. missies/dag in via JSON params.minPerDay (default 2).",
    aggregations: ["period_total"],
    defaultAggregation: "period_total",
    defaultThreshold: 5,
    defaultOperator: "gte",
    unit: "days",
    thresholdMin: 0,
    thresholdMax: 366,
    defaultParams: { minPerDay: 2 },
  },
  {
    id: "days_meeting_daily_learning_minutes",
    label: "Dagen met genoeg leerminuten",
    shortHint:
      "Teller = dagen waarop totaal leerminuten ≥ params.minMinutesPerDay (default 30). Drempel = minimaal aantal zo'n dagen in de periode.",
    aggregations: ["period_total"],
    defaultAggregation: "period_total",
    defaultThreshold: 5,
    defaultOperator: "gte",
    unit: "days",
    thresholdMin: 0,
    thresholdMax: 366,
    defaultParams: { minMinutesPerDay: 30 },
  },
];

const PRESET_BY_ID = Object.fromEntries(PLATFORM_GAME_METRIC_PRESETS.map((p) => [p.id, p])) as Record<
  PlatformGameMetricPresetId,
  PlatformGameMetricPresetDef
>;

export function getMetricPreset(id: string): PlatformGameMetricPresetDef | null {
  return PRESET_BY_ID[id as PlatformGameMetricPresetId] ?? null;
}

export function isValidPresetId(id: string): id is PlatformGameMetricPresetId {
  return id in PRESET_BY_ID;
}
