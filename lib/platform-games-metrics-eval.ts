import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import {
  getMetricPreset,
  type MetricAggregation,
  type MetricOperator,
  type PlatformGameMetricPresetId,
} from "@/lib/platform-games-metric-presets";

export type PlatformGameAutoRuleParsed = {
  id: string;
  label?: string;
  preset: PlatformGameMetricPresetId;
  aggregation: MetricAggregation;
  operator: MetricOperator;
  threshold: number;
  params?: { minPerDay?: number; minMinutesPerDay?: number };
};

export type RuleEvalResult = {
  ruleId: string;
  label: string;
  preset: PlatformGameMetricPresetId;
  aggregation: MetricAggregation;
  operator: MetricOperator;
  threshold: number;
  value: number;
  satisfied: boolean;
  detail?: string;
};

function asRecord(v: unknown): Record<string, unknown> | null {
  if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
  return null;
}

function toYmd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function ymdRangeInclusive(startYmd: string, endYmd: string): string[] {
  const out: string[] = [];
  const cur = new Date(`${startYmd}T12:00:00.000Z`);
  const end = new Date(`${endYmd}T12:00:00.000Z`);
  if (cur > end) return out;
  for (; cur <= end; cur.setUTCDate(cur.getUTCDate() + 1)) {
    out.push(cur.toISOString().slice(0, 10));
  }
  return out;
}

function compareOp(value: number, op: MetricOperator, threshold: number): boolean {
  if (op === "gte") return value >= threshold;
  if (op === "lte") return value <= threshold;
  return Math.abs(value - threshold) < 1e-6;
}

function taskTagsInclude(tags: unknown, needle: string): boolean {
  if (!Array.isArray(tags)) return false;
  return tags.some((t) => typeof t === "string" && t.toLowerCase().includes(needle.toLowerCase()));
}

type Ctx = {
  supabase: SupabaseClient<Database>;
  userId: string;
  startIso: string;
  endIso: string;
  startYmd: string;
  endYmd: string;
  /** Kalenderdagen in venster tot en met vandaag (UTC) of tot endYmd. */
  calendarDays: string[];
};

function buildCtx(
  supabase: SupabaseClient<Database>,
  userId: string,
  startsAt: string,
  endsAt: string | null,
  nowMs: number
): Ctx {
  const start = new Date(startsAt);
  const endMs = endsAt ? Math.min(nowMs, new Date(endsAt).getTime()) : nowMs;
  const end = new Date(endMs);
  const startYmd = toYmd(start);
  const endYmd = toYmd(end);
  const todayYmd = toYmd(new Date(nowMs));
  const effectiveEndYmd = endYmd < todayYmd ? endYmd : todayYmd;
  const calendarDays = ymdRangeInclusive(startYmd, effectiveEndYmd);
  return {
    supabase,
    userId,
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    startYmd,
    endYmd,
    calendarDays,
  };
}

async function fetchTasksForWindow(ctx: Ctx) {
  const { data, error } = await ctx.supabase
    .from("tasks")
    .select("due_date, completed, completed_at, task_tags, parent_task_id, deleted_at")
    .eq("user_id", ctx.userId)
    .is("parent_task_id", null)
    .is("deleted_at", null);
  if (error || !data) return [];
  return data as {
    due_date: string | null;
    completed: boolean | null;
    completed_at: string | null;
    task_tags: unknown;
  }[];
}

