"use client";

import { useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ProtocolLibraryRow } from "@/app/actions/protocol-library";
import type { ProtocolProgressState } from "@/app/actions/protocol-progress";
import { commitProtocolWeekToMissions } from "@/app/actions/protocol-missions";
import { setGrowthFocusProtocol } from "@/app/actions/growth-focus";
import type { GrowthFocusState } from "@/app/actions/growth-focus";
import { parseProtocolDefinition, maxWeekIndex, phaseForWeek, weekForIndex } from "@/lib/growth/protocol-definition";
import type { DifficultyTier } from "@/lib/growth/adaptive-engine";
import { progressKey, resolveFocusProtocol } from "@/lib/growth/resolve-focus-protocol";
import { tierLabelNl } from "@/lib/growth/tier-labels";
import { neuroToast } from "@/lib/ui/neuro-toast";
import { EnergyRing, type EnergyRingMode } from "@/components/hud-test/EnergyRing";
import type { StrategyPacingHints } from "@/lib/strategy/strategy-pacing-hints";
import { strategyPaceHintLines } from "@/lib/strategy/format-strategy-pace-hints";

const RING_SIZE = 152;

function weekProgressRingMode(pct: number, totalTasks: number): EnergyRingMode {
  if (totalTasks === 0) return "default";
  if (pct >= 100) return "green-peak";
  if (pct >= 70) return "green";
  if (pct >= 40) return "alert";
  return "high-alert";
}

type Props = {
  protocols: ProtocolLibraryRow[];
  progressMap: Record<string, ProtocolProgressState>;
  engineTier: DifficultyTier | null;
  growthFocus: GrowthFocusState;
  strategyPacingHints: StrategyPacingHints | null;
  onOpenProtocol: (p: ProtocolLibraryRow) => void;
};

