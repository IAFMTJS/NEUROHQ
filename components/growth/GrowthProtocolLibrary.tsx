"use client";

import { useMemo, useState } from "react";
import type { ProtocolLibraryListRow } from "@/app/actions/protocol-library";
import type { ProtocolProgressState } from "@/app/actions/protocol-progress";
import type { GrowthFocusState } from "@/app/actions/growth-focus";
import { parseProtocolDefinition, maxWeekIndex } from "@/lib/growth/protocol-definition";
import { progressKey } from "@/lib/growth/resolve-focus-protocol";

type Props = {
  protocols: ProtocolLibraryListRow[];
  progressMap: Record<string, ProtocolProgressState>;
  growthFocus?: GrowthFocusState;
  /** Shared with Growth command center — one modal for the whole page. */
  viewerProtocol: ProtocolLibraryListRow | null;
  onViewerProtocolChange: (p: ProtocolLibraryListRow | null) => void;
};

type ListFilter = "all" | "with_progress";

function hasMeaningfulProgress(p: ProtocolLibraryListRow, progressMap: Record<string, ProtocolProgressState>) {
  const prog = progressMap[progressKey(p.slug, p.locale)];
  if (!prog) return false;
  return prog.completed_task_ids.length > 0 || prog.current_week_index > 1;
}

export function GrowthProtocolLibrary({
  protocols,
  progressMap,
  growthFocus,
  viewerProtocol: _viewerProtocol,
  onViewerProtocolChange: setOpen,
}: Props) {
  const [query, setQuery] = useState("");
  const [listFilter, setListFilter] = useState<ListFilter>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return protocols.filter((p) => {
      if (listFilter === "with_progress" && !hasMeaningfulProgress(p, progressMap)) return false;
      if (!q) return true;
      const hay = `${p.title} ${p.slug} ${p.summary ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [protocols, query, listFilter, progressMap]);

  const progressCount = useMemo(
    () => protocols.filter((p) => hasMeaningfulProgress(p, progressMap)).length,
    [protocols, progressMap],
  );

  const progressFor = (p: ProtocolLibraryListRow) => progressMap[progressKey(p.slug, p.locale)] ?? null;

  const isFocus = (p: ProtocolLibraryListRow) =>
    growthFocus?.slug != null && growthFocus.slug === p.slug && growthFocus.locale === p.locale;

  return (
    <section
      id="growth-protocols"
      className="scroll-mt-24 rounded-xl border border-[var(--semantic-ring)]/30 bg-gradient-to-b from-[var(--bg-elevated)]/60 to-[var(--bg-primary)]/40 p-0 shadow-[0_0_48px_rgba(var(--mode-rgb),0.06)]"
    >
      <div className="border-b border-[var(--card-border)]/90 px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--semantic-accent)]">Growth-systeem</p>
        <h2 className="mt-1 text-lg font-bold text-[var(--text-primary)]">Protocolbibliotheek</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          <strong className="text-[var(--text-primary)]">PHASES → WEEKS → sessies</strong> met vaste concrete taken en
          difficulty scaling. Voortgang wordt per account opgeslagen.
        </p>
      </div>

      {protocols.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-[var(--text-muted)]">
            Geen protocollen in de bundled presets. Voeg trajecten toe in{" "}
            <code className="text-xs">lib/protocols-seed-full.json</code> (of catalog) en deploy opnieuw.
          </p>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Voortgang per gebruiker blijft in Supabase; inhoud zit in de repo.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3 border-b border-[var(--card-border)]/70 bg-[var(--bg-elevated)]/25 px-4 py-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">Zoeken in protocollen</span>
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" aria-hidden>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.2-5.2M11 18a7 7 0 100-14 7 7 0 000 14z" />
                  </svg>
                </span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Zoek op titel, slug of korte beschrijving…"
                  className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] py-2 pl-9 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--semantic-accent)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--semantic-accent)]/30"
                  autoComplete="off"
                />
              </label>
              <p className="shrink-0 text-[11px] tabular-nums text-[var(--text-muted)]">
                {filtered.length === protocols.length ? (
                  <>{protocols.length} protocollen</>
                ) : (
                  <>
                    {filtered.length} van {protocols.length}
                  </>
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Bibliotheekfilter">
              <button
                type="button"
                role="tab"
                aria-selected={listFilter === "all"}
                onClick={() => setListFilter("all")}
                className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
                  listFilter === "all"
                    ? "border-[var(--semantic-accent)]/60 bg-[var(--semantic-accent)]/15 text-[var(--semantic-accent)]"
                    : "border-[var(--card-border)] text-[var(--text-secondary)] hover:border-[var(--semantic-accent)]/35"
                }`}
              >
                Alle
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={listFilter === "with_progress"}
                onClick={() => setListFilter("with_progress")}
                className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
                  listFilter === "with_progress"
                    ? "border-[var(--semantic-accent)]/60 bg-[var(--semantic-accent)]/15 text-[var(--semantic-accent)]"
                    : "border-[var(--card-border)] text-[var(--text-secondary)] hover:border-[var(--semantic-accent)]/35"
                }`}
              >
                Met voortgang
                {progressCount > 0 ? (
                  <span className="ml-1.5 tabular-nums opacity-80">({progressCount})</span>
                ) : null}
              </button>
            </div>
          </div>

          <div className="max-h-[min(52vh,480px)] overflow-y-auto overscroll-contain [scrollbar-gutter:stable]">
            {filtered.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">
                Geen protocollen die aan deze filter voldoen. Pas zoekterm of filter aan.
              </div>
            ) : (
              <ul className="divide-y divide-[var(--card-border)]/80">
                {filtered.map((p) => {
                  const def = parseProtocolDefinition(p.definition_json);
                  const prog = progressFor(p);
                  const doneCount = prog ? prog.completed_task_ids.length : 0;
                  const meta = def
                    ? `${def.phases.length} fasen · ${def.weeks.length} wkn · w${prog?.current_week_index ?? 1}`
                    : "Markdown";
                  const focus = isFocus(p);

                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => setOpen(p)}
                        className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-[var(--bg-soft)]/90 focus-visible:bg-[var(--bg-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--semantic-accent)]/35"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="truncate text-[15px] font-semibold leading-tight text-[var(--text-primary)]">
                              {p.title}
                            </span>
                            {focus && (
                              <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-200/90">
                                Focus
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                            {p.slug}
                          </p>
                          {p.summary && (
                            <p className="mt-1 line-clamp-2 text-xs text-[var(--text-secondary)]">{p.summary}</p>
                          )}
                          {def?.trajectory_context && (
                            <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-[var(--text-muted)]">
                              {def.trajectory_context}
                            </p>
                          )}
                          {def?.tags && def.tags.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {def.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded border border-[var(--card-border)]/80 px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          <p className="mt-1.5 text-[11px] text-[var(--text-muted)]">
                            {meta}
                            {def ? (
                              <>
                                {" "}
                                · max week {maxWeekIndex(def)} · {doneCount} taken af
                              </>
                            ) : null}
                          </p>
                        </div>
                        <span className="shrink-0 pt-0.5 text-[11px] font-semibold text-[var(--semantic-accent)]">
                          Open →
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  );
}
