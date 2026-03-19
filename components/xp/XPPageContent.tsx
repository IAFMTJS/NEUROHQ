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
    task_complete: "Missies afronden",
    brain_status: "Brain status",
    learning_session: "Learning (sessies)",
    weekly_learning_target: "Weekdoel learning",
    streak_day: "Streak-bonus",
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
  const [xpView, setXpView] = useState<"command" | "analytics" | "library">("command");
  const [commanderMode, setCommanderMode] = useState(true);
  const [chartDays, setChartDays] = useState<7 | 14>(14);
  const [pendingAddId, setPendingAddId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [domainFilter, setDomainFilter] = useState<string>("");
  const [xpLevelFilter, setXpLevelFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [showAllSources, setShowAllSources] = useState(false);
  const [missionFiltersOpen, setMissionFiltersOpen] = useState(false);
  const [projectionOpen, setProjectionOpen] = useState(false);
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

  const recommendedTemplates = useMemo(() => filteredTemplates.slice(0, 3), [filteredTemplates]);

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
  const selectedTotal = chartDataFiltered.reduce((sum, item) => sum + item.value, 0);
  const selectedAvg = chartDataFiltered.length ? Math.round(selectedTotal / chartDataFiltered.length) : 0;
  const bestPoint = chartDataFiltered.length
    ? chartDataFiltered.reduce((best, item) => (item.value > best.value ? item : best), chartDataFiltered[0])
    : null;
  const lowPoint = chartDataFiltered.length
    ? chartDataFiltered.reduce((lowest, item) => (item.value < lowest.value ? item : lowest), chartDataFiltered[0])
    : null;
  const selectedVsPrevious = xpPrevious7 > 0 ? Math.round(((xpLast7 - xpPrevious7) / xpPrevious7) * 100) : null;
  const sourceItems = showAllSources ? xpBySource : xpBySource.slice(0, 3);
  const focusPriority = addBlockedToday
    ? "Rond eerst 1 open missie af — alleen voltooien geeft XP."
    : activeMissionCountToday >= maxSlotsToday
      ? "Voltooi of verplaats 1 missie — pas daarna komt er weer XP binnen via nieuwe taken."
      : recommendedTemplates[0]
        ? `Start met: ${recommendedTemplates[0].title}${recommendedTemplates[0].baseXP != null ? ` (+${recommendedTemplates[0].baseXP} XP bij voltooien)` : ""}`
        : "Voeg 1 haalbare missie toe en rond die af voor basis-XP + streak.";

  const nextXpHint =
    recommendedTemplates[1]?.baseXP != null
      ? `Pak daarna een tweede missie: tot +${recommendedTemplates[1].baseXP} XP (${recommendedTemplates[1].title}).`
      : "Stapel 1 extra voltooide missie om je week-totaal omhoog te duwen.";
  const laterXpHint =
    recommendedTemplates[2]?.baseXP != null
      ? `Reserveer hoog-XP werk: ${recommendedTemplates[2].title} (+${recommendedTemplates[2].baseXP} XP).`
      : "Plan morgen 1 missie met hogere base-XP — voltooien op Missions levert het meeste.";

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-[var(--accent-focus)]/30 bg-gradient-to-br from-[var(--dc-bg-elevated)] via-[var(--bg-surface)] to-[var(--bg-primary)] p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[var(--accent-focus)]/15 blur-3xl" />
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-focus)]">XP NEXUS</p>
                <h2 className="mt-1 text-2xl font-semibold text-[var(--text-primary)] sm:text-3xl">Level {identity.level} · {identity.rank}</h2>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[var(--card-border)] bg-[var(--bg-primary)]/70 px-3 py-2 text-xs text-[var(--text-primary)]">
                <span className={!commanderMode ? "font-semibold" : "text-[var(--text-muted)]"}>Basic</span>
                <input
                  type="checkbox"
                  checked={commanderMode}
                  onChange={(e) => setCommanderMode(e.target.checked)}
                  className="rounded border-[var(--card-border)]"
                  aria-label="Commander mode aan/uit"
                />
                <span className={commanderMode ? "font-semibold text-[var(--accent-focus)]" : "text-[var(--text-muted)]"}>Commander</span>
              </label>
            </div>
            <p className="max-w-2xl text-sm text-[var(--text-secondary)]">
              XP krijg je door <strong className="text-[var(--text-primary)]">missies af te ronden</strong>, streaks vast te houden en learning & brain-status actief te houden. Toevoegen alleen telt niet — voltooien wel.
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-[var(--accent-focus)]/35 bg-[var(--bg-primary)]/55 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Total XP</p>
                <p className="text-xl font-bold text-[var(--text-primary)]">{identity.total_xp}</p>
              </div>
              <div className="rounded-xl border border-[var(--accent-focus)]/35 bg-[var(--bg-primary)]/55 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Velocity</p>
                <p className="text-xl font-bold text-[var(--text-primary)]">{velocity} <span className="text-xs font-medium text-[var(--text-muted)]">XP/d</span></p>
              </div>
              <div className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-primary)]/35 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Streak</p>
                <p className="text-xl font-bold text-[var(--text-primary)]">{identity.streak.current}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--bg-primary)]/45 p-4">
            <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Level Progress</p>
            <div className="mt-3 flex items-center gap-4">
              <div
                className="grid h-24 w-24 place-items-center rounded-full border-4 border-[var(--accent-focus)]/35 text-center"
                style={{ background: `conic-gradient(var(--accent-focus) ${Math.min(100, progress * 100)}%, rgba(255,255,255,0.08) 0)` }}
              >
                <div className="grid h-[76px] w-[76px] place-items-center rounded-full bg-[var(--bg-primary)] text-sm font-semibold text-[var(--text-primary)]">
                  {Math.round(progress * 100)}%
                </div>
              </div>
              <div className="text-sm text-[var(--text-secondary)]">
                <p>
                  <span className="font-semibold text-[var(--text-primary)]">{range.current}</span> / {range.needed} XP in deze level-balk
                </p>
                <p>Volgende niveau: level {identity.level + 1}</p>
                <p className="mt-2 text-base font-semibold text-[var(--accent-focus)]">
                  Nog <span className="text-[var(--text-primary)]">{identity.xp_to_next_level}</span> XP tot level {identity.level + 1}
                </p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">Unlock daarna: {identity.next_unlock.rank} (L{identity.next_unlock.level})</p>
              </div>
            </div>
            <div className="mt-3 rounded-lg border border-[var(--accent-focus)]/30 bg-[var(--accent-focus)]/10 px-2.5 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--accent-focus)]">Meeste XP nu</p>
              <p className="mt-1 text-xs text-[var(--text-primary)]">{focusPriority}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--bg-primary)]/35 p-2">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setXpView("command")} className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${xpView === "command" ? "bg-[var(--accent-focus)]/20 text-[var(--accent-focus)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}>XP verdienen</button>
          <button type="button" onClick={() => setXpView("analytics")} className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${xpView === "analytics" ? "bg-[var(--accent-focus)]/20 text-[var(--accent-focus)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}>Verdiende XP</button>
          <button type="button" onClick={() => setXpView("library")} className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${xpView === "library" ? "bg-[var(--accent-focus)]/20 text-[var(--accent-focus)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}>Missie-XP lijst</button>
        </div>
      </section>

      {xpView === "command" && (
        <section className="grid gap-4 lg:grid-cols-3">
          <div className={`${cardClass} lg:col-span-2 space-y-4`}>
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Maximaal XP vandaag</h3>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Rangschik op wat je wél afrondt; onafgemaakte taken geven 0 XP.</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <div className="rounded-xl border border-[var(--card-border)] bg-white/5 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Stap 1 — Nu</p>
                  <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">{focusPriority}</p>
                </div>
                <div className="rounded-xl border border-[var(--card-border)] bg-white/5 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Stap 2 — Daarna</p>
                  <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">{nextXpHint}</p>
                </div>
                <div className="rounded-xl border border-[var(--card-border)] bg-white/5 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Stap 3 — Straks</p>
                  <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">{laterXpHint}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-[var(--card-border)] bg-white/5 p-3">
              <p className="text-xs font-semibold text-[var(--text-primary)]">XP-checklist</p>
              <ul className="mt-2 space-y-1.5 text-xs text-[var(--text-secondary)]">
                <li>• <strong className="text-[var(--text-primary)]">Missies</strong>: voltooi op Missions — dat is je grootste bron.</li>
                <li>• <strong className="text-[var(--text-primary)]">Streak</strong>: minstens 1 voltooide missie per dag voor bonus-ritme.</li>
                <li>• <strong className="text-[var(--text-primary)]">Learning</strong>: sessies en weekdoelen geven extra XP.</li>
                <li>• <strong className="text-[var(--text-primary)]">Brain status</strong>: log energie/focus voor brain-XP.</li>
              </ul>
              <div className="mt-3 flex flex-wrap gap-2">
                <a href="/tasks" className="rounded-lg bg-[var(--accent-focus)]/20 px-3 py-2 text-xs font-semibold text-[var(--accent-focus)] hover:bg-[var(--accent-focus)]/30">Naar Missions (XP vrijspelen)</a>
                <a href="/learning" className="rounded-lg border border-[var(--card-border)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-white/10">Learning → XP</a>
                <button type="button" onClick={() => setXpView("library")} className="rounded-lg border border-[var(--card-border)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-white/10">Missies met base-XP</button>
              </div>
            </div>
          </div>
          <div className={cardClass}>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Loopt XP binnen?</h3>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Laatste 7 dagen vs. daarvoor + ruimte voor nieuwe missies.</p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                <span className="text-[var(--text-secondary)]">Slots vandaag</span>
                <span className="font-semibold text-[var(--text-primary)]">{activeMissionCountToday} / {maxSlotsToday}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                <span className="text-[var(--text-secondary)]">Verdiend (7d)</span>
                <span className="font-semibold text-[var(--accent-focus)]">+{xpLast7} XP</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                <span className="text-[var(--text-secondary)]">Eerder blok (7d)</span>
                <span className="font-semibold text-[var(--text-primary)]">+{xpPrevious7} XP</span>
              </div>
            </div>
            {xpBySource.length > 0 && (
              <div className="mt-3 border-t border-[var(--card-border)]/60 pt-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Waar kwam XP vandaan (7d)</p>
                <ul className="mt-2 space-y-1.5">
                  {xpBySource.slice(0, 3).map((item) => (
                    <li key={item.source_type} className="flex items-center justify-between text-xs">
                      <span className="text-[var(--text-secondary)]">{sourceLabel(item.source_type)}</span>
                      <span className="font-medium text-[var(--accent-focus)]">+{item.total} XP</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {xpView === "analytics" && (
        <>
          <section className="grid gap-4 lg:grid-cols-5">
            <div className={`${cardClass} lg:col-span-3`} aria-label="XP trend">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Verdiende XP per dag</h3>
                <p className="text-xs text-[var(--text-muted)]">Alleen wat je echt binnenhaalde telt.</p>
                <div className="flex rounded-lg border border-[var(--card-border)] p-0.5">
                  <button type="button" onClick={() => setChartDays(7)} className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${chartDays === 7 ? "bg-[var(--accent-focus)]/20 text-[var(--accent-focus)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}>7d</button>
                  <button type="button" onClick={() => setChartDays(14)} className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${chartDays === 14 ? "bg-[var(--accent-focus)]/20 text-[var(--accent-focus)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}>14d</button>
                </div>
              </div>
              {chartDataFiltered.length > 0 ? (
                <HQChart data={chartDataFiltered} title="" variant="area" dataKey="value" secondaryKey="streakOverlay" />
              ) : (
                <div className="rounded-xl border border-dashed border-[var(--card-border)] bg-[var(--bg-surface)]/40 px-4 py-8 text-center">
                  <p className="text-sm text-[var(--text-muted)]">Nog geen XP-data in deze periode.</p>
                </div>
              )}
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded-lg bg-white/5 px-2.5 py-2"><p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Gemiddelde</p><p className="text-sm font-semibold text-[var(--text-primary)]">{selectedAvg} XP</p></div>
                <div className="rounded-lg bg-white/5 px-2.5 py-2"><p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Beste dag</p><p className="truncate text-sm font-semibold text-[var(--text-primary)]">{bestPoint ? `${bestPoint.name} (${bestPoint.value})` : "—"}</p></div>
                <div className="rounded-lg bg-white/5 px-2.5 py-2"><p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Laagste dag</p><p className="truncate text-sm font-semibold text-[var(--text-primary)]">{lowPoint ? `${lowPoint.name} (${lowPoint.value})` : "—"}</p></div>
                <div className="rounded-lg bg-white/5 px-2.5 py-2"><p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Week-op-week</p><p className="text-sm font-semibold text-[var(--text-primary)]">{selectedVsPrevious == null ? "—" : `${selectedVsPrevious > 0 ? "+" : ""}${selectedVsPrevious}%`}</p></div>
              </div>
            </div>
            <div className={`${cardClass} lg:col-span-2`}><WeeklyHeatmap days={heatmapDays} /></div>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <XPForecastWidget forecasts={forecast} currentLevel={identity.level} />
            {commanderMode && ins && (
              <div className={cardClass}>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Insights Snapshot</h3>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-lg bg-white/5 px-3 py-2"><p className="text-[10px] uppercase text-[var(--text-muted)]">Momentum</p><p className="font-semibold text-[var(--text-primary)]">{Math.round(ins.momentum.score)} · {ins.momentum.band}</p></div>
                  <div className="rounded-lg bg-white/5 px-3 py-2"><p className="text-[10px] uppercase text-[var(--text-muted)]">Streak Risk</p><p className="font-semibold text-[var(--text-primary)]">{ins.streakRisk.level}</p></div>
                  <div className="rounded-lg bg-white/5 px-3 py-2"><p className="text-[10px] uppercase text-[var(--text-muted)]">Completion 7d</p><p className="font-semibold text-[var(--text-primary)]">{ins.completionRateLast7 != null ? `${Math.round(ins.completionRateLast7 * 100)}%` : "—"}</p></div>
                  <div className="rounded-lg bg-white/5 px-3 py-2"><p className="text-[10px] uppercase text-[var(--text-muted)]">Beste Dag</p><p className="font-semibold text-[var(--text-primary)]">{bestDayName ?? "—"}</p></div>
                </div>
                <button type="button" onClick={() => setProjectionOpen((v) => !v)} className="mt-3 text-xs font-medium text-[var(--accent-focus)] hover:underline">{projectionOpen ? "Verberg scenario's" : "Toon level-scenario's"}</button>
                {projectionOpen && <p className="mt-1 text-xs text-[var(--text-muted)]">Huidig: {ins.levelProjectionDays ?? "—"}d · +10 XP/d: {ins.levelProjectionDays != null ? Math.max(1, ins.levelProjectionDays - 2) : "—"}d · -10 XP/d: {ins.levelProjectionDays != null ? ins.levelProjectionDays + 2 : "—"}d</p>}
              </div>
            )}
          </section>
        </>
      )}

      {xpView !== "analytics" && (
        <section className={cardClass} aria-label="XP missies browser">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Missies met XP-potentieel</h3>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Toevoegreegels: base-XP staat per template. <strong className="text-[var(--text-primary)]">XP krijg je na voltooien</strong> op Missions — niet bij aanmaken.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-[var(--text-muted)]">Datum</label>
              <input type="date" value={addMissionDate} onChange={(e) => setAddMissionDate(e.target.value || todayStr)} className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1.5 text-sm text-[var(--text-primary)]" aria-label="Datum voor toe te voegen missie" />
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <input type="search" placeholder="Zoek missie..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)]" aria-label="Zoek missies" />
            <button type="button" onClick={() => setMissionFiltersOpen((v) => !v)} className="text-xs font-medium text-[var(--accent-focus)] hover:underline">{missionFiltersOpen || commanderMode ? "Verberg filters" : "Toon filters"}</button>
            {(missionFiltersOpen || commanderMode) && (
              <div className="grid gap-2 md:grid-cols-2">
                <select value={domainFilter} onChange={(e) => setDomainFilter(e.target.value)} className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)]" aria-label="Filter domein">
                  <option value="">Alle domeinen</option><option value="discipline">Discipline</option><option value="health">Health</option><option value="learning">Learning</option><option value="business">Business</option>
                </select>
                <select value={xpLevelFilter} onChange={(e) => setXpLevelFilter(e.target.value)} className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)]" aria-label="Filter XP-niveau">
                  <option value="">Alle XP-niveaus</option><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option>
                </select>
              </div>
            )}
          </div>
          {recommendedTemplates.length > 0 && (
            <div className="mt-3 rounded-xl border border-[var(--accent-focus)]/30 bg-[var(--accent-focus)]/5 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--accent-focus)]">Snelste XP-kans (top 3)</p>
              <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">Tik om toe te voegen → rond af voor de punten.</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {recommendedTemplates.map((t) => (
                  <button key={`rec-${t.id}`} type="button" onClick={() => addMission(t)} disabled={isPending && pendingAddId === t.id} className="rounded-full border border-[var(--accent-focus)]/30 px-3 py-1 text-xs text-[var(--text-primary)] hover:bg-[var(--accent-focus)]/15 disabled:opacity-50">{pendingAddId === t.id ? "..." : t.title}</button>
                ))}
              </div>
            </div>
          )}
          <div className="mt-3 rounded-xl border border-[var(--card-border)] bg-[var(--bg-primary)]/30">
            <button type="button" onClick={() => setCatalogOpen((v) => !v)} className="flex w-full items-center justify-between px-3 py-2 text-left" aria-expanded={catalogOpen}>
              <span className="text-sm font-medium text-[var(--text-primary)]">Alle XP-templates ({filteredTemplates.length})</span>
              <span className="text-xs text-[var(--accent-focus)]">{catalogOpen ? "Inklappen" : "Uitklappen"} {catalogOpen ? "▲" : "▼"}</span>
            </button>
            {catalogOpen && (
              <ul className="grid gap-1 border-t border-[var(--card-border)]/70 p-2">
                {filteredTemplates.map((t) => (
                  <li key={t.id} className="rounded-lg border border-[var(--card-border)]/70 bg-[var(--bg-primary)]/35 px-2.5 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-[var(--text-primary)]">{t.title}</p>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[11px]">
                          <span className="rounded bg-[var(--accent-focus)]/15 px-1 py-0.5 text-[var(--accent-focus)]">{t.domain}</span>
                          <span className="text-[var(--text-muted)]">{t.baseXP ?? "—"} XP</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => addMission(t)} disabled={isPending && pendingAddId === t.id} className="rounded-md bg-[var(--accent-focus)]/20 px-2 py-1 text-[11px] font-medium text-[var(--accent-focus)] hover:bg-[var(--accent-focus)]/30 disabled:opacity-50">{pendingAddId === t.id ? "..." : "Add"}</button>
                        {t.description && <button type="button" onClick={() => setExpandedTemplateId(expandedTemplateId === t.id ? null : t.id)} className="rounded-md px-1.5 py-1 text-[11px] text-[var(--text-muted)] hover:bg-white/10 hover:text-[var(--text-primary)]" aria-expanded={expandedTemplateId === t.id}>{expandedTemplateId === t.id ? "−" : "+"}</button>}
                      </div>
                    </div>
                    {t.description && expandedTemplateId === t.id && <p className="mt-1 border-t border-[var(--card-border)]/50 pt-1.5 text-[11px] text-[var(--text-muted)]">{t.description}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {filteredTemplates.length === 0 && <p className="mt-3 text-sm text-[var(--text-muted)]">Geen missies gevonden. Pas je filters aan.</p>}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-[var(--text-muted)]">{showFitnessDecayMirror ? "Fitness-commitment zakt; plan bewust een health missie om momentum te beschermen." : "Tip: combineer korte en langere missies voor stabiele velocity."}</p>
            <a href="/tasks" className="text-sm font-medium text-[var(--accent-focus)] hover:underline">Volledige Missions-pagina →</a>
          </div>
        </section>
      )}
    </div>
  );
}
