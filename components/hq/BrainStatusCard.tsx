"use client";

import { useState, memo, useEffect } from "react";
import { BrainStatusModal } from "./BrainStatusModal";
import { RadialMeter } from "./RadialMeter";

function scale1To10ToPct(value: number | null): number {
  if (value == null) return 50;
  return Math.round((value / 10) * 100);
}

type Props = {
  date: string;
  initial: {
    energy: number | null;
    focus: number | null;
    sensory_load: number | null;
    sleep_hours: number | null;
    social_load: number | null;
  };
  yesterday?: {
    energy: number | null;
    focus: number | null;
    sensory_load: number | null;
    sleep_hours: number | null;
    social_load: number | null;
  };
};

export const BrainStatusCard = memo(function BrainStatusCard({ date, initial, yesterday }: Props) {
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
        <p className="text-soft" style={{ marginTop: "8px" }}>
          Focus stability at {focusPct}%
        </p>
        <p className="text-soft">
          Energy, focus, and load drive your daily task capacity. Sleep and social load affect headroom.
        </p>
        {/* Compact radial meters preview */}
        <div className="rounded-2xl bg-[rgba(11,18,32,0.75)] backdrop-blur-xl border border-white/[0.08] border-t-[rgba(0,229,255,0.2)] shadow-[0_-2px_0_0_rgba(0,229,255,0.06)] p-5 mb-6">
          <div className="grid grid-cols-3 gap-4">
            <RadialMeter
              value={energyPct}
              label="Energy"
              variant="energy"
              delay={0}
              thin
            />
            <RadialMeter
              value={focusPct}
              label="Focus"
              variant="focus"
              delay={80}
              thin
            />
            <RadialMeter
              value={loadPct}
              label="Load"
              variant="warning"
              delay={160}
              thin
            />
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

