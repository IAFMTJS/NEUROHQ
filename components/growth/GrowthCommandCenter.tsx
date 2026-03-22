"use client";

import { useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ProtocolLibraryRow } from "@/app/actions/protocol-library";
import type { ProtocolProgressState } from "@/app/actions/protocol-progress";
import { commitProtocolWeekToMissions } from "@/app/actions/protocol-missions";
import { setGrowthFocusProtocol } from "@/app/actions/growth-focus";
import type { GrowthFocusState } from "@/app/actions/growth-focus";
import {
  parseProtocolDefinition,
  maxWeekIndex,
  phaseForWeek,
  weekForIndex,
  getScaledTask,
} from "@/lib/growth/protocol-definition";
import type { DifficultyTier } from "@/lib/growth/adaptive-engine";
import { progressKey, resolveFocusProtocol } from "@/lib/growth/resolve-focus-protocol";
import { tierLabelNl } from "@/lib/growth/tier-labels";

type Props = {
  protocols: ProtocolLibraryRow[];
  progressMap: Record<string, ProtocolProgressState>;
  engineTier: DifficultyTier | null;
  growthFocus: GrowthFocusState;
  onOpenProtocol: (p: ProtocolLibraryRow) => void;
};

export function GrowthCommandCenter({
  protocols,
  progressMap,
  engineTier,
  growthFocus,
  onOpenProtocol,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

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

  return (
    <section
      id="growth-command"
      className="scroll-mt-28 overflow-hidden rounded-2xl border border-[var(--semantic-accent)]/40 bg-gradient-to-br from-[var(--semantic-accent)]/14 via-[var(--bg-elevated)]/70 to-[var(--bg-primary)]/90 shadow-[0_0_56px_rgba(0,212,255,0.12)]"
    >
      <div className="border-b border-[var(--card-border)]/80 bg-[var(--bg-elevated)]/35 px-4 py-3 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--semantic-accent)]">
              Growth command center
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-[var(--text-primary)] sm:text-2xl">
              {safeActive.title}
            </h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              <span className="font-mono text-[10px] uppercase">{safeActive.slug}</span>
              {growthFocus.slug ? (
                <span className="ml-2 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-200/90">
                  Jouw focus
                </span>
              ) : (
                <span className="ml-2 rounded-full bg-[var(--bg-soft)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
                  Suggestie (geen focus ingesteld)
                </span>
              )}
            </p>
          </div>
          <label className="flex min-w-[min(100%,240px)] flex-col gap-1 text-left">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Focus-protocol</span>
            <select
              className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)]"
              disabled={pending}
              value={focusSelectValue}
              onChange={(e) => {
                const id = e.target.value;
                startTransition(async () => {
                  try {
                    if (!id) {
                      await setGrowthFocusProtocol({ slug: null });
                      toast.success("Focus gewist.");
                    } else {
                      const p = protocols.find((x) => x.id === id);
                      if (!p) return;
                      await setGrowthFocusProtocol({ slug: p.slug, locale: p.locale });
                      toast.success("Focus-protocol bijgewerkt.");
                    }
                    router.refresh();
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Mislukt.");
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
      </div>

      <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[1fr_minmax(0,280px)]">
        <div className="space-y-4">
          {def && week && phase && (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--semantic-accent)]">{phase.title}</p>
                  <p className="mt-0.5 text-lg font-semibold text-[var(--text-primary)]">{week.title}</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{week.objective}</p>
                </div>
                <div className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-soft)] px-3 py-2 text-right">
                  <p className="text-[10px] uppercase text-[var(--text-muted)]">Week</p>
                  <p className="text-lg font-bold tabular-nums text-[var(--text-primary)]">
                    {weekIndex} / {maxW}
                  </p>
                </div>
              </div>

              <div>
                <div className="mb-1 flex justify-between text-[11px] text-[var(--text-muted)]">
                  <span>Voortgang deze week (afgevinkt)</span>
                  <span className="tabular-nums">
                    {doneInWeek}/{totalInWeek} · {weekPct}%
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-[var(--bg-soft)]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--semantic-accent)] to-emerald-400/90 transition-[width]"
                    style={{ width: `${weekPct}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-[var(--card-border)] bg-[var(--bg-soft)] px-2.5 py-1 text-[11px] text-[var(--text-secondary)]">
                  Protocol-tier: <strong className="text-[var(--text-primary)]">{tierLabelNl(tier)}</strong>
                </span>
                {engineTier != null && (
                  <span className="rounded-full border border-[var(--card-border)] bg-[var(--bg-soft)] px-2.5 py-1 text-[11px] text-[var(--text-secondary)]">
                    Engine: <strong className="text-[var(--text-primary)]">{tierLabelNl(engineTier)}</strong>
                  </span>
                )}
              </div>
            </>
          )}

          {!def && (
            <p className="text-sm text-[var(--text-secondary)]">
              Dit protocol heeft nog geen structured definition — open het volledige traject voor markdown of werk de seed bij.
            </p>
          )}
        </div>

        <div className="flex flex-col justify-center gap-2 rounded-xl border border-[var(--card-border)]/90 bg-[var(--bg-primary)]/50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">Acties</p>
          <button
            type="button"
            disabled={pending}
            className="rounded-lg bg-[var(--semantic-accent)] px-4 py-2.5 text-sm font-semibold text-black hover:opacity-95 disabled:opacity-50"
            onClick={() => onOpenProtocol(safeActive)}
          >
            Open volledig traject
          </button>
          {def && week && (
            <button
              type="button"
              disabled={pending}
              className="rounded-lg border border-[var(--semantic-accent)]/50 bg-[var(--semantic-accent)]/10 px-4 py-2.5 text-sm font-semibold text-[var(--semantic-accent)] hover:bg-[var(--semantic-accent)]/20 disabled:opacity-50"
              onClick={() =>
                startTransition(async () => {
                  try {
                    const r = await commitProtocolWeekToMissions({
                      protocol_slug: safeActive.slug,
                      locale: safeActive.locale,
                    });
                    toast.success(
                      r.created > 0
                        ? `${r.created} taken op Missions${r.skipped ? ` (${r.skipped} al gepland)` : ""}.`
                        : `Geen nieuwe taken — ${r.skipped} stonden al op vandaag.`,
                    );
                    router.refresh();
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Mislukt.");
                  }
                })
              }
            >
              {pending ? "Bezig…" : "Zet deze week op Missions"}
            </button>
          )}
          <Link
            href="/tasks?growth=1"
            className="inline-flex items-center justify-center rounded-lg border border-[var(--card-border)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:border-[var(--semantic-accent)]/50 hover:text-[var(--semantic-accent)]"
          >
            Naar Missions-bord →
          </Link>
          <p className="text-[10px] leading-relaxed text-[var(--text-muted)]">
            Protocoltaken krijgen tags <span className="font-mono">growth, protocol</span> en een vaste plek op je bord voor vandaag.
          </p>
        </div>
      </div>

      {def && week && week.tasks.length > 0 && (
        <div className="border-t border-[var(--card-border)]/70 px-4 py-3 sm:px-5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">Preview week (ingestelde tier)</p>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {week.tasks.slice(0, 4).map((task) => {
              const scaled = getScaledTask(task, tier);
              const done = completed.has(task.id);
              return (
                <li
                  key={task.id}
                  className={`rounded-lg border px-3 py-2 text-xs ${
                    done ? "border-emerald-500/30 bg-emerald-500/5" : "border-[var(--card-border)] bg-[var(--bg-soft)]/80"
                  }`}
                >
                  <span className="font-semibold text-[var(--text-primary)]">{task.title}</span>
                  <span className="mt-1 block line-clamp-2 text-[var(--text-secondary)]">{scaled.concrete}</span>
                </li>
              );
            })}
          </ul>
          {week.tasks.length > 4 && (
            <p className="mt-2 text-[11px] text-[var(--text-muted)]">+ {week.tasks.length - 4} meer in het volledige traject…</p>
          )}
        </div>
      )}
    </section>
  );
}
