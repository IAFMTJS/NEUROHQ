"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { HeatmapDay } from "@/app/actions/dcic/heatmap";
import type { XPForecastItem } from "@/app/actions/dcic/xp-forecast";
import type { InsightEngineState, XPBySourceItem } from "@/app/actions/dcic/insight-engine";
import { createTask } from "@/app/actions/tasks";
import { WeeklyHeatmap } from "@/components/dashboard/WeeklyHeatmap";
import { XPForecastWidget } from "@/components/dashboard/XPForecastWidget";
import { HQChart } from "@/components/hq/HQChart";
import type { BehaviorProfile } from "@/types/behavior-profile.types";
import type { BrainMode } from "@/lib/brain-mode";

const DAY_NAMES = ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"];

function sourceLabel(source_type: string): string {
  const labels: Record<string, string> = {
    task_complete: "Missies voltooid",
    brain_status: "Brain status",
    learning_session: "Learning session",
    weekly_learning_target: "Weekly learning",
    streak_day: "Streak dag",
  };
  return labels[source_type] ?? source_type.replace(/_/g, " ");
}

export type MissionTemplateItem = {
  id: string;
  title: string;
  domain: "discipline" | "health" | "learning" | "business";
  energy: number;
  category: "work" | "personal" | null;
  baseXP: number | null;
  xpLevel?: "low" | "normal" | "high";
  description?: string;
};

type Identity = {
  total_xp: number;
  level: number;
  rank: string;
  xp_to_next_level: number;
  next_unlock: { level: number; rank: string; xpNeeded: number };
  streak: { current: number; longest: number; last_completion_date: string | null };
};

type Props = {
  identity: Identity;
  forecast: XPForecastItem[];
  insightState: InsightEngineState | null;
  heatmapDays: { date: string; status: HeatmapDay }[];
  velocity: number;
  chartData: { name: string; value: number; streakOverlay?: number; streakActive?: boolean }[];
  progress: number;
  range: { current: number; needed: number };
  xpLast7: number;
  xpPrevious7: number;
  xpBySource: XPBySourceItem[];
  todayStr: string;
  missionTemplates: MissionTemplateItem[];
  behaviorProfile: BehaviorProfile;
  brainModeToday: BrainMode;
  activeMissionCountToday: number;
};