async function evaluatePresetValue(
  preset: PlatformGameMetricPresetId,
  aggregation: MetricAggregation,
  ctx: Ctx,
  rule: PlatformGameAutoRuleParsed
): Promise<{ value: number; detail?: string; satisfiedDirect?: boolean }> {
  const tasks = await fetchTasksForWindow(ctx);

  switch (preset) {
    case "missions_completed_in_window": {
      let n = 0;
      for (const t of tasks) {
        if (!t.completed || !t.completed_at) continue;
        const ts = new Date(t.completed_at).getTime();
        if (ts >= new Date(ctx.startIso).getTime() && ts <= new Date(ctx.endIso).getTime()) n++;
      }
      return { value: n };
    }
    case "missions_due_completion_rate_pct": {
      let total = 0;
      let done = 0;
      for (const t of tasks) {
        const dd = t.due_date;
        if (!dd || dd < ctx.startYmd || dd > ctx.endYmd) continue;
        total++;
        if (t.completed) done++;
      }
      const pct = total === 0 ? 100 : Math.round((done / total) * 1000) / 10;
      return { value: pct, detail: `${done}/${total} taken op due-dagen` };
    }
    case "protocol_missions_completed_in_window": {
      let n = 0;
      for (const t of tasks) {
        if (!taskTagsInclude(t.task_tags, "protocol")) continue;
        if (!t.completed || !t.completed_at) continue;
        const ts = new Date(t.completed_at).getTime();
        if (ts >= new Date(ctx.startIso).getTime() && ts <= new Date(ctx.endIso).getTime()) n++;
      }
      return { value: n };
    }
    case "growth_tagged_missions_completed_in_window": {
      let n = 0;
      for (const t of tasks) {
        if (!taskTagsInclude(t.task_tags, "growth")) continue;
        if (!t.completed || !t.completed_at) continue;
        const ts = new Date(t.completed_at).getTime();
        if (ts >= new Date(ctx.startIso).getTime() && ts <= new Date(ctx.endIso).getTime()) n++;
      }
      return { value: n };
    }
    case "learning_minutes_total": {
      const { data, error } = await ctx.supabase
        .from("learning_sessions")
        .select("date, minutes")
        .eq("user_id", ctx.userId)
        .gte("date", ctx.startYmd)
        .lte("date", ctx.endYmd);
      if (error || !data) return { value: 0 };
      const sum = (data as { minutes: number }[]).reduce((a, r) => a + (Number(r.minutes) || 0), 0);
      if (aggregation === "period_average_per_active_day") {
        const daysWith = new Set((data as { date: string }[]).map((r) => r.date)).size;
        return { value: daysWith ? Math.round((sum / daysWith) * 10) / 10 : 0, detail: `${sum} min over ${daysWith} dagen` };
      }
      if (aggregation === "each_calendar_day") {
        const byDay: Record<string, number> = {};
        for (const r of data as { date: string; minutes: number }[]) {
          byDay[r.date] = (byDay[r.date] ?? 0) + (Number(r.minutes) || 0);
        }
        const minRequired = Math.max(1, Math.round(rule.params?.minMinutesPerDay ?? rule.threshold ?? 30));
        let fail = 0;
        for (const d of ctx.calendarDays) {
          if ((byDay[d] ?? 0) < minRequired) fail++;
        }
        return {
          value: ctx.calendarDays.length > 0 && fail === 0 ? 1 : 0,
          detail:
            fail === 0
              ? `Elke dag ≥ ${minRequired} min (${ctx.calendarDays.length} dagen)`
              : `${fail} dag(en) onder ${minRequired} min`,
          satisfiedDirect: ctx.calendarDays.length > 0 && fail === 0,
        };
      }
      return { value: sum };
    }
    case "learning_logged_days_count": {
      const { data, error } = await ctx.supabase
        .from("learning_sessions")
        .select("date")
        .eq("user_id", ctx.userId)
        .gte("date", ctx.startYmd)
        .lte("date", ctx.endYmd);
      if (error || !data) return { value: 0 };
      const days = new Set((data as { date: string }[]).map((r) => r.date));
      return { value: days.size };
    }
    case "budget_entries_count": {
      const { count, error } = await ctx.supabase
        .from("budget_entries")
        .select("id", { count: "exact", head: true })
        .eq("user_id", ctx.userId)
        .gte("date", ctx.startYmd)
        .lte("date", ctx.endYmd);
      if (error) return { value: 0 };
      return { value: count ?? 0 };
    }
    case "brain_checkin_days": {
      const { data, error } = await ctx.supabase
        .from("daily_state")
        .select("date, energy, focus")
        .eq("user_id", ctx.userId)
        .gte("date", ctx.startYmd)
        .lte("date", ctx.endYmd);
      if (error || !data) return { value: 0 };
      const rows = data as { date: string; energy: number | null; focus: number | null }[];
      let checkinDays = 0;
      for (const r of rows) {
        if (r.energy != null && r.focus != null) checkinDays++;
      }
      if (aggregation === "each_calendar_day") {
        const ok = new Set(rows.filter((r) => r.energy != null && r.focus != null).map((r) => r.date));
        let missing = 0;
        for (const d of ctx.calendarDays) {
          if (!ok.has(d)) missing++;
        }
        return {
          value: ctx.calendarDays.length > 0 && missing === 0 ? 1 : 0,
          detail: missing === 0 ? "Check-in elke dag" : `${missing} dag(en) zonder energy+focus`,
          satisfiedDirect: ctx.calendarDays.length > 0 && missing === 0,
        };
      }
      return { value: checkinDays };
    }
    case "rest_days_logged": {
      const { data, error } = await ctx.supabase
        .from("daily_state")
        .select("date, is_rest_day")
        .eq("user_id", ctx.userId)
        .gte("date", ctx.startYmd)
        .lte("date", ctx.endYmd);
      if (error || !data) return { value: 0 };
      const n = (data as { is_rest_day: boolean | null }[]).filter((r) => r.is_rest_day === true).length;
      return { value: n };
    }
    case "distinct_mission_completion_days": {
      const days = new Set<string>();
      for (const t of tasks) {
        if (!t.completed || !t.completed_at) continue;
        const ts = new Date(t.completed_at).getTime();
        if (ts < new Date(ctx.startIso).getTime() || ts > new Date(ctx.endIso).getTime()) continue;
        days.add(toYmd(new Date(ts)));
      }
      return { value: days.size };
    }
    case "max_single_day_missions_completed": {
      const byDay: Record<string, number> = {};
      for (const t of tasks) {
        if (!t.completed || !t.completed_at) continue;
        const ts = new Date(t.completed_at).getTime();
        if (ts < new Date(ctx.startIso).getTime() || ts > new Date(ctx.endIso).getTime()) continue;
        const d = toYmd(new Date(ts));
        byDay[d] = (byDay[d] ?? 0) + 1;
      }
      let max = 0;
      for (const v of Object.values(byDay)) if (v > max) max = v;
      return { value: max };
    }
    case "user_streak_current": {
      const { data, error } = await ctx.supabase
        .from("user_streak")
        .select("current_streak")
        .eq("user_id", ctx.userId)
        .maybeSingle();
      if (error || !data) return { value: 0 };
      return { value: Number((data as { current_streak?: number }).current_streak ?? 0) };
    }
    case "days_meeting_daily_mission_quota": {
      const minPer = Math.max(1, Math.round(rule.params?.minPerDay ?? 2));
      const byDay: Record<string, number> = {};
      for (const t of tasks) {
        if (!t.completed || !t.completed_at) continue;
        const ts = new Date(t.completed_at).getTime();
        if (ts < new Date(ctx.startIso).getTime() || ts > new Date(ctx.endIso).getTime()) continue;
        const d = toYmd(new Date(ts));
        byDay[d] = (byDay[d] ?? 0) + 1;
      }
      let met = 0;
      for (const d of ctx.calendarDays) {
        if ((byDay[d] ?? 0) >= minPer) met++;
      }
      return { value: met, detail: `≥${minPer} missies/dag` };
    }
    case "days_meeting_daily_learning_minutes": {
      const minMin = Math.max(1, Math.round(rule.params?.minMinutesPerDay ?? 30));
      const { data, error } = await ctx.supabase
        .from("learning_sessions")
        .select("date, minutes")
        .eq("user_id", ctx.userId)
        .gte("date", ctx.startYmd)
        .lte("date", ctx.endYmd);
      if (error || !data) return { value: 0 };
      const byDay: Record<string, number> = {};
      for (const r of data as { date: string; minutes: number }[]) {
        byDay[r.date] = (byDay[r.date] ?? 0) + (Number(r.minutes) || 0);
      }
      let met = 0;
      for (const d of ctx.calendarDays) {
        if ((byDay[d] ?? 0) >= minMin) met++;
      }
      return { value: met, detail: `≥${minMin} min/dag` };
    }
    default:
      return { value: 0, detail: "Onbekend preset" };
  }
}

