"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ProtocolLibraryRow } from "@/app/actions/protocol-library";
import type { ProtocolProgressState } from "@/app/actions/protocol-progress";
import type { GrowthFocusState } from "@/app/actions/growth-focus";
import { setGrowthFocusAndCommitProtocolWeek, setGrowthFocusProtocol } from "@/app/actions/growth-focus";
import { setProtocolCurrentWeek, setProtocolPreferredTier } from "@/app/actions/protocol-progress";
import { parseProtocolDefinition, maxWeekIndex } from "@/lib/growth/protocol-definition";
import { progressKey, resolveFocusProtocol } from "@/lib/growth/resolve-focus-protocol";
import type { DifficultyTier } from "@/lib/growth/adaptive-engine";
import { neuroToast } from "@/lib/ui/neuro-toast";

type TabId = "command" | "setup";

type Props = {
  protocols: ProtocolLibraryRow[];
  progressMap: Record<string, ProtocolProgressState>;
  growthFocus: GrowthFocusState;
};

const tabs: Array<{ id: TabId; label: string }> = [
  { id: "command", label: "Command Card" },
  { id: "setup", label: "Protocol Setup" },
];

export function GrowthProtocolCommandCard({ protocols, progressMap, growthFocus }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<TabId>("command");

  const active = useMemo(() => resolveFocusProtocol(protocols, progressMap, growthFocus), [protocols, progressMap, growthFocus]);
  const initialProtocol = active ?? protocols[0] ?? null;

  const [selectedProtocolId, setSelectedProtocolId] = useState<string>(initialProtocol?.id ?? "");
  const selectedProtocol = useMemo(
    () => protocols.find((p) => p.id === selectedProtocolId) ?? null,
    [protocols, selectedProtocolId],
  );
  const selectedProgress = selectedProtocol ? progressMap[progressKey(selectedProtocol.slug, selectedProtocol.locale)] ?? null : null;
  const selectedDef = selectedProtocol ? parseProtocolDefinition(selectedProtocol.definition_json) : null;
  const maxWeeks = selectedDef ? maxWeekIndex(selectedDef) : 12;

  const [selectedTier, setSelectedTier] = useState<DifficultyTier>(selectedProgress?.preferred_tier ?? "medium");
  const [selectedWeek, setSelectedWeek] = useState<number>(Math.max(1, selectedProgress?.current_week_index ?? 1));
  const [horizonWeeks, setHorizonWeeks] = useState<number>(Math.min(6, maxWeeks));

  const endWeek = Math.min(maxWeeks, selectedWeek + horizonWeeks - 1);

  const saveRules = () => {
    if (!selectedProtocol) {
      neuroToast.warning("Kies eerst een protocol.");
      return;
    }
    startTransition(async () => {
      try {
        await setProtocolPreferredTier({
          protocol_slug: selectedProtocol.slug,
          locale: selectedProtocol.locale,
          tier: selectedTier,
        });
        await setProtocolCurrentWeek({
          protocol_slug: selectedProtocol.slug,
          locale: selectedProtocol.locale,
          week_index: Math.max(1, Math.min(maxWeeks, selectedWeek)),
        });
        await setGrowthFocusProtocol({
          slug: selectedProtocol.slug,
          locale: selectedProtocol.locale,
        });
        neuroToast.success("Protocolregels opgeslagen.");
        router.refresh();
      } catch (error) {
        neuroToast.error(error instanceof Error ? error.message : "Opslaan mislukt.");
      }
    });
  };

  const syncToMissions = () => {
    if (!selectedProtocol) {
      neuroToast.warning("Kies eerst een protocol.");
      return;
    }
    startTransition(async () => {
      try {
        await setProtocolPreferredTier({
          protocol_slug: selectedProtocol.slug,
          locale: selectedProtocol.locale,
          tier: selectedTier,
        });
        await setProtocolCurrentWeek({
          protocol_slug: selectedProtocol.slug,
          locale: selectedProtocol.locale,
          week_index: Math.max(1, Math.min(maxWeeks, selectedWeek)),
        });
        const result = await setGrowthFocusAndCommitProtocolWeek({
          slug: selectedProtocol.slug,
          locale: selectedProtocol.locale,
        });
        neuroToast.success(
          result.created > 0
            ? `Focus gezet + ${result.created} taken naar Missions${result.skipped ? ` (${result.skipped} al aanwezig)` : ""}.`
            : "Focus gezet, geen nieuwe taken toegevoegd.",
        );
        router.refresh();
      } catch (error) {
        neuroToast.error(error instanceof Error ? error.message : "Sync mislukt.");
      }
    });
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-slate-300">Growth Command</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Protocol command card</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const selected = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  selected
                    ? "border-cyan-300/50 bg-cyan-500/18 text-cyan-100"
                    : "border-white/15 bg-black/20 text-slate-300 hover:border-white/25 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "command" ? (
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <article className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <p className="text-[11px] text-slate-300">Actief protocol</p>
            <p className="mt-1 text-sm font-semibold text-white">{selectedProtocol?.title ?? "Geen protocol gekozen"}</p>
          </article>
          <article className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <p className="text-[11px] text-slate-300">Zwaarte</p>
            <p className="mt-1 text-sm font-semibold text-white">{selectedTier}</p>
          </article>
          <article className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <p className="text-[11px] text-slate-300">Planningperiode</p>
            <p className="mt-1 text-sm font-semibold text-white">
              Week {selectedWeek} t/m {endWeek}
            </p>
          </article>
          <div className="md:col-span-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={saveRules}
              className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/15 disabled:opacity-50"
            >
              {pending ? "Bezig..." : "Regels opslaan"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={syncToMissions}
              className="rounded-lg border border-cyan-300/35 bg-cyan-500/15 px-3 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-500/22 disabled:opacity-50"
            >
              {pending ? "Sync..." : "Focus + sync naar Missions"}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="block rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <span className="text-[11px] text-slate-300">Te leren protocol</span>
            <select
              value={selectedProtocolId}
              onChange={(event) => {
                const nextId = event.target.value;
                setSelectedProtocolId(nextId);
                const next = protocols.find((p) => p.id === nextId) ?? null;
                const nextProg = next ? progressMap[progressKey(next.slug, next.locale)] ?? null : null;
                const nextDef = next ? parseProtocolDefinition(next.definition_json) : null;
                const nextMax = nextDef ? maxWeekIndex(nextDef) : 12;
                setSelectedTier(nextProg?.preferred_tier ?? "medium");
                setSelectedWeek(Math.max(1, nextProg?.current_week_index ?? 1));
                setHorizonWeeks((prev) => Math.max(1, Math.min(prev, nextMax)));
              }}
              className="mt-2 w-full rounded-lg border border-white/15 bg-[rgba(5,14,24,0.9)] px-3 py-2 text-sm text-white [color-scheme:dark] focus:border-cyan-300/45 focus:outline-none"
            >
              {protocols.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </label>

          <label className="block rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <span className="text-[11px] text-slate-300">Hoe zwaar</span>
            <select
              value={selectedTier}
              onChange={(event) => setSelectedTier(event.target.value as DifficultyTier)}
              className="mt-2 w-full rounded-lg border border-white/15 bg-[rgba(5,14,24,0.9)] px-3 py-2 text-sm text-white [color-scheme:dark] focus:border-cyan-300/45 focus:outline-none"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </label>

          <label className="block rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <span className="text-[11px] text-slate-300">Startweek</span>
            <select
              value={String(selectedWeek)}
              onChange={(event) => setSelectedWeek(Math.max(1, Math.min(maxWeeks, Number(event.target.value))))}
              className="mt-2 w-full rounded-lg border border-white/15 bg-[rgba(5,14,24,0.9)] px-3 py-2 text-sm text-white [color-scheme:dark] focus:border-cyan-300/45 focus:outline-none"
            >
              {Array.from({ length: maxWeeks }, (_, i) => i + 1).map((week) => (
                <option key={week} value={week}>
                  Week {week}
                </option>
              ))}
            </select>
          </label>

          <label className="block rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <span className="text-[11px] text-slate-300">Periode (weken)</span>
            <select
              value={String(horizonWeeks)}
              onChange={(event) => setHorizonWeeks(Math.max(1, Math.min(maxWeeks, Number(event.target.value))))}
              className="mt-2 w-full rounded-lg border border-white/15 bg-[rgba(5,14,24,0.9)] px-3 py-2 text-sm text-white [color-scheme:dark] focus:border-cyan-300/45 focus:outline-none"
            >
              {[2, 4, 6, 8, 10, 12].filter((w) => w <= maxWeeks).map((week) => (
                <option key={week} value={week}>
                  {week} weken
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-slate-400">
              Doelvenster: week {selectedWeek} t/m {endWeek} (max {maxWeeks})
            </p>
          </label>
        </div>
      )}
    </section>
  );
}