export function GrowthCommandCenter({
  protocols,
  progressMap,
  engineTier,
  growthFocus,
  strategyPacingHints,
  onOpenProtocol,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

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
        className="scroll-mt-28 rounded-2xl border border-dashed border-[var(--semantic-ring)]/40 bg-[var(--bg-elevated)]/30 p-6 text-center"
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--semantic-accent)]">Growth command center</p>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Geen protocollen in de bibliotheek — importeer seed (migration 090 + <code className="text-xs">npm run import-protocols</code>).
        </p>
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
  const phase = def ? phaseForWeek(def, weekIndex) : undefined;
  const maxW = def ? maxWeekIndex(def) : 1;

  const doneInWeek = week ? week.tasks.filter((t) => completed.has(t.id)).length : 0;
  const totalInWeek = week?.tasks.length ?? 0;
  const weekPct = totalInWeek > 0 ? Math.round((doneInWeek / totalInWeek) * 100) : 0;
  const ringMode = weekProgressRingMode(weekPct, totalInWeek);

  const previewTasks = week?.tasks.slice(0, 3) ?? [];

  const commitWeek = () =>
    startTransition(async () => {
      try {
        const r = await commitProtocolWeekToMissions({
          protocol_slug: safeActive.slug,
          locale: safeActive.locale,
        });
        neuroToast.success(
          r.created > 0
            ? `${r.created} taken op Missions${r.skipped ? ` (${r.skipped} al gepland)` : ""}.`
            : `Geen nieuwe taken — ${r.skipped} stonden al op vandaag.`,
        );
        router.refresh();
      } catch (e) {
        neuroToast.error(e instanceof Error ? e.message : "Mislukt.");
      }
    });

  return (
    <section
      id="growth-command"
      className="scroll-mt-28 overflow-hidden rounded-2xl border border-[rgba(var(--mode-rgb),0.22)] bg-gradient-to-br from-[rgba(var(--mode-rgb-deep),0.38)] via-[rgba(var(--mode-rgb),0.12)] to-[var(--bg-primary)]/95 shadow-[0_0_0_1px_rgba(var(--mode-rgb),0.08),0_0_40px_rgba(var(--mode-rgb),0.1),0_24px_56px_rgba(0,0,0,0.45)] backdrop-blur-md"
    >
      {/* Top: title + focus subtitle + medium ring */}
      <div className="border-b border-[rgba(var(--mode-rgb),0.14)] px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1 space-y-2">
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
            <label className="mt-3 block max-w-md">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Kies traject
              </span>
              <select
                className="w-full rounded-lg border border-[rgba(var(--mode-rgb),0.2)] bg-[var(--bg-primary)]/80 px-3 py-2 text-sm text-[var(--text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
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
                        await setGrowthFocusProtocol({ slug: p.slug, locale: p.locale });
                        neuroToast.success("Focus-protocol bijgewerkt.");
                      }
                      router.refresh();
                    } catch (err) {
                      neuroToast.error(err instanceof Error ? err.message : "Mislukt.");
                    }
                  });
                }}
              >
                <option value="">— Geen vaste focus —</option>
                {protocols.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex shrink-0 justify-center lg:justify-end lg:pt-1">
            <div
              className="relative"
              role="img"
              aria-label={`Weekvoortgang ${weekPct} procent, week ${weekIndex} van ${maxW}`}
            >
              <div
                className="absolute left-1/2 top-1/2 h-[115%] w-[115%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(var(--mode-rgb),0.2)_0%,transparent_65%)] blur-md"
                aria-hidden
              />
              <div className="relative drop-shadow-[0_16px_40px_rgba(0,0,0,0.5)]" aria-hidden>
                <EnergyRing
                  size={RING_SIZE}
                  progress={weekPct}
                  label="Week"
                  value={`${weekIndex}/${maxW}`}
                  mode={ringMode}
                  softGlow
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {quarterPacingLines.length > 0 ? (
        <div className="border-b border-[rgba(var(--mode-rgb),0.1)] bg-[rgba(var(--mode-rgb),0.05)] px-5 py-3 sm:px-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            Kwartaal · Strategy-doel
          </p>
          <ul className="mt-1.5 space-y-1">
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
        </div>
      ) : null}

      {/* Middle: week bar + tasks */}
      <div className="space-y-5 px-5 py-6 sm:px-6">
        {def && week ? (
          <>
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Week-indicator</p>
                <p className="mt-0.5 text-lg font-semibold tabular-nums text-[var(--text-primary)]">
                  Week {weekIndex} <span className="text-[var(--text-muted)]">/</span> {maxW}
                </p>
              </div>
              <p className="text-sm font-semibold tabular-nums text-[var(--accent-focus)] [text-shadow:0_0_12px_rgba(var(--mode-rgb),0.35)]">
                {weekPct}%
              </p>
            </div>

            <div>
              <div className="sr-only" aria-live="polite">
                Voortgang deze week: {doneInWeek} van {totalInWeek} taken, {weekPct} procent
              </div>
              <div className="h-3.5 w-full overflow-hidden rounded-full bg-black/25 ring-1 ring-[rgba(var(--mode-rgb),0.18)]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[rgb(var(--mode-rgb-deep))] via-[rgb(var(--mode-rgb))] to-[rgb(var(--mode-rgb-deep))] shadow-[0_0_16px_rgba(var(--mode-rgb),0.55),0_0_28px_rgba(var(--mode-rgb),0.2)] transition-[width] duration-500 ease-out"
                  style={{ width: `${weekPct}%` }}
                />
              </div>
            </div>

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
                {week.tasks.length > 3 ? (
                  <p className="mt-2 text-[11px] text-[var(--text-muted)]">+{week.tasks.length - 3} extra in het traject</p>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">Geen taken voor deze week in het protocol.</p>
            )}
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

      {/* Bottom: one primary + two quiet secondaries */}
      <div className="border-t border-[rgba(var(--mode-rgb),0.12)] bg-black/10 px-5 py-5 sm:px-6">
        {def && week ? (
          <>
            <button
              type="button"
              disabled={pending}
              className="primary-btn !min-h-[56px] w-full disabled:pointer-events-none disabled:opacity-45"
              onClick={commitWeek}
            >
              {pending ? "Bezig…" : "START WEEK"}
            </button>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
              <button
                type="button"
                disabled={pending}
                className="text-xs font-medium text-[var(--text-muted)] underline-offset-4 transition hover:text-[var(--accent-focus)] hover:underline disabled:opacity-50"
                onClick={() => onOpenProtocol(safeActive)}
              >
                Open traject
              </button>
              <Link
                href="/tasks?growth=1"
                className="text-xs font-medium text-[var(--text-muted)] underline-offset-4 transition hover:text-[var(--accent-focus)] hover:underline"
              >
                Naar missions
              </Link>
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
