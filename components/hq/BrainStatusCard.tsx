"use client";

import { useState, memo, useEffect, useMemo, type CSSProperties } from "react";
import type { BrainMode } from "@/lib/brain-mode";
import { maxAllowedIntensityForTier } from "@/lib/brain-mode";
import { getPendingDailyState } from "@/lib/client-pending-writes";
import { useHQStore } from "@/lib/hq-store";
import { BrainStatusModal } from "./BrainStatusModal";
import { useDCICGameState } from "@/lib/dcic/game-state-client";
import { EnergyRing } from "@/components/hud-test/EnergyRing";
import { brainCirclePcts, brainStatusRingModeFromPct, hasCommittedBrainCheckIn } from "@/lib/dashboard-utils";
import type { MoodLabel } from "@/lib/mood-intervention-config";
import { MOOD_LABEL_META } from "@/lib/mood-intervention-config";
import { MoodManualPanel } from "@/components/mood/MoodManualPanel";

type Props = {
  date: string;
  initial: {
    energy: number | null;
    focus: number | null;
    sensory_load: number | null;
    sleep_hours: number | null;
    social_load: number | null;
    physical_health?: number | null;
    mental_battery: number | null;
    is_rest_day?: boolean | null;
  };
  yesterday?: {
    energy: number | null;
    focus: number | null;
    sensory_load: number | null;
    sleep_hours: number | null;
    social_load: number | null;
    physical_health?: number | null;
    mental_battery?: number | null;
  };
  brainMode?: BrainMode;
  suggestedTaskCount?: number;
  /** Dag-mood (los van energie/focus sliders). */
  moodLabel?: MoodLabel | null;
};

