"use client";

import { useState, memo, useEffect } from "react";
import type { BrainMode } from "@/lib/brain-mode";
import { maxAllowedIntensityForTier } from "@/lib/brain-mode";
import { BrainStatusModal } from "./BrainStatusModal";
import { EnergyRing, type EnergyRingMode } from "@/components/hud-test/EnergyRing";

function scale1To10ToPct(value: number | null): number {
  if (value == null) return 50;
  return Math.round((value / 10) * 100);
}

function getRingMode(value: number): EnergyRingMode {
  if (value <= 20) return "high-alert";
  if (value >= 90) return "green-peak";
  if (value >= 70) return "green";
  return "default";
}

type Props = {
  date: string;
  initial: {
    energy: number | null;
    focus: number | null;
    sensory_load: number | null;
    sleep_hours: number | null;
    social_load: number | null;
    mental_battery: number | null;
    is_rest_day?: boolean | null;
  };
  yesterday?: {
    energy: number | null;
    focus: number | null;
    sensory_load: number | null;
    sleep_hours: number | null;
    social_load: number | null;
    mental_battery?: number | null;
  };
  brainMode?: BrainMode;
  suggestedTaskCount?: number;
};

export const BrainStatusCard = memo(function BrainStatusCard({ date, initial, yesterday, brainMode, suggestedTaskCount }: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const openIfHash = () => {
      if (typeof window !== "undefined" && window.location.hash === "#brain-status-modal") {
        setModalOpen(true);
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    };
    openIfHash();
    window.addEventListener("hashchange", openIfHash);
    return () => window.removeEventListener("hashchange", openIfHash);
  }, []);

  const energyPct = scale1To10ToPct(initial.energy);
  const focusPct = scale1To10ToPct(initial.focus);
  const loadPct = scale1To10ToPct(initial.sensory_load);

  let xpEnergyLabel: string | null = null;
  if (energyPct > 75) {
    xpEnergyLabel = "XP‑bonus: +10–15% bij high‑energy dag.";
  } else if (energyPct < 30) {
    xpEnergyLabel = "XP‑penalty: −25% bij very low‑energy (niet slim, maar toegestaan).";
  }

  return (
    <>
      <section
        id="brain-status-modal"
        className="card page glass-card-3d"
        aria-label="Brain Status"
      >
        <h3>Brain Status</h3>
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
              Energy, focus en mentale belasting bepalen je dagelijkse capaciteit. Sleep and social load affect headroom.
            </p>
          </>
        )}
        {/* Compact radial meters preview */}
        <div className="rounded-2xl bg-[rgba(11,18,32,0.75)] backdrop-blur-xl border border-white/[0.08] border-t-[rgba(0,229,255,0.2)] shadow-[0_-2px_0_0_rgba(0,229,255,0.06)] p-5 mb-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center gap-1">
              <EnergyRing progress={energyPct} size={84} label="" value={`${energyPct}%`} mode={getRingMode(energyPct)} softGlow />
              <span className="text-[10px] text-[var(--text-muted)]">Energy</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <EnergyRing progress={focusPct} size={84} label="" value={`${focusPct}%`} mode={getRingMode(focusPct)} softGlow />
              <span className="text-[10px] text-[var(--text-muted)]">Focus</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <EnergyRing progress={loadPct} size={84} label="" value={`${loadPct}%`} mode={getRingMode(loadPct)} softGlow />
              <span className="text-[10px] text-[var(--text-muted)]">Mentale belasting</span>
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-[var(--card-border)] pt-6">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="btn-hq-secondary w-full rounded-[var(--hq-btn-radius)] py-2.5 px-4 text-sm"
          >
            Update check-in
          </button>
        </div>
      </section>

      <BrainStatusModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        date={date}
        initial={initial}
        yesterday={yesterday}
      />
    </>
  );
});

