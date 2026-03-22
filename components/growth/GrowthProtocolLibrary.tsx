"use client";

import type { ProtocolLibraryRow } from "@/app/actions/protocol-library";
import type { ProtocolProgressState } from "@/app/actions/protocol-progress";
import { parseProtocolDefinition, maxWeekIndex } from "@/lib/growth/protocol-definition";
import { progressKey } from "@/lib/growth/resolve-focus-protocol";

type Props = {
  protocols: ProtocolLibraryRow[];
  progressMap: Record<string, ProtocolProgressState>;
  /** Shared with Growth command center — one modal for the whole page. */
  viewerProtocol: ProtocolLibraryRow | null;
  onViewerProtocolChange: (p: ProtocolLibraryRow | null) => void;
};

export function GrowthProtocolLibrary({
  protocols,
  progressMap,
  viewerProtocol: open,
  onViewerProtocolChange: setOpen,
}: Props) {
  const progressFor = (p: ProtocolLibraryRow) => progressMap[progressKey(p.slug, p.locale)] ?? null;

  return (
    <section
      id="growth-protocols"
      className="scroll-mt-24 rounded-xl border border-[var(--semantic-ring)]/30 bg-gradient-to-b from-[var(--bg-elevated)]/60 to-[var(--bg-primary)]/40 p-0 shadow-[0_0_48px_rgba(0,212,255,0.06)]"
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
            Geen rijen in <code className="text-xs">protocol_library</code>. Importeer de seed (migration 090 +{" "}
            <code className="text-xs">npm run import-protocols</code>).
          </p>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Bestand: <code className="text-xs">lib/protocols-seed-full.json</code>
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 p-4 sm:grid-cols-2">
          {protocols.map((p) => {
            const def = parseProtocolDefinition(p.definition_json);
            const prog = progressFor(p);
            const doneCount = prog ? prog.completed_task_ids.length : 0;
            const meta = def
              ? `${def.phases.length} fasen · ${def.weeks.length} weken · week ${prog?.current_week_index ?? 1}`
              : "Alleen markdown (geen structured definition)";

            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setOpen(p)}
                  className="flex w-full flex-col rounded-xl border border-[var(--card-border)] bg-[var(--bg-soft)] p-4 text-left shadow-sm transition hover:border-[var(--semantic-accent)]/45 hover:shadow-[0_0_20px_rgba(0,212,255,0.12)]"
                >
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">{p.slug}</span>
                  <span className="mt-1 text-base font-semibold text-[var(--text-primary)]">{p.title}</span>
                  {p.summary && <span className="mt-2 line-clamp-2 text-xs text-[var(--text-secondary)]">{p.summary}</span>}
                  <span className="mt-2 text-[11px] text-[var(--text-muted)]">{meta}</span>
                  {def && (
                    <span className="mt-1 text-[10px] text-[var(--text-muted)]">
                      Max week #{maxWeekIndex(def)} · {doneCount} taken ooit afgevinkt
                    </span>
                  )}
                  <span className="mt-3 text-[11px] font-semibold text-[var(--semantic-accent)]">
                    Open traject (tiers + weken) →
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