export const BrainStatusCard = memo(function BrainStatusCard({
  date,
  initial,
  yesterday,
  brainMode,
  suggestedTaskCount,
  moodLabel: moodLabelProp,
}: Props) {
  const { gameState } = useDCICGameState();
  const dcicMode = gameState?.mode?.current ?? "focus";
  const dcicModeVars = useMemo<CSSProperties>(() => {
    if (dcicMode === "war") {
      return { "--mode-rgb": "220, 38, 38", "--mode-rgb-deep": "127, 29, 29" } as CSSProperties;
    }
    if (dcicMode === "recovery") {
      return { "--mode-rgb": "34, 197, 94", "--mode-rgb-deep": "22, 101, 52" } as CSSProperties;
    }
    return { "--mode-rgb": "0, 212, 255", "--mode-rgb-deep": "0, 136, 255" } as CSSProperties;
  }, [dcicMode]);
  const [modalOpen, setModalOpen] = useState(false);
  const [moodOpen, setMoodOpen] = useState(false);
  const [moodLabel, setMoodLabel] = useState<MoodLabel | null>(moodLabelProp ?? null);
  const [currentInitial, setCurrentInitial] = useState(initial);
  const todayDailyState = useHQStore((s) => s.todayDailyState);

  // Keep modal seed in sync with freshest available state for this date.
  useEffect(() => {
    // Priority: pending localStorage (instant save) → Zustand → server props.
    // Never prefer stale `initial` while pending/store already have a check-in — that used to
    // wipe optimistic updates whenever `todayDailyState` changed but RSC props had not refreshed yet.
    const pending = getPendingDailyState(date);
    if (pending && hasCommittedBrainCheckIn(pending)) {
      setCurrentInitial({
        energy: pending.energy,
        focus: pending.focus,
        sensory_load: pending.sensory_load,
        sleep_hours: pending.sleep_hours,
        social_load: pending.social_load,
        physical_health: pending.physical_health,
        mental_battery: pending.mental_battery,
      });
      return;
    }

    if (todayDailyState) {
      const state = todayDailyState as {
        energy?: number | null;
        focus?: number | null;
        sensory_load?: number | null;
        sleep_hours?: number | null;
        social_load?: number | null;
        physical_health?: number | null;
        mental_battery?: number | null;
      } | null;
      if (state && hasCommittedBrainCheckIn(state)) {
        setCurrentInitial({
          energy: state.energy ?? initial.energy,
          focus: state.focus ?? initial.focus,
          sensory_load: state.sensory_load ?? initial.sensory_load,
          sleep_hours: state.sleep_hours ?? initial.sleep_hours,
          social_load: state.social_load ?? initial.social_load,
          physical_health: state.physical_health ?? initial.physical_health,
          mental_battery: state.mental_battery ?? initial.mental_battery,
        });
        return;
      }
    }

    setCurrentInitial(initial);
  }, [
    date,
    initial.energy,
    initial.focus,
    initial.sensory_load,
    initial.sleep_hours,
    initial.social_load,
    initial.physical_health,
    initial.mental_battery,
    todayDailyState,
  ]);

  useEffect(() => {
    setMoodLabel(moodLabelProp ?? null);
  }, [moodLabelProp]);

  useEffect(() => {
    const openMood = () => setMoodOpen(true);
    window.addEventListener("neurohq-open-mood-manual", openMood as EventListener);
    return () => window.removeEventListener("neurohq-open-mood-manual", openMood as EventListener);
  }, []);

  useEffect(() => {
    const openIfHash = () => {
      if (typeof window !== "undefined" && window.location.hash === "#brain-status-modal") {
        setModalOpen(true);
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    };
    const openFromDashboard = () => {
      setModalOpen(true);
    };
    openIfHash();
    window.addEventListener("hashchange", openIfHash);
    window.addEventListener("neurohq-open-brain-status", openFromDashboard as EventListener);
    return () => {
      window.removeEventListener("hashchange", openIfHash);
      window.removeEventListener("neurohq-open-brain-status", openFromDashboard as EventListener);
    };
  }, []);

  const { energyPct, focusPct, loadPct } = brainCirclePcts(currentInitial);

  let xpEnergyLabel: string | null = null;
  if (hasCommittedBrainCheckIn(currentInitial) && energyPct > 75) {
    xpEnergyLabel = "XP‑bonus: +10–15% bij high‑energy dag.";
  } else if (hasCommittedBrainCheckIn(currentInitial) && energyPct < 30) {
    xpEnergyLabel = "XP‑penalty: −25% bij very low‑energy (niet slim, maar toegestaan).";
  }

  return (
    <>
      <section
        id="brain-status-modal"
        className="card page glass-card-3d border-[rgba(var(--mode-rgb),0.35)] shadow-[0_0_24px_rgba(var(--mode-rgb),0.12)]"
        style={dcicModeVars}
        aria-label="Brain Status"
        data-tutorial="brain-status-card"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="m-0">Brain Status</h3>
          {moodLabel && MOOD_LABEL_META[moodLabel] ? (
            <span
              className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/35 bg-violet-950/40 px-2.5 py-1 text-[11px] font-semibold text-violet-100/95"
              data-mood-theme="violet"
            >
              <span aria-hidden>{MOOD_LABEL_META[moodLabel].emoji}</span>
              {MOOD_LABEL_META[moodLabel].label}
            </span>
          ) : (
            <span className="text-[11px] font-medium text-[var(--text-muted)]">Mood: nog niet gezet</span>
          )}
        </div>
        <div className="progress" style={{ marginTop: "12px" }}>
          <div
            className="progress-fill"
            style={{ width: `${focusPct}%` }}
            role="progressbar"
            aria-valuenow={focusPct}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        {brainMode ? (
          <>
            <p className="text-soft" style={{ marginTop: "8px" }}>
              Mode: <strong>{brainMode.mode}</strong> · Focus slots: <strong>{brainMode.maxSlots}</strong> · Capacity tier:{" "}
              <strong>{brainMode.tier}</strong> · Risk: <strong>{brainMode.risk}</strong>
            </p>
            <p className="text-soft">
              Max intensiteit vandaag:{" "}
              <strong>
                {(() => {
                  const maxIntensity = maxAllowedIntensityForTier(brainMode.tier);
                  if (maxIntensity === "heavy") return "Heavy per slot";
                  if (maxIntensity === "medium") return "Medium per slot";
                  return "Light per slot";
                })()}
              </strong>
              {" · "}
              Stretch / exposure:{" "}
              <strong>
                {brainMode.maxStretchIntensity === "heavy"
                  ? "voluit"
                  : brainMode.maxStretchIntensity === "medium"
                    ? "gekaderd"
                    : "natuurlijk"}
              </strong>
              {brainMode.growthSlotMultiplier > 1 ? (
                <>
                  {" "}
                  · Growth-slots: <strong>×{brainMode.growthSlotMultiplier}</strong>
                </>
              ) : null}
            </p>
            {xpEnergyLabel && (
              <p className="text-soft">
                {xpEnergyLabel}
              </p>
            )}
            {brainMode.suggestRecovery && (
              <p className="text-soft text-amber-400">
                Hoge druk: overweeg recovery-missie of rust.
              </p>
            )}
            {typeof suggestedTaskCount === "number" && (
              <p className="text-soft">
                Vandaag richt de engine zich op ongeveer <strong>{suggestedTaskCount}</strong> missies die echt tellen.
              </p>
            )}
          </>
        ) : (
          <>
            <p className="text-soft" style={{ marginTop: "8px" }}>
              Focus stability at {focusPct}%
            </p>
            <p className="text-soft">
              Energy, focus, fysieke health en mentale belasting bepalen je dagelijkse capaciteit. Slaap beinvloedt je headroom.
            </p>
          </>
        )}
        {/* Compact radial meters preview */}
        <div className="mb-6 rounded-2xl border border-white/[0.08] border-t-[rgba(var(--mode-rgb),0.22)] bg-[rgba(var(--mode-rgb-deep),0.18)] p-5 shadow-[0_-2px_0_0_rgba(var(--mode-rgb),0.08)] backdrop-blur-xl">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center gap-1" data-tutorial="brain-status-energy">
              <EnergyRing progress={energyPct} size={84} label="" value={`${energyPct}%`} mode={brainStatusRingModeFromPct(energyPct)} softGlow />
              <span className="text-[10px] text-[var(--text-muted)]">Energy</span>
            </div>
            <div className="flex flex-col items-center gap-1" data-tutorial="brain-status-focus">
              <EnergyRing progress={focusPct} size={84} label="" value={`${focusPct}%`} mode={brainStatusRingModeFromPct(focusPct)} softGlow />
              <span className="text-[10px] text-[var(--text-muted)]">Focus</span>
            </div>
            <div className="flex flex-col items-center gap-1" data-tutorial="brain-status-load">
              <EnergyRing progress={loadPct} size={84} label="" value={`${loadPct}%`} mode={brainStatusRingModeFromPct(loadPct)} softGlow />
              <span className="text-[10px] text-[var(--text-muted)]">Mentale belasting</span>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3 border-t border-[var(--card-border)] pt-6">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="btn-hq-secondary w-full rounded-[var(--hq-btn-radius)] py-2.5 px-4 text-sm"
          >
            Update check-in
          </button>
          <button
            type="button"
            onClick={() => setMoodOpen(true)}
            className="btn-hq-secondary w-full rounded-[var(--hq-btn-radius)] border-violet-500/30 py-2.5 px-4 text-sm text-violet-100/95 hover:border-violet-400/50"
          >
            Update mood
          </button>
        </div>
      </section>

      <MoodManualPanel
        open={moodOpen}
        onClose={() => setMoodOpen(false)}
        brainStatusHint
        onMoodSaved={(label) => setMoodLabel(label)}
      />

      <BrainStatusModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        date={date}
        initial={currentInitial}
        yesterday={yesterday}
        onSaved={(next) => {
          setCurrentInitial((prev) => ({
            ...prev,
            ...next,
          }));
        }}
      />
    </>
  );
});