export async function evaluatePlatformGameAutoRules(
  supabase: SupabaseClient<Database>,
  userId: string,
  startsAt: string,
  endsAt: string | null,
  rules: PlatformGameAutoRuleParsed[],
  winLogic: "all" | "any",
  nowMs: number = Date.now()
): Promise<{ satisfied: boolean; results: RuleEvalResult[] }> {
  const ctx = buildCtx(supabase, userId, startsAt, endsAt, nowMs);
  const results: RuleEvalResult[] = [];

  for (const rule of rules) {
    const def = getMetricPreset(rule.preset);
    const label = rule.label?.trim() || def?.label || rule.preset;
    const { value, detail, satisfiedDirect } = await evaluatePresetValue(rule.preset, rule.aggregation, ctx, rule);

    const satisfied =
      satisfiedDirect !== undefined ? satisfiedDirect : compareOp(value, rule.operator, rule.threshold);

    results.push({
      ruleId: rule.id,
      label,
      preset: rule.preset,
      aggregation: rule.aggregation,
      operator: rule.operator,
      threshold: rule.threshold,
      value,
      satisfied,
      detail,
    });
  }

  const satisfied =
    results.length === 0
      ? false
      : winLogic === "any"
        ? results.some((r) => r.satisfied)
        : results.every((r) => r.satisfied);

  return { satisfied, results };
}