export default function XPPageContent({
  identity,
  forecast,
  insightState,
  heatmapDays,
  velocity,
  chartData,
  progress,
  range,
  xpLast7,
  xpPrevious7,
  xpBySource,
  todayStr,
  missionTemplates,
  behaviorProfile,
  brainModeToday,
  activeMissionCountToday,
}: Props) {
  const router = useRouter();
  const [commanderMode, setCommanderMode] = useState(true);
  const [chartDays, setChartDays] = useState<7 | 14>(14);
  const [pendingAddId, setPendingAddId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [domainFilter, setDomainFilter] = useState<string>("");
  const [xpLevelFilter, setXpLevelFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);
  /** Date to add extra missions to (default: today; user can pick another day). */
  const [addMissionDate, setAddMissionDate] = useState(todayStr);
  const maxSlotsToday = brainModeToday.maxSlots;
  const addBlockedToday = brainModeToday.addBlocked;

  const fitnessCommitment = behaviorProfile.hobbyCommitment.fitness ?? 0;
  const showFitnessDecayMirror = fitnessCommitment > 0 && fitnessCommitment <= 0.3;

  const chartDataFiltered = useMemo(
    () => (chartDays === 7 ? chartData.slice(-7) : chartData),
    [chartData, chartDays]
  );

  const filteredTemplates = useMemo(() => {
    let list = missionTemplates;
    if (domainFilter) {
      list = list.filter((t) => t.domain === domainFilter);
    }
    if (xpLevelFilter) {
      list = list.filter((t) => (t.xpLevel ?? "normal") === xpLevelFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description ?? "").toLowerCase().includes(q)
      );
    }

    // Behaviour-based weighting: boost templates die matchen met identity targets en hobbies
    const identityTargets = new Set(behaviorProfile.identityTargets);
    const fitnessCommitment = behaviorProfile.hobbyCommitment.fitness ?? 0;

    const scoreTemplate = (t: MissionTemplateItem): number => {
      let score = 0;
      if (identityTargets.has("fit_person") && t.domain === "health") score += 2;
      if (identityTargets.has("disciplined") && t.domain === "discipline") score += 2;
      if (identityTargets.has("financial_control") && t.domain === "business") score += 2;
      if (fitnessCommitment >= 0.5 && t.domain === "health") score += 1;
      return score;
    };

    return [...list].sort((a, b) => scoreTemplate(b) - scoreTemplate(a));
  }, [missionTemplates, domainFilter, xpLevelFilter, searchQuery, behaviorProfile]);

  const cardClass = commanderMode
    ? "rounded-2xl border-2 border-[var(--accent-focus)]/40 bg-[var(--dc-bg-elevated)] p-4 shadow-lg"
    : "glass-card p-4 rounded-2xl border border-[var(--card-border)]";

  function addMission(template: MissionTemplateItem, dueDate?: string) {
    const date = dueDate ?? addMissionDate ?? todayStr;
    const slotsFilledToday = activeMissionCountToday >= maxSlotsToday;
    const limitMessage =
      addBlockedToday && date === todayStr
        ? "Mentale belasting te hoog. Vandaag geen nieuwe missies toevoegen; afronden of uit je agenda halen."
        : slotsFilledToday && date === todayStr
          ? "Je hebt je focus slots gevuld. Kies één missie om eerst af te maken of te verplaatsen; dan mag er weer één bij."
          : null;
    if (limitMessage) {
      // For now, surface via browser alert to keep UI simple in this context.
      alert(limitMessage);
      return;
    }
    setPendingAddId(template.id);
    startTransition(async () => {
      try {
        await createTask({
          title: template.title,
          due_date: date,
          domain: template.domain,
          energy_required: template.energy,
          category: template.category ?? null,
          base_xp: template.baseXP ?? undefined,
        });
        router.refresh();
      } finally {
        setPendingAddId(null);
      }
    });
  }

  const ins = insightState;
  const bestDayName = ins?.bestDayOfWeek != null ? DAY_NAMES[ins.bestDayOfWeek] : null;

  return (
    <div className="space-y-6">
      {/* Mode toggle — Commander standaard, meer functies */}
      <section
        className={`rounded-xl border px-4 py-3 ${
          commanderMode ? "border-[var(--accent-focus)]/50 bg-[var(--dc-bg-elevated)]" : "border-[var(--card-border)] bg-[var(--bg-surface)]/50"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-xs font-semibold uppercase tracking-wider ${
              commanderMode ? "text-[var(--accent-focus)]" : "text-[var(--text-muted)]"
            }`}
          >
            {commanderMode ? "Commander · Volledig overzicht" : "Basic"}
          </span>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text-primary)]">
            <span className={!commanderMode ? "font-medium text-[var(--text-primary)]" : "text-[var(--text-muted)]"}>
              Basic
            </span>
            <input
              type="checkbox"
              checked={commanderMode}
              onChange={(e) => setCommanderMode(e.target.checked)}
              className="rounded border-[var(--card-border)]"
              aria-label="Commander mode aan/uit"
            />
            <span className={commanderMode ? "font-medium text-[var(--accent-focus)]" : "text-[var(--text-muted)]"}>
              Commander
            </span>
          </label>
        </div>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          {commanderMode
            ? "Momentum, trend, streak risk, level-projected, coach-advies, XP per bron, 100 templates met filter."
            : "Eenvoudig: XP, streak, grafiek, tips, heatmap, forecast, missielijst."}
        </p>
      </section>

      {/* XP & Level */}
      <section className={cardClass} aria-label="XP overzicht">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">XP & Level</h2>
        <div className="mt-3 flex flex-wrap items-baseline gap-3">
          <span className="text-2xl font-bold text-[var(--text-primary)]">{identity.total_xp}</span>
          <span className="text-sm text-[var(--text-muted)]">XP totaal</span>
          <span className="rounded-full bg-[var(--accent-focus)]/20 px-2 py-0.5 text-xs font-medium text-[var(--accent-focus)]">
            Level {identity.level} · {identity.rank}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <span>Velocity: {velocity} XP/dag (laatste 7)</span>
        </div>
        <div className="mt-3">
          <div className="flex justify-between text-xs text-[var(--text-muted)]">
            <span>
              {range.current} / {range.needed} naar level {identity.level + 1}
            </span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[var(--accent-focus)] transition-all duration-500"
              style={{ width: `${Math.min(100, progress * 100)}%` }}
            />
          </div>
        </div>
      </section>

      {/* Streak */}
      <section className={cardClass} aria-label="Streak">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Streak</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Huidige: <strong>{identity.streak.current}</strong> · Langste: <strong>{identity.streak.longest}</strong>
        </p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Opeenvolgende dagen met minstens 1 voltooide missie.
        </p>
      </section>

      {/* XP grafiek */}
      <section className={cardClass} aria-label="XP over tijd">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-semibold text-[var(--text-primary)]">
            XP laatste {chartDays} dagen
          </span>
          <div className="flex rounded-lg border border-[var(--card-border)] p-0.5">
            <button
              type="button"
              onClick={() => setChartDays(7)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                chartDays === 7 ? "bg-[var(--accent-focus)]/20 text-[var(--accent-focus)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              7d
            </button>
            <button
              type="button"
              onClick={() => setChartDays(14)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                chartDays === 14 ? "bg-[var(--accent-focus)]/20 text-[var(--accent-focus)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              14d
            </button>
          </div>
        </div>
        {chartDataFiltered.length > 0 ? (
          <HQChart
            data={chartDataFiltered}
            title=""
            variant="area"
            dataKey="value"
            secondaryKey="streakOverlay"
          />
        ) : (
          <div className="rounded-xl border border-dashed border-[var(--card-border)] bg-[var(--bg-surface)]/40 px-4 py-8 text-center">
            <p className="text-sm text-[var(--text-muted)]">Nog geen XP per dag in de laatste 14 dagen.</p>
            <a href="/tasks" className="mt-3 inline-block text-sm font-medium text-[var(--accent-focus)] hover:underline">
              Naar Missions →
            </a>
          </div>
        )}
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          Streak overlay toont op welke dagen XP en streak samenvallen.
        </p>
      </section>

      {/* Tips */}
      <section className={cardClass} aria-label="Tips voor meer XP">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Tips om sneller XP te verdienen</h2>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-[var(--text-secondary)]">
          <li>Voltooi minstens één missie per dag voor streak-bonus.</li>
          <li>Kies missies die aansluiten op je strategische focus (Primary +30%).</li>
          <li>Log je energie/focus voor brain-status XP.</li>
          <li>Combineer korte missies met lange voor een stabiele velocity.</li>
          <li>Gebruik Aanbevolen-filter voor taken met hoogste impact.</li>
        </ul>
        {showFitnessDecayMirror && (
          <div className="mt-3 rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)]/40 px-3 py-2">
            <p className="text-xs font-semibold text-[var(--text-secondary)]">Fitness-spiegel</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Je fitness-commitment is gedaald. Je gedrag weegt zwaarder dan je intentie.
            </p>
          </div>
        )}
      </section>

      <WeeklyHeatmap days={heatmapDays} />
      <XPForecastWidget forecasts={forecast} currentLevel={identity.level} />

      {/* Commander: echte metrics */}
      {commanderMode && ins && (
        <div className="space-y-4">
          <section className={cardClass} aria-label="Momentum & Trend">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Momentum & Trend</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl bg-white/5 px-3 py-3">
                <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">Momentum</p>
                <p className="mt-1 text-lg font-bold text-[var(--text-primary)]">{Math.round(ins.momentum.score)}</p>
                <p className="text-xs text-[var(--accent-focus)]">{ins.momentum.band}</p>
              </div>
              <div className="rounded-xl bg-white/5 px-3 py-3">
                <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">Trend</p>
                <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">{ins.trend.microcopy}</p>
                <p className="text-xs text-[var(--text-muted)]">{ins.trend.direction} · {ins.trend.changePct}%</p>
              </div>
              <div className="rounded-xl bg-white/5 px-3 py-3">
                <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">Streak risk</p>
                <p className="mt-1 text-lg font-bold text-[var(--text-primary)]">{ins.streakRisk.level}</p>
                <p className="text-xs text-[var(--text-muted)]">score {Math.round(ins.streakRisk.score)}</p>
              </div>
              <div className="rounded-xl bg-white/5 px-3 py-3">
                <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">Level ~</p>
                <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                  {ins.levelProjectionDays != null
                    ? `Level ${identity.level + 1} in ~${ins.levelProjectionDays} dagen`
                    : "—"}
                </p>
              </div>
            </div>
          </section>

          <section className={cardClass} aria-label="Completion & Beste dag">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Completion & Beste dag</h2>
            <div className="mt-2 flex flex-wrap gap-4 text-sm">
              <span>
                Completion rate (laatste 7):{" "}
                <strong>
                  {ins.completionRateLast7 != null ? `${Math.round(ins.completionRateLast7 * 100)}%` : "—"}
                </strong>
              </span>
              {bestDayName && (
                <span>
                  Beste dag: <strong>{bestDayName}</strong>
                </span>
              )}
            </div>
          </section>

          {ins.coachRecommendations.length > 0 && (
            <section className={cardClass} aria-label="Coach-advies">
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Coach-advies</h2>
              <ul className="mt-3 space-y-3">
                {ins.coachRecommendations.map((rec) => (
                  <li
                    key={rec.id}
                    className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-primary)]/40 px-3 py-3"
                  >
                    <p className="font-medium text-[var(--text-primary)]">{rec.title}</p>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">{rec.body}</p>
                    <a
                      href={rec.actionHref}
                      className="mt-2 inline-block text-sm font-medium text-[var(--accent-focus)] hover:underline"
                    >
                      {rec.actionLabel} →
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className={cardClass} aria-label="XP per bron (laatste 7 dagen)">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">XP per bron (laatste 7 dagen)</h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Waar komt je XP vandaan?</p>
            <div className="mt-2 text-sm text-[var(--text-secondary)]">
              Totaal laatste 7: <strong>{xpLast7}</strong> XP · Vorige 7: <strong>{xpPrevious7}</strong> XP
            </div>
            {xpBySource.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {xpBySource.map((item) => (
                  <li
                    key={item.source_type}
                    className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2"
                  >
                    <span className="text-[var(--text-primary)]">{sourceLabel(item.source_type)}</span>
                    <span className="font-medium text-[var(--accent-focus)]">
                      +{item.total} XP ({item.count}×)
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-[var(--text-muted)]">Nog geen XP-events in de laatste 7 dagen.</p>
            )}
          </section>
        </div>
      )}

      {/* Mission templates: Basic = simpele lijst; Commander = met filter, zoek, beschrijving */}
      <section className={cardClass} aria-label="XP-missies">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">
          XP-missies {commanderMode && "· 100 templates"}
        </h2>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Voeg een missie toe aan een gekozen dag en voltooi op de Missions-pagina om XP te verdienen.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <label className="text-xs text-[var(--text-muted)]">Voeg toe aan:</label>
          <input
            type="date"
            value={addMissionDate}
            onChange={(e) => setAddMissionDate(e.target.value || todayStr)}
            className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1.5 text-sm text-[var(--text-primary)]"
            aria-label="Datum voor toe te voegen missie"
          />
          {addMissionDate !== todayStr && (
            <button
              type="button"
              onClick={() => setAddMissionDate(todayStr)}
              className="text-xs text-[var(--accent-focus)] hover:underline"
            >
              Vandaag
            </button>
          )}
        </div>

        {commanderMode && (
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              type="search"
              placeholder="Zoek titel of beschrijving…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] w-full min-w-[180px] max-w-[240px]"
              aria-label="Zoek missies"
            />
            <select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)]"
              aria-label="Filter domein"
            >
              <option value="">Alle domeinen</option>
              <option value="discipline">Discipline</option>
              <option value="health">Health</option>
              <option value="learning">Learning</option>
              <option value="business">Business</option>
            </select>
            <select
              value={xpLevelFilter}
              onChange={(e) => setXpLevelFilter(e.target.value)}
              className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)]"
              aria-label="Filter XP-niveau"
            >
              <option value="">Alle XP-niveaus</option>
              <option value="low">Weinig (25 XP)</option>
              <option value="normal">Normaal (50 XP)</option>
              <option value="high">Veel (100 XP)</option>
            </select>
          </div>
        )}

        <ul className="mt-3 space-y-2 max-h-[360px] overflow-y-auto">
          {filteredTemplates.map((t) => (
            <li
              key={t.id}
              className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)]/40 px-3 py-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium text-[var(--text-primary)]">{t.title}</span>
                  {commanderMode && (
                    <span className="ml-2 rounded bg-[var(--accent-focus)]/15 px-1.5 py-0.5 text-[10px] font-medium text-[var(--accent-focus)]">
                      {t.domain}
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium text-[var(--accent-focus)]">{t.baseXP ?? "—"} XP</span>
                <button
                  type="button"
                  onClick={() => addMission(t)}
                  disabled={isPending && pendingAddId === t.id}
                  className="rounded-lg bg-[var(--accent-focus)]/20 px-3 py-1.5 text-xs font-medium text-[var(--accent-focus)] hover:bg-[var(--accent-focus)]/30 disabled:opacity-50"
                >
                  {pendingAddId === t.id ? "Toevoegen…" : addMissionDate === todayStr ? "Voeg toe aan vandaag" : `Voeg toe (${addMissionDate})`}
                </button>
                {commanderMode && t.description && (
                  <button
                    type="button"
                    onClick={() => setExpandedTemplateId(expandedTemplateId === t.id ? null : t.id)}
                    className="rounded px-2 py-1 text-xs text-[var(--text-muted)] hover:bg-white/10 hover:text-[var(--text-primary)]"
                    aria-expanded={expandedTemplateId === t.id}
                  >
                    {expandedTemplateId === t.id ? "− Uitleg" : "+ Uitleg"}
                  </button>
                )}
              </div>
              {commanderMode && t.description && expandedTemplateId === t.id && (
                <p className="mt-2 border-t border-[var(--card-border)]/50 pt-2 text-xs text-[var(--text-muted)]">
                  {t.description}
                </p>
              )}
            </li>
          ))}
        </ul>
        {filteredTemplates.length === 0 && (
          <p className="mt-2 text-sm text-[var(--text-muted)]">Geen missies gevonden. Pas filters of zoekterm aan.</p>
        )}
        <a href="/tasks" className="mt-3 inline-block text-sm font-medium text-[var(--accent-focus)] hover:underline">
          Naar Missions-pagina →
        </a>
      </section>
    </div>
  );
}
