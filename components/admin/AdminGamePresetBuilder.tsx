"use client";

import { useCallback, useId, useMemo, useState } from "react";
import {
  PLATFORM_GAME_METRIC_PRESETS,
  type MetricAggregation,
  type MetricOperator,
  type PlatformGameMetricPresetDef,
  type PlatformGameMetricPresetId,
} from "@/lib/platform-games-metric-presets";

type RuleRow = {
  id: string;
  preset: PlatformGameMetricPresetId;
  aggregation: MetricAggregation;
  operator: MetricOperator;
  threshold: number;
  label: string;
  minPerDay?: number;
  minMinutesPerDay?: number;
};

function mergeProgressIntoConfig(existingJson: string, progress: Record<string, unknown>): string {
  let root: Record<string, unknown> = {};
  try {
    const p = JSON.parse(existingJson.trim() || "{}") as unknown;
    if (p && typeof p === "object" && !Array.isArray(p)) root = p as Record<string, unknown>;
  } catch {
    root = {};
  }
  root.progress = progress;
  return JSON.stringify(root, null, 2);
}

function randomId(): string {
  return `r_${Math.random().toString(36).slice(2, 10)}`;
}

function defFor(preset: PlatformGameMetricPresetId): PlatformGameMetricPresetDef {
  return PLATFORM_GAME_METRIC_PRESETS.find((p) => p.id === preset)!;
}

function ruleToJson(r: RuleRow): Record<string, unknown> {
  const d = defFor(r.preset);
  const params: Record<string, number> = {};
  if (r.preset === "days_meeting_daily_mission_quota" && r.minPerDay != null) params.minPerDay = r.minPerDay;
  if (r.preset === "days_meeting_daily_learning_minutes" && r.minMinutesPerDay != null) {
    params.minMinutesPerDay = r.minMinutesPerDay;
  }
  if (r.preset === "learning_minutes_total" && r.aggregation === "each_calendar_day" && r.minMinutesPerDay != null) {
    params.minMinutesPerDay = r.minMinutesPerDay;
  }
  const o: Record<string, unknown> = {
    id: r.id,
    preset: r.preset,
    aggregation: r.aggregation,
    operator: r.operator,
    threshold: r.threshold,
  };
  if (r.label.trim()) o.label = r.label.trim();
  if (Object.keys(params).length) o.params = params;
  return o;
}

const TEMPLATES: { id: string; label: string; description: string; rules: Omit<RuleRow, "id">[] }[] = [
  {
    id: "perfect_missions",
    label: "100% missies op due-dagen",
    description: "Alles wat in het venster gepland stond, moet af zijn.",
    rules: [
      {
        preset: "missions_due_completion_rate_pct",
        aggregation: "period_total",
        operator: "gte",
        threshold: 100,
        label: "",
      },
    ],
  },
  {
    id: "missions_plus_protocol",
    label: "5 missies + 2 protocol-taken",
    description: "Volume + focus op growth/protocol.",
    rules: [
      {
        preset: "missions_completed_in_window",
        aggregation: "period_total",
        operator: "gte",
        threshold: 5,
        label: "",
      },
      {
        preset: "protocol_missions_completed_in_window",
        aggregation: "period_total",
        operator: "gte",
        threshold: 2,
        label: "",
      },
    ],
  },
  {
    id: "learning_week",
    label: "Learning-week (activiteit + 5 dagen log)",
    description: "Totaal leertijd én consistentie.",
    rules: [
      {
        preset: "learning_minutes_total",
        aggregation: "period_total",
        operator: "gte",
        threshold: 120,
        label: "",
      },
      {
        preset: "learning_logged_days_count",
        aggregation: "period_total",
        operator: "gte",
        threshold: 5,
        label: "",
      },
    ],
  },
  {
    id: "daily_learning_strict",
    label: "Streng: elke dag leren",
    description: "Gebruikt each_calendar_day + dagdrempel in params.",
    rules: [
      {
        preset: "learning_minutes_total",
        aggregation: "each_calendar_day",
        operator: "gte",
        threshold: 1,
        label: "Dagelijks leerquota",
        minMinutesPerDay: 30,
      },
    ],
  },
  {
    id: "brain_budget",
    label: "Check-in + budget bewustzijn",
    description: "5 dagen brain + 3 budgetregels.",
    rules: [
      {
        preset: "brain_checkin_days",
        aggregation: "period_total",
        operator: "gte",
        threshold: 5,
        label: "",
      },
      {
        preset: "budget_entries_count",
        aggregation: "period_total",
        operator: "gte",
        threshold: 3,
        label: "",
      },
    ],
  },
  {
    id: "streak_guard",
    label: "Streak ≥7 tijdens event",
    description: "Snapshot van huidige streak (geen historische replay).",
    rules: [
      {
        preset: "user_streak_current",
        aggregation: "snapshot_now",
        operator: "gte",
        threshold: 7,
        label: "",
      },
    ],
  },
  {
    id: "double_growth_missions",
    label: "Dubbel growth-tagged volume",
    description: "Minstens 4 afgeronde growth-getagde missies in het venster.",
    rules: [
      {
        preset: "growth_tagged_missions_completed_in_window",
        aggregation: "period_total",
        operator: "gte",
        threshold: 4,
        label: "Growth-missies (tags)",
      },
    ],
  },
];

