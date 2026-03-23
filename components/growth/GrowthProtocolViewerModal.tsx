"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ProtocolLibraryRow } from "@/app/actions/protocol-library";
import type { ProtocolProgressState } from "@/app/actions/protocol-progress";
import { commitProtocolWeekToMissions } from "@/app/actions/protocol-missions";
import { setGrowthFocusProtocol } from "@/app/actions/growth-focus";
import {
  setProtocolPreferredTier,
  setProtocolCurrentWeek,
  toggleProtocolTaskCompleted,
} from "@/app/actions/protocol-progress";
import { Modal } from "@/components/Modal";
import { renderMarkdownLite } from "@/lib/growth/render-markdown-lite";
import {
  parseProtocolDefinition,
  maxWeekIndex,
  phaseForWeek,
  getScaledTask,
  weekForIndex,
  dayOfWeekLabelNl,
  sortedDayOverview,
} from "@/lib/growth/protocol-definition";
import type { DifficultyTier } from "@/lib/growth/adaptive-engine";
import { tierLabelNl } from "@/lib/growth/tier-labels";
import { neuroToast } from "@/lib/ui/neuro-toast";

type Props = {
  protocol: ProtocolLibraryRow;
  progress: ProtocolProgressState | null;
  /** Adaptive engine tier (brain) — toon hint als protocol-tier afwijkt. */
  engineTier?: DifficultyTier | null;
  onClose: () => void;
};

const TIERS: DifficultyTier[] = ["easy", "medium", "hard"];

