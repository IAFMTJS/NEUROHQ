"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ProtocolLibraryListRow } from "@/app/actions/protocol-library";
import type { ProtocolProgressState } from "@/app/actions/protocol-progress";
import { commitProtocolWeekToMissions, createProtocolCatchupRound } from "@/app/actions/protocol-missions";
import { setGrowthFocusProtocol, setGrowthFocusAndCommitProtocolWeek } from "@/app/actions/growth-focus";
import type { GrowthFocusState } from "@/app/actions/growth-focus";
import { parseProtocolDefinition, getScaledTask, maxWeekIndex, phaseForWeek, weekForIndex } from "@/lib/growth/protocol-definition";
import { selectProtocolTasksForWeeklyMissions } from "@/lib/growth/protocol-week-mission-tasks";
import type { DifficultyTier } from "@/lib/growth/adaptive-engine";
import { progressKey, resolveFocusProtocol } from "@/lib/growth/resolve-focus-protocol";
import { tierLabelNl } from "@/lib/growth/tier-labels";
import { neuroToast } from "@/lib/ui/neuro-toast";
import { SegmentedBar } from "@/components/visual-lab/VisualLabBars";
import type { StrategyPacingHints } from "@/lib/strategy/strategy-pacing-hints";
import { strategyPaceHintLines } from "@/lib/strategy/format-strategy-pace-hints";

const LOW_PROGRESS_THRESHOLD = 40;
const CATCHUP_OPTIONS = [1, 2, 3] as const;

function weekProgressState(pct: number, totalTasks: number): "No plan" | "Behind" | "Risk" | "On track" {
  if (totalTasks <= 0) return "No plan";
  if (pct < LOW_PROGRESS_THRESHOLD) return "Behind";
  if (pct < 70) return "Risk";
  return "On track";
}

/** Caption under SegmentedBar — mirrors Visual Lab Growth command center copy. */
function protocolWeekSegmentCaption(fills: number[], weekIndex: number, weekPct: number): string {
  const n = fills.length;
  if (n === 0) return "";
  const parts: string[] = [];
  if (weekIndex > 1) {
    const priors = fills.slice(0, weekIndex - 1);
    if (priors.length > 0 && priors.every((f) => f >= 0.995)) {
      parts.push(priors.length === 1 ? "W1 afgerond" : `W1–W${weekIndex - 1} afgerond`);
    } else if (priors.some((f) => f > 0.01)) {
      parts.push(`Tot W${weekIndex - 1}: deels voltooid`);
    }
  }
  parts.push(`W${weekIndex} bezig (${weekPct}%)`);
  if (weekIndex < n) {
    parts.push(n - weekIndex === 1 ? "Laatste week nog open" : `W${weekIndex + 1}–W${n} nog open`);
  }
  return parts.join(" · ");
}

type Props = {
  protocols: ProtocolLibraryListRow[];
  progressMap: Record<string, ProtocolProgressState>;
  engineTier: DifficultyTier | null;
  growthFocus: GrowthFocusState;
  strategyPacingHints: StrategyPacingHints | null;
  /** Huidige kalenderweek (ma–zo), zelfde als Missions-budgetweek. */
  budgetWeekLabel?: string;
  onOpenProtocol: (p: ProtocolLibraryListRow) => void;
};