type Props = {
  configJson: string;
  setConfigJson: (next: string) => void;
};

export function AdminGamePresetBuilder({ configJson, setConfigJson }: Props) {
  const uid = useId();
  const [winLogic, setWinLogic] = useState<"all" | "any">("all");
  const [rewardXp, setRewardXp] = useState(250);
  const [winMessage, setWinMessage] = useState("Challenge voltooid — goed bezig!");
  const [rules, setRules] = useState<RuleRow[]>([]);
  const [presetPick, setPresetPick] = useState<PlatformGameMetricPresetId>("missions_completed_in_window");

  const presetOptions = useMemo(() => PLATFORM_GAME_METRIC_PRESETS, []);

  const addRule = useCallback(
    (preset: PlatformGameMetricPresetId) => {
      const d = defFor(preset);
      setRules((prev) => [
        ...prev,
        {
          id: randomId(),
          preset,
          aggregation: d.defaultAggregation,
          operator: d.defaultOperator,
          threshold: d.defaultThreshold,
          label: "",
          minPerDay: d.defaultParams?.minPerDay,
          minMinutesPerDay: d.defaultParams?.minMinutesPerDay,
        },
      ]);
    },
    []
  );

  const applyTemplate = useCallback((tid: string) => {
    const t = TEMPLATES.find((x) => x.id === tid);
    if (!t) return;
    setWinLogic("all");
    setRules(
      t.rules.map((r) => ({
        ...r,
        id: randomId(),
      }))
    );
  }, []);

  const applyToConfig = useCallback(() => {
    if (rules.length === 0) return;
    const progress: Record<string, unknown> = {
      mode: "auto",
      winLogic,
      rewardXp: Math.max(0, Math.min(1_000_000, Math.round(rewardXp))),
      winMessage: winMessage.trim() || null,
      rules: rules.map(ruleToJson),
    };
    setConfigJson(mergeProgressIntoConfig(configJson, progress));
  }, [configJson, rewardXp, rules, setConfigJson, winLogic, winMessage]);

  return (
    <div className="rounded-xl border border-violet-500/30 bg-violet-950/25 p-4 text-white/90">
      <p className="text-[10px] font-bold uppercase tracking-wider text-violet-300/90">Preset-builder (auto-meting)</p>
      <p className="mt-1 text-xs text-white/50">
        Stel regels samen; de site meet zelf op basis van jouw data (taken, learning, budget, daily state). Daarna
        &quot;Toepassen op JSON&quot; — je kunt het resultaat nog handmatig finetunen.{" "}
        <span className="text-violet-200/90">Modus auto</span> sluit checklist/antwoord uit.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="w-full text-[10px] font-semibold uppercase tracking-wide text-white/40">Snel-start templates</span>
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => applyTemplate(t.id)}
            title={t.description}
            className="rounded-lg border border-white/15 bg-black/30 px-2 py-1.5 text-left text-[11px] text-white/85 hover:bg-white/10"
          >
            <span className="font-semibold text-violet-200/95">{t.label}</span>
            <span className="mt-0.5 block text-[10px] text-white/45">{t.description}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-wide text-white/45" htmlFor={`${uid}-wl`}>
            Win: alle regels / één regel
          </label>
          <select
            id={`${uid}-wl`}
            value={winLogic}
            onChange={(e) => setWinLogic(e.target.value === "any" ? "any" : "all")}
            className="w-full rounded-lg border border-white/15 bg-black/40 px-2 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-violet-500/50"
          >
            <option value="all">Alle regels moeten kloppen (EN)</option>
            <option value="any">Minstens één regel (OF)</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-wide text-white/45" htmlFor={`${uid}-xp`}>
            Reward XP bij halen
          </label>
          <input
            id={`${uid}-xp`}
            type="number"
            min={0}
            max={1_000_000}
            value={rewardXp}
            onChange={(e) => setRewardXp(Number(e.target.value))}
            className="w-full rounded-lg border border-white/15 bg-black/40 px-2 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-violet-500/50"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-[10px] uppercase tracking-wide text-white/45" htmlFor={`${uid}-wm`}>
            Win-bericht
          </label>
          <input
            id={`${uid}-wm`}
            value={winMessage}
            onChange={(e) => setWinMessage(e.target.value)}
            className="w-full rounded-lg border border-white/15 bg-black/40 px-2 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-violet-500/50"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-white/10 pt-4">
        <div className="min-w-[200px] flex-1">
          <label className="mb-1 block text-[10px] uppercase tracking-wide text-white/45">Preset toevoegen</label>
          <select
            value={presetPick}
            onChange={(e) => setPresetPick(e.target.value as PlatformGameMetricPresetId)}
            className="w-full rounded-lg border border-white/15 bg-black/40 px-2 py-2 text-xs text-white outline-none focus:ring-2 focus:ring-violet-500/50"
          >
            {presetOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => addRule(presetPick)}
          className="rounded-lg border border-violet-400/40 bg-violet-500/20 px-3 py-2 text-xs font-semibold text-violet-100 hover:bg-violet-500/30"
        >
          + Regel
        </button>
      </div>

      {rules.length === 0 ? (
        <p className="mt-3 text-xs text-white/40">Nog geen regels — kies een template of voeg presets toe.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {rules.map((r, idx) => {
            const d = defFor(r.preset);
            return (
              <li key={r.id} className="rounded-lg border border-white/10 bg-black/25 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="text-[10px] font-mono text-white/40">#{idx + 1}</div>
                  <button
                    type="button"
                    onClick={() => setRules((prev) => prev.filter((x) => x.id !== r.id))}
                    className="text-[11px] text-rose-300 hover:underline"
                  >
                    Verwijderen
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-white/55">{d.shortHint}</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <label className="block text-[10px] text-white/45">
                    Meting
                    <select
                      value={r.preset}
                      onChange={(e) => {
                        const p = e.target.value as PlatformGameMetricPresetId;
                        const nd = defFor(p);
                        setRules((prev) =>
                          prev.map((x) =>
                            x.id === r.id
                              ? {
                                  ...x,
                                  preset: p,
                                  aggregation: nd.defaultAggregation,
                                  operator: nd.defaultOperator,
                                  threshold: nd.defaultThreshold,
                                  minPerDay: nd.defaultParams?.minPerDay,
                                  minMinutesPerDay: nd.defaultParams?.minMinutesPerDay,
                                }
                              : x
                          )
                        );
                      }}
                      className="mt-1 w-full rounded border border-white/15 bg-black/40 px-2 py-1.5 text-xs text-white"
                    >
                      {presetOptions.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-[10px] text-white/45">
                    Aggregatie
                    <select
                      value={r.aggregation}
                      onChange={(e) =>
                        setRules((prev) =>
                          prev.map((x) => (x.id === r.id ? { ...x, aggregation: e.target.value as MetricAggregation } : x))
                        )
                      }
                      className="mt-1 w-full rounded border border-white/15 bg-black/40 px-2 py-1.5 text-xs text-white"
                    >
                      {d.aggregations.map((a) => (
                        <option key={a} value={a}>
                          {a === "period_total"
                            ? "Totaal / gem. over periode"
                            : a === "period_average_per_active_day"
                              ? "Gemiddelde per actieve dag"
                              : a === "each_calendar_day"
                                ? "Elke kalenderdag (streng)"
                                : "Momentopname (nu)"}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-[10px] text-white/45">
                    Operator
                    <select
                      value={r.operator}
                      onChange={(e) =>
                        setRules((prev) =>
                          prev.map((x) => (x.id === r.id ? { ...x, operator: e.target.value as MetricOperator } : x))
                        )
                      }
                      className="mt-1 w-full rounded border border-white/15 bg-black/40 px-2 py-1.5 text-xs text-white"
                    >
                      <option value="gte">≥ (minimaal)</option>
                      <option value="lte">≤ (maximaal)</option>
                      <option value="eq">= (exact)</option>
                    </select>
                  </label>
                  <label className="block text-[10px] text-white/45">
                    Drempel
                    <input
                      type="number"
                      value={r.threshold}
                      onChange={(e) =>
                        setRules((prev) =>
                          prev.map((x) =>
                            x.id === r.id ? { ...x, threshold: Number(e.target.value) || 0 } : x
                          )
                        )
                      }
                      className="mt-1 w-full rounded border border-white/15 bg-black/40 px-2 py-1.5 text-xs text-white"
                    />
                  </label>
                  <label className="block text-[10px] text-white/45 sm:col-span-2">
                    Eigen label (optioneel, op profiel)
                    <input
                      value={r.label}
                      onChange={(e) =>
                        setRules((prev) => prev.map((x) => (x.id === r.id ? { ...x, label: e.target.value } : x)))
                      }
                      className="mt-1 w-full rounded border border-white/15 bg-black/40 px-2 py-1.5 text-xs text-white"
                    />
                  </label>
                  {r.preset === "days_meeting_daily_mission_quota" ? (
                    <label className="block text-[10px] text-white/45">
                      Min. missies per dag (params)
                      <input
                        type="number"
                        min={1}
                        value={r.minPerDay ?? 2}
                        onChange={(e) =>
                          setRules((prev) =>
                            prev.map((x) =>
                              x.id === r.id ? { ...x, minPerDay: Math.max(1, Number(e.target.value) || 1) } : x
                            )
                          )
                        }
                        className="mt-1 w-full rounded border border-white/15 bg-black/40 px-2 py-1.5 text-xs text-white"
                      />
                    </label>
                  ) : null}
                  {(r.preset === "days_meeting_daily_learning_minutes" ||
                    (r.preset === "learning_minutes_total" && r.aggregation === "each_calendar_day")) && (
                    <label className="block text-[10px] text-white/45">
                      Dagelijkse leerdrempel (params)
                      <input
                        type="number"
                        min={1}
                        value={r.minMinutesPerDay ?? 30}
                        onChange={(e) =>
                          setRules((prev) =>
                            prev.map((x) =>
                              x.id === r.id
                                ? { ...x, minMinutesPerDay: Math.max(1, Number(e.target.value) || 1) }
                                : x
                            )
                          )
                        }
                        className="mt-1 w-full rounded border border-white/15 bg-black/40 px-2 py-1.5 text-xs text-white"
                      />
                    </label>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        disabled={rules.length === 0}
        onClick={applyToConfig}
        className="mt-4 rounded-lg bg-violet-500 px-4 py-2 text-sm font-semibold text-[#0a0612] hover:bg-violet-400 disabled:opacity-40"
      >
        Toepassen op config JSON (progress.auto)
      </button>
    </div>
  );
}
