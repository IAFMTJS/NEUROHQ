"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ProtocolLibraryRow } from "@/app/actions/protocol-library";
import type { ProtocolProgressState } from "@/app/actions/protocol-progress";
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
} from "@/lib/growth/protocol-definition";
import type { DifficultyTier } from "@/lib/growth/adaptive-engine";

type Props = {
  protocol: ProtocolLibraryRow;
  progress: ProtocolProgressState | null;
  onClose: () => void;
};

const TIERS: DifficultyTier[] = ["easy", "medium", "hard"];

function tierLabel(t: DifficultyTier): string {
  if (t === "easy") return "Light";
  if (t === "hard") return "Heavy";
  return "Standard";
}

export function GrowthProtocolViewerModal({ protocol, progress, onClose }: Props) {
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

        {def && (
          <div className="mb-4 flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-muted)]">
            <span className="rounded-full bg-[var(--bg-soft)] px-2 py-0.5">
              {def.phases.length} fasen · {def.weeks.length} weken in bibliotheek
            </span>
            <span className="rounded-full bg-[var(--bg-soft)] px-2 py-0.5">
              Horizon ca. {def.estimated_weeks_min}–{def.estimated_weeks_max} wkn
            </span>
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
                {tierLabel(t)}
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
                        <p className="text-sm font-semibold text-[var(--text-primary)]">{task.title}</p>
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">{scaled.concrete}</p>
                        <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                          ~{scaled.minutes} min · tier <strong>{tierLabel(tier)}</strong>
                        </p>
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