export function GrowthCommandCenter({
  protocols,
  progressMap,
  engineTier,
  growthFocus,
  strategyPacingHints,
  budgetWeekLabel,
  onOpenProtocol,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [catchupTaskCount, setCatchupTaskCount] = useState<(typeof CATCHUP_OPTIONS)[number]>(2);

  const quarterPacingLines = useMemo(
    () => (strategyPacingHints ? strategyPaceHintLines("learning", strategyPacingHints) : []),
    [strategyPacingHints],
  );

  const active = useMemo(
    () => resolveFocusProtocol(protocols, progressMap, growthFocus),
    [protocols, progressMap, growthFocus],
  );

  const focusSelectValue = useMemo(() => {
    if (!growthFocus.slug) return "";
    const row =
      protocols.find((p) => p.slug === growthFocus.slug && p.locale === growthFocus.locale) ??
      protocols.find((p) => p.slug === growthFocus.slug);
    return row?.id ?? "";
  }, [growthFocus.slug, growthFocus.locale, protocols]);

  if (protocols.length === 0) {
    return (
      <section
        id="growth-command"
        className="relative scroll-mt-28 overflow-hidden rounded-md border border-dashed border-[rgba(var(--mode-rgb),0.32)] bg-gradient-to-br from-[rgba(8,26,42,0.92)] via-[var(--bg-elevated)]/88 to-[rgba(var(--mode-rgb-deep),0.12)] p-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
      >
        <div className="relative z-[1]">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--semantic-accent)]/90">Growth command center</p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Geen protocollen in de bibliotheek — importeer seed (migration 090 + <code className="text-xs">npm run import-protocols</code>).
          </p>
        </div>
      </section>
    );
  }

  const safeActive = active ?? protocols[0]!;
  const prog = progressMap[progressKey(safeActive.slug, safeActive.locale)] ?? null;
  const def = parseProtocolDefinition(safeActive.definition_json);
  const tier = prog?.preferred_tier ?? "medium";
  const weekIndex = prog?.current_week_index ?? 1;
  const completed = new Set(prog?.completed_task_ids ?? []);
  const week = def ? weekForIndex(def, weekIndex) : undefined;
  const missionWeekTasks = week ? selectProtocolTasksForWeeklyMissions(week.tasks) : [];
  const phase = def ? phaseForWeek(def, weekIndex) : undefined;
  const maxW = def ? maxWeekIndex(def) : 1;

  const doneInWeek = missionWeekTasks.filter((t) => completed.has(t.id)).length;
  const totalInWeek = missionWeekTasks.length;
  const weekPct = totalInWeek > 0 ? Math.round((doneInWeek / totalInWeek) * 100) : 0;
  const progressState = weekProgressState(weekPct, totalInWeek);
  const progressStateClass =
    progressState === "On track"
      ? "border-emerald-300/35 bg-emerald-500/12 text-emerald-100"
      : progressState === "Risk"
        ? "border-amber-300/35 bg-amber-500/12 text-amber-100"
        : progressState === "Behind"
          ? "border-rose-300/35 bg-rose-500/12 text-rose-100"
          : "border-white/20 bg-white/10 text-slate-200";
  const isLowProgress = totalInWeek > 0 && weekPct < LOW_PROGRESS_THRESHOLD;

  const previewTasks = missionWeekTasks.slice(0, 3);
  const totalWeekMinutes = missionWeekTasks.reduce((sum, task) => sum + getScaledTask(task, tier).minutes, 0);
  const completedWeekMinutes = missionWeekTasks.reduce(
    (sum, task) => (completed.has(task.id) ? sum + getScaledTask(task, tier).minutes : sum),
    0,
  );
  const remainingWeekMinutes = Math.max(0, totalWeekMinutes - completedWeekMinutes);
  const learningFocusBullets = useMemo(() => {
    if (!week) return [] as string[];
    const bullets: string[] = [];
    if (week.objective?.trim()) bullets.push(week.objective.trim());
    if (week.week_intent?.trim()) bullets.push(week.week_intent.trim());
    for (const task of selectProtocolTasksForWeeklyMissions(week.tasks).slice(0, 3)) {
      bullets.push(task.title.trim());
    }
    return bullets.slice(0, 5);
  }, [week]);

  const { protocolWeekFills, protocolWeekLabels, protocolWeekCaption } = useMemo(() => {
    if (!def || maxW < 1) {
      return { protocolWeekFills: [] as number[], protocolWeekLabels: [] as string[], protocolWeekCaption: "" };
    }
    const doneIds = new Set(prog?.completed_task_ids ?? []);
    const fills: number[] = [];
    const labels: string[] = [];
    for (let wi = 1; wi <= maxW; wi++) {
      labels.push(`W${wi}`);
      const wk = weekForIndex(def, wi);
      if (!wk || wk.tasks.length === 0) {
        fills.push(0);
        continue;
      }
      const planned = selectProtocolTasksForWeeklyMissions(wk.tasks);
      const doneC = planned.filter((t) => doneIds.has(t.id)).length;
      fills.push(planned.length > 0 ? doneC / planned.length : 0);
    }
    return {
      protocolWeekFills: fills,
      protocolWeekLabels: labels,
      protocolWeekCaption: protocolWeekSegmentCaption(fills, weekIndex, weekPct),
    };
  }, [def, maxW, weekIndex, weekPct, prog?.completed_task_ids]);

  const commitWeek = () =>
    startTransition(async () => {
      try {
        const r = await commitProtocolWeekToMissions({
          protocol_slug: safeActive.slug,
          locale: safeActive.locale,
        });
        neuroToast.success(
          (() => {
            const cleared = r.withdrawn > 0 ? `${r.withdrawn} andere protocoltaken uit deze week gehaald. ` : "";
            if (r.created > 0) {
              return `${cleared}${r.created} protocoltaken op Missions, verdeeld over de week${r.skipped ? ` (${r.skipped} stonden er al)` : ""}.`;
            }
            if (r.skipped > 0) {
              return `${cleared}Geen nieuwe taken — ${r.skipped} stonden al in deze week.`;
            }
            return cleared ? `${cleared.trim()}` : "Geen taken om toe te voegen.";
          })(),
        );
        router.refresh();
      } catch (e) {
        neuroToast.error(e instanceof Error ? e.message : "Mislukt.");
      }
    });

  const addCatchupRound = () =>
    startTransition(async () => {
      try {
        const result = await createProtocolCatchupRound({
          protocol_slug: safeActive.slug,
          locale: safeActive.locale,
          max_tasks: catchupTaskCount,
        });
        if (result.created > 0) {
          neuroToast.success(
            `Catch-up ronde ${result.round}: ${result.created}/${catchupTaskCount} extra growth taken toegevoegd${result.skipped ? ` (${result.skipped} overgeslagen)` : ""}.`
          );
        } else {
          neuroToast.info("Geen extra ronde nodig: huidige protocoltaken lijken al afgedekt.");
        }
        router.refresh();
      } catch (error) {
        neuroToast.error(error instanceof Error ? error.message : "Extra ronde toevoegen mislukt.");
      }
    });

  return (
    <section
      id="growth-command"
      className="scroll-mt-28 relative overflow-hidden rounded-md border border-[rgba(var(--mode-rgb),0.2)] bg-gradient-to-br from-[rgba(8,26,42,0.92)] via-[var(--bg-elevated)]/88 to-[rgba(var(--mode-rgb-deep),0.12)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
    >
      {/* Top: Visual Lab–aligned header + title + focus + ring */}
      <div className="relative z-[1] border-b border-[rgba(var(--mode-rgb),0.14)] px-4 py-4 sm:px-5">
        <div className="space-y-3">
          <div className="min-w-0 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--semantic-accent)]/90">
              Growth command center
            </p>
            <h2 className="text-xl font-bold leading-tight tracking-tight text-[var(--text-primary)] [text-shadow:0_0_20px_rgba(var(--mode-rgb),0.2)] sm:text-2xl">
              {safeActive.title}
            </h2>
            <p className="text-xs leading-snug text-[var(--text-muted)]">
              {phase?.title ? (
                <>
                  <span className="font-medium text-[var(--text-secondary)]">{phase.title}</span>
                  <span className="text-[var(--text-muted)]"> · focus-protocol</span>
                </>
              ) : (
                <span>Focus-protocol</span>
              )}
              {growthFocus.slug ? (
                <span className="ml-2 inline-block rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-200/90">
                  Jouw focus
                </span>
              ) : (
                <span className="ml-2 inline-block rounded-full border border-[var(--card-border)] bg-[var(--bg-soft)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
                  Geen focus ingesteld
                </span>
              )}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${progressStateClass}`}>
                {progressState}
              </span>
              {isLowProgress ? (
                <span className="inline-flex rounded-full border border-rose-300/35 bg-rose-500/12 px-2 py-0.5 text-[10px] font-semibold text-rose-100">
                  Onder {LOW_PROGRESS_THRESHOLD}% · recovery aanbevolen
                </span>
              ) : null}
            </div>
            <label className="mt-3 block max-w-md">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Kies traject
              </span>
              <p className="mb-1.5 text-[10px] leading-snug text-[var(--text-muted)]">
                Ander traject kiezen; kalenderweek en Missions syncen automatisch bij Growth of Missions.
              </p>
              <select
                className="w-full rounded-lg border border-[rgba(var(--mode-rgb),0.35)] bg-gradient-to-b from-[rgba(var(--mode-rgb-deep),0.52)] to-[rgba(6,18,30,0.96)] px-3 py-2 text-sm font-medium text-[#e8f6ff] shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_0_16px_rgba(var(--mode-rgb),0.12)] [color-scheme:dark] focus:border-[rgba(var(--mode-rgb),0.55)] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--mode-rgb),0.35)] disabled:opacity-50"
                disabled={pending}
                value={focusSelectValue}
                onChange={(e) => {
                  const id = e.target.value;
                  startTransition(async () => {
                    try {
                      if (!id) {
                        await setGrowthFocusProtocol({ slug: null });
                        neuroToast.success("Focus gewist.");
                      } else {
                        const p = protocols.find((x) => x.id === id);
                        if (!p) return;
                        try {
                          const r = await setGrowthFocusAndCommitProtocolWeek({ slug: p.slug, locale: p.locale });
                          neuroToast.success(
                            (() => {
                              const cleared = r.withdrawn > 0 ? `${r.withdrawn} oude protocoltaken verwijderd. ` : "";
                              if (r.created > 0) {
                                return `${cleared}Focus: ${p.title}. ${r.created} taken verdeeld over deze week.${r.skipped ? ` (${r.skipped} stonden er al)` : ""}`;
                              }
                              if (r.skipped > 0) {
                                return `${cleared}Focus: ${p.title}. Week stond al op je bord (${r.skipped}).`;
                              }
                              return `${cleared}Focus: ${p.title}.`;
                            })(),
                          );
                        } catch (commitErr) {
                          neuroToast.error(
                            commitErr instanceof Error ? commitErr.message : "Protocol naar Missions mislukt.",
                          );
                        }
                      }
                      router.refresh();
                    } catch (err) {
                      neuroToast.error(err instanceof Error ? err.message : "Mislukt.");
                    }
                  });
                }}
              >
                <option value="" className="bg-[#0a1524] text-[#e8f6ff]">
                  — Geen vaste focus —
                </option>
                {protocols.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#0a1524] text-[#e8f6ff]">
                    {p.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      {quarterPacingLines.length > 0 ? (
        <div className="relative z-[1] border-b border-[rgba(var(--mode-rgb),0.1)] bg-[rgba(var(--mode-rgb),0.05)] px-4 py-3 sm:px-5">
          <details>
            <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              Kwartaal · Strategy-doel
            </summary>
            <ul className="mt-2 space-y-1">
              {quarterPacingLines.map((line) => (
                <li key={line} className="text-xs leading-snug text-[var(--text-secondary)]">
                  {line}
                </li>
              ))}
            </ul>
            <Link
              href="/strategy"
              className="mt-2 inline-flex text-[11px] font-medium text-[var(--accent-focus)] underline-offset-2 transition hover:underline"
            >
              Doelen op Strategy →
            </Link>
          </details>
        </div>
      ) : null}

      {/* Middle: week bar + tasks */}
      <div className="relative z-[1] space-y-5 px-4 py-6 sm:px-5">
        {def && week ? (
          <>
            <section className="grid gap-3 lg:grid-cols-2">
              <article className="rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Weekvereisten</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <div>
                    <p className="text-[11px] text-[var(--text-muted)]">Taken</p>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {doneInWeek}/{totalInWeek} gedaan
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[var(--text-muted)]">Minuten</p>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {completedWeekMinutes}/{totalWeekMinutes}
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-[var(--text-secondary)]">Resterend: {Math.max(0, totalInWeek - doneInWeek)} taken · {remainingWeekMinutes} min</p>
              </article>
              <article className="rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Wat je moet leren (deze week)</p>
                {learningFocusBullets.length === 0 ? (
                  <p className="mt-2 text-xs text-[var(--text-secondary)]">Nog geen leerfocus voor deze week ingesteld.</p>
                ) : (
                  <ul className="mt-2 space-y-1.5">
                    {learningFocusBullets.map((line) => (
                      <li key={line} className="text-xs text-[var(--text-secondary)]">
                        - {line}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            </section>

            <details className="rounded-xl border border-white/10 bg-black/20 p-3">
              <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                Geavanceerde protocoldiagnostiek
              </summary>
              <div className="mt-3 space-y-4">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Week-indicator</p>
                    <p className="mt-0.5 text-lg font-semibold tabular-nums text-[var(--text-primary)]">
                      Week {weekIndex} <span className="text-[var(--text-muted)]">/</span> {maxW}
                    </p>
                    {budgetWeekLabel ? (
                      <p className="mt-1 text-[10px] tabular-nums text-[var(--text-muted)]">Kalender · {budgetWeekLabel}</p>
                    ) : null}
                  </div>
                  <p className="text-sm font-semibold tabular-nums text-[var(--accent-focus)] [text-shadow:0_0_12px_rgba(var(--mode-rgb),0.35)]">
                    {weekPct}%
                  </p>
                </div>

                <div>
                  <div className="sr-only" aria-live="polite">
                    Voortgang deze week: {doneInWeek} van {totalInWeek} taken, {weekPct} procent
                  </div>
                  <p className="text-xs leading-snug text-[var(--text-secondary)]">
                    Voortgang deze week: <span className="font-medium text-[var(--text-primary)]">{doneInWeek}</span> van{" "}
                    <span className="font-medium text-[var(--text-primary)]">{totalInWeek}</span> taken,{" "}
                    <span className="tabular-nums">{weekPct}</span>% — hieronder één segment per protocolweek.
                  </p>
                </div>

                {protocolWeekFills.length > 0 ? (
                  <div className="-mx-1 overflow-x-auto pb-1 [scrollbar-width:thin]">
                    <div className="min-w-min px-1">
                      <SegmentedBar
                        label="Protocolweken · voltooid per week"
                        caption={protocolWeekCaption}
                        fills={protocolWeekFills}
                        segmentLabels={protocolWeekLabels}
                        className={maxW > 14 ? "min-w-[min(100%,28rem)]" : undefined}
                      />
                    </div>
                  </div>
                ) : null}

                {week.title ? (
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2">{week.title}</p>
                ) : null}

                {previewTasks.length > 0 ? (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Deze week</p>
                    <ul className="mt-2 space-y-2">
                      {previewTasks.map((task) => {
                        const done = completed.has(task.id);
                        return (
                          <li
                            key={task.id}
                            className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 ${
                              done
                                ? "border-emerald-500/35 bg-emerald-500/[0.07]"
                                : "border-[rgba(var(--mode-rgb),0.12)] bg-[var(--bg-surface)]/35"
                            }`}
                          >
                            <span
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                done ? "bg-emerald-500/25 text-emerald-200" : "bg-[var(--bg-soft)] text-[var(--text-muted)]"
                              }`}
                              aria-hidden
                            >
                              {done ? "✓" : "○"}
                            </span>
                            <span className="min-w-0 text-sm font-medium leading-snug text-[var(--text-primary)]">
                              {task.title}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                    {missionWeekTasks.length > 3 ? (
                      <p className="mt-2 text-[11px] text-[var(--text-muted)]">
                        +{missionWeekTasks.length - 3} extra in het traject
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--text-muted)]">Geen taken voor deze week in het protocol.</p>
                )}
              </div>
            </details>
          </>
        ) : (
          <p className="text-sm text-[var(--text-secondary)]">
            Dit protocol heeft nog geen structured definition — open het traject voor details of werk de seed bij.
          </p>
        )}

        <p className="text-[10px] text-[var(--text-muted)]">
          Tier <span className="font-medium text-[var(--text-secondary)]">{tierLabelNl(tier)}</span>
          {engineTier != null ? (
            <>
              {" "}
              · engine <span className="font-medium text-[var(--text-secondary)]">{tierLabelNl(engineTier)}</span>
            </>
          ) : null}
        </p>
      </div>

      {/* Bottom: primary = Missions; sync runs on /learning load — commitWeek is fallback */}
      <div className="relative z-[1] border-t border-[rgba(var(--mode-rgb),0.12)] bg-black/10 px-4 py-5 sm:px-5">
        {def && week ? (
          <>
            {isLowProgress ? (
              <div className="mb-3 rounded-xl border border-rose-300/35 bg-rose-500/10 p-3">
                <p className="text-xs font-semibold text-rose-100">Lage weekvoortgang gedetecteerd ({weekPct}%).</p>
                <p className="mt-1 text-[11px] text-rose-100/90">
                  Voeg een extra ronde toe om achterstand deze week in te halen.
                </p>
              </div>
            ) : null}
            <Link
              href="/tasks?growth=1"
              className="primary-btn !min-h-[56px] flex w-full items-center justify-center no-underline"
            >
              Naar Missions — deze week
            </Link>
            <p className="mt-2 text-center text-[10px] leading-snug text-[var(--text-muted)]">
              Deze pagina of Missions laden = protocoltaken automatisch verdeeld over je kalenderweek.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
              <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/20 px-2 py-1">
                <span className="pr-1 text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">Ronde</span>
                {CATCHUP_OPTIONS.map((count) => (
                  <button
                    key={count}
                    type="button"
                    disabled={pending}
                    onClick={() => setCatchupTaskCount(count)}
                    className={`rounded-md px-2 py-1 text-[11px] font-semibold transition ${
                      catchupTaskCount === count
                        ? "border border-cyan-300/35 bg-cyan-500/15 text-cyan-100"
                        : "border border-white/10 bg-black/30 text-slate-300 hover:text-white"
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
              <button
                type="button"
                disabled={pending}
                className="text-xs font-medium text-[var(--text-muted)] underline-offset-4 transition hover:text-[var(--accent-focus)] hover:underline disabled:opacity-50"
                onClick={() => onOpenProtocol(safeActive)}
              >
                Open traject
              </button>
              <button
                type="button"
                disabled={pending}
                className="text-xs font-medium text-[var(--text-muted)] underline-offset-4 transition hover:text-[var(--accent-focus)] hover:underline disabled:opacity-50"
                onClick={addCatchupRound}
              >
                {pending ? "Bezig…" : `Voeg ${catchupTaskCount} extra taken toe`}
              </button>
              <button
                type="button"
                disabled={pending}
                className="text-xs font-medium text-[var(--text-muted)] underline-offset-4 transition hover:text-[var(--accent-focus)] hover:underline disabled:opacity-50"
                onClick={commitWeek}
              >
                {pending ? "Bezig…" : "Weektaken opnieuw verdelen"}
              </button>
            </div>
            <p className="mt-3 text-center text-[10px] text-[var(--text-muted)]/80">
              Missions vandaag · <span className="font-mono">growth</span> · <span className="font-mono">protocol</span>
            </p>
          </>
        ) : (
          <div className="space-y-4">
            <button
              type="button"
              disabled={pending}
              className="text-xs font-medium text-[var(--text-muted)] underline-offset-4 transition hover:text-[var(--accent-focus)] hover:underline"
              onClick={() => onOpenProtocol(safeActive)}
            >
              Open traject
            </button>
            <Link
              href="/tasks?growth=1"
              className="ml-6 text-xs font-medium text-[var(--text-muted)] underline-offset-4 transition hover:text-[var(--accent-focus)] hover:underline"
            >
              Naar missions
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