export function parseAutoRulesFromConfig(progress: Record<string, unknown>): {
  winLogic: "all" | "any";
  rules: PlatformGameAutoRuleParsed[];
} {
  const winLogicRaw = progress.winLogic;
  const winLogic = winLogicRaw === "any" ? "any" : "all";
  const rulesRaw = progress.rules;
  const rules: PlatformGameAutoRuleParsed[] = [];
  if (!Array.isArray(rulesRaw)) return { winLogic, rules };

  for (const item of rulesRaw) {
    const o = asRecord(item);
    if (!o) continue;
    const id = typeof o.id === "string" ? o.id.trim() : "";
    const preset = typeof o.preset === "string" ? o.preset.trim() : "";
    if (!id || !getMetricPreset(preset)) continue;

    const aggRaw = typeof o.aggregation === "string" ? o.aggregation.trim() : "";
    const def = getMetricPreset(preset)!;
    const aggregation = def.aggregations.includes(aggRaw as MetricAggregation)
      ? (aggRaw as MetricAggregation)
      : def.defaultAggregation;

    const opRaw = typeof o.operator === "string" ? o.operator.trim() : "gte";
    const operator: MetricOperator = opRaw === "lte" || opRaw === "eq" ? opRaw : "gte";

    let threshold = typeof o.threshold === "number" && Number.isFinite(o.threshold) ? o.threshold : def.defaultThreshold;
    if (preset === "missions_due_completion_rate_pct") threshold = Math.max(0, Math.min(100, threshold));

    const pr = asRecord(o.params);
    const parsedParams: { minPerDay?: number; minMinutesPerDay?: number } = { ...def.defaultParams };
    if (pr) {
      if (typeof pr.minPerDay === "number" && Number.isFinite(pr.minPerDay)) parsedParams.minPerDay = pr.minPerDay;
      if (typeof pr.minMinutesPerDay === "number" && Number.isFinite(pr.minMinutesPerDay)) {
        parsedParams.minMinutesPerDay = pr.minMinutesPerDay;
      }
    }

    rules.push({
      id,
      label: typeof o.label === "string" ? o.label : undefined,
      preset: preset as PlatformGameMetricPresetId,
      aggregation,
      operator,
      threshold,
      params: Object.keys(parsedParams).length ? parsedParams : undefined,
    });
  }

  return { winLogic, rules };
}