export function GrowthProtocolViewerModal({ protocol, progress, engineTier, onClose }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const def = parseProtocolDefinition(protocol.definition_json);
  const tier = progress?.preferred_tier ?? "medium";
  const weekIndex = progress?.current_week_index ?? 1;
  const completed = new Set(progress?.completed_task_ids ?? []);

  const week = def ? weekForIndex(def, weekIndex) : undefined;
  const phase = def ? phaseForWeek(def, weekIndex) : undefined;
  const maxW = def ? maxWeekIndex(def) : 1;

  function refresh() {
    router.refresh();
  }

  return (
    <Modal
      open
      title={protocol.title}
      subtitle={def?.goal_one_liner}
      onClose={onClose}
      size="lg"
      noPadding
    >
      <div className="max-h-[min(78dvh,720px)] overflow-y-auto px-4 py-4">
        {protocol.summary && <p className="mb-3 text-sm text-[var(--text-secondary)]">{protocol.summary}</p>}

        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending}
            className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/20 disabled:opacity-50"
            onClick={() =>
              startTransition(async () => {
                try {
                  await setGrowthFocusProtocol({ slug: protocol.slug, locale: protocol.locale });
                  neuroToast.success("Dit protocol is nu je focus op Growth.");
                  refresh();
                } catch (e) {
                  neuroToast.error(e instanceof Error ? e.message : "Mislukt.");
                }
              })
            }
          >
            {pending ? "Bezig…" : "Markeer als mijn focus"}
          </button>
        </div>

        {def && (
          <div className="mb-4 flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-muted)]">
            <span className="rounded-full bg-[var(--bg-soft)] px-2 py-0.5">
              {def.phases.length} fasen · {def.weeks.length} weken in bibliotheek
            </span>
            <span className="rounded-full bg-[var(--bg-soft)] px-2 py-0.5">
              Horizon ca. {def.estimated_weeks_min}–{def.estimated_weeks_max} wkn
            </span>
            {def.tags && def.tags.length > 0 && (
              <span className="rounded-full border border-[var(--card-border)] px-2 py-0.5">
                {def.tags.join(" · ")}
              </span>
            )}
          </div>
        )}

        {def && (def.trajectory_context || (def.prerequisites && def.prerequisites.length) || (def.outcomes && def.outcomes.length)) && (
          <div className="mb-4 space-y-3 rounded-xl border border-[var(--semantic-accent)]/25 bg-[var(--semantic-accent)]/5 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--semantic-accent)]">Traject</p>
            {def.trajectory_context && (
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{def.trajectory_context}</p>
            )}
            {def.prerequisites && def.prerequisites.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Voorwaarden</p>
                <ul className="mt-1 list-inside list-disc text-sm text-[var(--text-secondary)]">
                  {def.prerequisites.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            )}
            {def.outcomes && def.outcomes.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Wat je wél kan verwachten</p>
                <ul className="mt-1 list-inside list-disc text-sm text-[var(--text-secondary)]">
                  {def.outcomes.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {def?.execution_framework && (
          <div className="mb-4 rounded-xl border border-[var(--card-border)] bg-[var(--bg-soft)]/45 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--semantic-accent)]">
              Execution framework
            </p>
            <div className="mt-2 grid gap-2 md:grid-cols-3">
              <div className="rounded-lg border border-[var(--card-border)]/70 bg-[var(--bg-primary)]/40 p-2">
                <p className="text-[10px] uppercase text-[var(--text-muted)]">Micro</p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">{def.execution_framework.micro}</p>
              </div>
              <div className="rounded-lg border border-[var(--card-border)]/70 bg-[var(--bg-primary)]/40 p-2">
                <p className="text-[10px] uppercase text-[var(--text-muted)]">Meso</p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">{def.execution_framework.meso}</p>
              </div>
              <div className="rounded-lg border border-[var(--card-border)]/70 bg-[var(--bg-primary)]/40 p-2">
                <p className="text-[10px] uppercase text-[var(--text-muted)]">Macro</p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">{def.execution_framework.macro}</p>
              </div>
            </div>
            {def.quality_gates && def.quality_gates.length > 0 && (
              <ul className="mt-3 space-y-1 text-xs text-[var(--text-secondary)]">
                {def.quality_gates.map((gate) => (
                  <li key={gate} className="flex gap-2">
                    <span className="text-[var(--semantic-accent)]">•</span>
                    <span>{gate}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {engineTier != null && engineTier !== tier && (
          <div className="mb-3 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
            Engine adviseert <strong>{tierLabelNl(engineTier)}</strong>, protocol staat op <strong>{tierLabelNl(tier)}</strong>.
            Pas tier hierboven aan voor één lijn met je brain load.
          </div>
        )}

        <div className="mb-4 rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)]/50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">Moeilijkheid (week lock)</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {TIERS.map((t) => (
              <button
                key={t}
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await setProtocolPreferredTier({ protocol_slug: protocol.slug, locale: protocol.locale, tier: t });
                    refresh();
                  })
                }
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                  tier === t
                    ? "border-[var(--semantic-accent)] bg-[var(--semantic-accent)]/20 text-[var(--semantic-accent)]"
                    : "border-[var(--card-border)] text-[var(--text-muted)] hover:border-[var(--semantic-accent)]/40"
                }`}
              >
                {tierLabelNl(t)}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-[var(--text-muted)]">
            Taken tonen concrete volumes per tier (zoals in Language Acquisition voorbeeld).
          </p>
        </div>

        {def && week && (
          <>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--semantic-accent)]">
                  {phase?.title ?? "Fase"}
                </p>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{week.title}</p>
                <p className="text-xs text-[var(--text-secondary)]">{week.objective}</p>
                {week.week_intent && (
                  <p className="mt-2 rounded-lg border border-[var(--card-border)]/80 bg-[var(--bg-primary)]/40 px-2.5 py-2 text-xs leading-relaxed text-[var(--text-primary)]">
                    <span className="font-semibold text-[var(--semantic-accent)]">Intentie: </span>
                    {week.week_intent}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={pending || weekIndex <= 1}
                  className="rounded-lg border border-[var(--card-border)] px-2 py-1 text-xs disabled:opacity-40"
                  onClick={() =>
                    startTransition(async () => {
                      await setProtocolCurrentWeek({
                        protocol_slug: protocol.slug,
                        locale: protocol.locale,
                        week_index: weekIndex - 1,
                      });
                      refresh();
                    })
                  }
                >
                  ← Week
                </button>
                <span className="tabular-nums text-xs text-[var(--text-muted)]">
                  {weekIndex} / {maxW}
                </span>
                <button
                  type="button"
                  disabled={pending || weekIndex >= maxW}
                  className="rounded-lg border border-[var(--card-border)] px-2 py-1 text-xs disabled:opacity-40"
                  onClick={() =>
                    startTransition(async () => {
                      await setProtocolCurrentWeek({
                        protocol_slug: protocol.slug,
                        locale: protocol.locale,
                        week_index: weekIndex + 1,
                      });
                      refresh();
                    })
                  }
                >
                  Week →
                </button>
              </div>
            </div>

            {week.execution_flow && (
              <div className="mb-3 rounded-lg border border-[var(--card-border)]/70 bg-[var(--bg-soft)]/55 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--semantic-accent)]">
                  Week execution flow
                </p>
                <div className="mt-2 grid gap-2 md:grid-cols-3">
                  <div className="rounded-md border border-[var(--card-border)]/60 bg-[var(--bg-primary)]/35 p-2">
                    <p className="text-[10px] uppercase text-[var(--text-muted)]">Micro</p>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">{week.execution_flow.micro}</p>
                  </div>
                  <div className="rounded-md border border-[var(--card-border)]/60 bg-[var(--bg-primary)]/35 p-2">
                    <p className="text-[10px] uppercase text-[var(--text-muted)]">Meso</p>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">{week.execution_flow.meso}</p>
                  </div>
                  <div className="rounded-md border border-[var(--card-border)]/60 bg-[var(--bg-primary)]/35 p-2">
                    <p className="text-[10px] uppercase text-[var(--text-muted)]">Macro</p>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">{week.execution_flow.macro}</p>
                  </div>
                </div>
              </div>
            )}

            {week.coach_notes && (
              <div className="mb-3 rounded-lg border border-[var(--card-border)]/60 bg-[var(--bg-primary)]/35 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">Begeleiding</p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">{week.coach_notes}</p>
              </div>
            )}

            {sortedDayOverview(week).length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">Suggestie per dag</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {sortedDayOverview(week).map((d) => (
                    <div
                      key={d.day_of_week}
                      className="rounded-lg border border-[var(--card-border)]/70 bg-[var(--bg-soft)]/60 px-2.5 py-2 text-xs"
                    >
                      <p className="font-semibold text-[var(--semantic-accent)]">{dayOfWeekLabelNl(d.day_of_week)}</p>
                      <p className="mt-0.5 text-[var(--text-secondary)]">{d.focus_line}</p>
                      {d.task_ids && d.task_ids.length > 0 && (
                        <p className="mt-1 font-mono text-[10px] text-[var(--text-muted)]">
                          → {d.task_ids.join(", ")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {week.weekly_checklist && week.weekly_checklist.length > 0 && (
              <div className="mb-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-200/80">Week-check</p>
                <ul className="mt-2 space-y-1 text-xs text-[var(--text-secondary)]">
                  {week.weekly_checklist.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="text-emerald-400/90">□</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {week.weekly_reflection_block && week.weekly_reflection_block.length > 0 && (
              <div className="mb-3 rounded-lg border border-cyan-500/25 bg-cyan-500/6 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-cyan-200/85">
                  Week reflection block
                </p>
                <ul className="mt-2 space-y-1 text-xs text-[var(--text-secondary)]">
                  {week.weekly_reflection_block.map((line) => (
                    <li key={line} className="flex gap-2">
                      <span className="text-cyan-300/80">→</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <ul className="space-y-3">
              {week.tasks.map((task) => {
                const scaled = getScaledTask(task, tier);
                const done = completed.has(task.id);
                return (
                  <li
                    key={task.id}
                    className={`rounded-xl border p-3 ${
                      done ? "border-emerald-500/35 bg-emerald-500/10" : "border-[var(--card-border)] bg-[var(--bg-soft)]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-[var(--card-border)]"
                        checked={done}
                        disabled={pending}
                        onChange={() =>
                          startTransition(async () => {
                            await toggleProtocolTaskCompleted({
                              protocol_slug: protocol.slug,
                              locale: protocol.locale,
                              task_id: task.id,
                            });
                            refresh();
                          })
                        }
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-[var(--text-primary)]">{task.title}</p>
                          {task.frequency_note && (
                            <span className="rounded-full bg-[var(--bg-primary)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
                              {task.frequency_note}
                            </span>
                          )}
                          {task.preferred_days && task.preferred_days.length > 0 && (
                            <span className="flex flex-wrap gap-1">
                              {task.preferred_days.map((d) => (
                                <span
                                  key={d}
                                  className="rounded border border-[var(--card-border)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)]"
                                >
                                  {dayOfWeekLabelNl(d)}
                                </span>
                              ))}
                            </span>
                          )}
                        </div>
                        {task.why_it_matters && (
                          <p className="mt-1 text-[11px] italic text-[var(--text-muted)]">{task.why_it_matters}</p>
                        )}
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">{scaled.concrete}</p>
                        <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                          ~{scaled.minutes} min · tier <strong>{tierLabelNl(tier)}</strong>
                        </p>
                        {task.checklist && task.checklist.length > 0 && (
                          <ul className="mt-2 space-y-0.5 border-t border-[var(--card-border)]/50 pt-2 text-[11px] text-[var(--text-secondary)]">
                            {task.checklist.map((c) => (
                              <li key={c} className="flex gap-2">
                                <span className="text-[var(--text-muted)]">•</span>
                                {c}
                              </li>
                            ))}
                          </ul>
                        )}
                        {task.micro_actions && task.micro_actions.length > 0 && (
                          <div className="mt-2 rounded-md border border-[var(--card-border)]/60 bg-[var(--bg-primary)]/40 px-2 py-1.5">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                              Micro acties
                            </p>
                            <ul className="mt-1 space-y-0.5 text-[11px] text-[var(--text-secondary)]">
                              {task.micro_actions.map((step) => (
                                <li key={step} className="flex gap-2">
                                  <span className="text-[var(--semantic-accent)]">•</span>
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {task.execution_steps && task.execution_steps.length > 0 && (
                          <div className="mt-2 rounded-md border border-[var(--card-border)]/60 bg-[var(--bg-primary)]/35 px-2 py-1.5">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                              Uitvoerstappen
                            </p>
                            <ol className="mt-1 list-inside list-decimal space-y-0.5 text-[11px] text-[var(--text-secondary)]">
                              {task.execution_steps.map((step) => (
                                <li key={step}>{step}</li>
                              ))}
                            </ol>
                          </div>
                        )}
                        {(task.meso_outcome || task.macro_link) && (
                          <div className="mt-2 grid gap-1 rounded-md border border-[var(--card-border)]/60 bg-[var(--bg-primary)]/35 px-2 py-1.5 text-[11px] text-[var(--text-secondary)]">
                            {task.meso_outcome && (
                              <p>
                                <span className="font-semibold text-[var(--text-muted)]">Meso: </span>
                                {task.meso_outcome}
                              </p>
                            )}
                            {task.macro_link && (
                              <p>
                                <span className="font-semibold text-[var(--text-muted)]">Macro: </span>
                                {task.macro_link}
                              </p>
                            )}
                          </div>
                        )}
                        {task.reflection_prompt && (
                          <p className="mt-2 rounded-md bg-[var(--bg-primary)]/50 px-2 py-1.5 text-[11px] text-[var(--text-secondary)]">
                            <span className="font-semibold text-[var(--semantic-accent)]">Reflectie: </span>
                            {task.reflection_prompt}
                          </p>
                        )}
                        {task.reflection_block?.prompt && (
                          <div className="mt-2 rounded-md border border-cyan-500/25 bg-cyan-500/8 px-2 py-1.5 text-[11px] text-[var(--text-secondary)]">
                            <p>
                              <span className="font-semibold text-cyan-200/90">Reflectieblok: </span>
                              {task.reflection_block.prompt}
                            </p>
                            {task.reflection_block.capture_hint && (
                              <p className="mt-1 text-[var(--text-muted)]">
                                <span className="font-semibold">Capture: </span>
                                {task.reflection_block.capture_hint}
                              </p>
                            )}
                            {task.reflection_block.success_signal && (
                              <p className="mt-1 text-emerald-200/85">
                                <span className="font-semibold">Succes-signaal: </span>
                                {task.reflection_block.success_signal}
                              </p>
                            )}
                          </div>
                        )}
                        {task.resources && task.resources.length > 0 && (
                          <ul className="mt-2 text-[11px] text-[var(--text-muted)]">
                            {task.resources.map((r) => (
                              <li key={r.label}>
                                {r.url ? (
                                  <a
                                    href={r.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[var(--semantic-accent)] underline-offset-2 hover:underline"
                                  >
                                    {r.label}
                                  </a>
                                ) : (
                                  <span>{r.label}</span>
                                )}
                                {r.note ? ` — ${r.note}` : ""}
                              </li>
                            ))}
                          </ul>
                        )}
                        {task.success_criteria && (
                          <p className="mt-1 text-[11px] text-amber-200/90">Succes: {task.success_criteria}</p>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            {weekIndex >= maxW && def.estimated_weeks_max > def.weeks.length && (
              <p className="mt-3 text-xs text-[var(--text-muted)]">
                Laatste week in deze seed — herhaal patroon of breid content uit in de bibliotheek (zie docs).
              </p>
            )}

            <div className="mt-4 border-t border-[var(--card-border)] pt-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Koppeling Missions
              </p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Zet deze week als concrete taken op je bord (vandaag). Al bestaande dezelfde protocol-stap wordt overgeslagen.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={pending}
                  className="rounded-lg bg-[var(--semantic-accent)] px-4 py-2 text-sm font-semibold text-black hover:opacity-95 disabled:opacity-50"
                  onClick={() =>
                    startTransition(async () => {
                      try {
                        const r = await commitProtocolWeekToMissions({
                          protocol_slug: protocol.slug,
                          locale: protocol.locale,
                        });
                        neuroToast.success(
                          r.created > 0
                            ? `${r.created} taken op Missions${r.skipped ? ` (${r.skipped} al gepland)` : ""}.`
                            : `Geen nieuwe taken — ${r.skipped} stonden al op vandaag.`,
                        );
                        refresh();
                      } catch (e) {
                        neuroToast.error(e instanceof Error ? e.message : "Mislukt.");
                      }
                    })
                  }
                >
                  {pending ? "Bezig…" : "Zet deze week op Missions"}
                </button>
                <button
                  type="button"
                  disabled={pending}
                  className="rounded-lg border border-[var(--card-border)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:border-[var(--semantic-accent)]/50"
                  onClick={() => {
                    onClose();
                    router.push("/tasks");
                  }}
                >
                  Naar Missions →
                </button>
              </div>
            </div>
          </>
        )}

        {!def && (
          <article className="space-y-1 rounded-lg border border-[var(--card-border)]/60 bg-[var(--bg-primary)]/50 p-4">
            {renderMarkdownLite(protocol.body_md || "")}
          </article>
        )}

        {def && protocol.body_md && (
          <details className="mt-4 rounded-lg border border-[var(--card-border)]/60 bg-[var(--bg-primary)]/30 p-3">
            <summary className="cursor-pointer text-xs font-semibold text-[var(--text-muted)]">Toelichting (markdown)</summary>
            <article className="mt-2 space-y-1">{renderMarkdownLite(protocol.body_md)}</article>
          </details>
        )}
      </div>
    </Modal>
  );
}
