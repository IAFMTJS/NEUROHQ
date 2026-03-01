"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { saveDailyState } from "@/app/actions/daily-state";
import { getSuggestedTaskCount } from "@/lib/utils/energy";
import { EnergyRing, type EnergyRingMode } from "@/components/hud-test/EnergyRing";
import { useAppState } from "@/components/providers/AppStateProvider";
import { Modal } from "@/components/Modal";

function scale1To10ToPct(value: number | null): number {
  if (value == null) return 50;
  return Math.round((value / 10) * 100);
}

/** Short micro-descriptions to match reference image */
function description(value: number, type: "energy" | "focus" | "load"): string {
  if (type === "energy") {
    if (value >= 70) return "High charge, ready";
    if (value >= 40) return "Moderate charge, stable";
    return "Low charge, recharge";
  }
  if (type === "focus") {
    if (value >= 70) return "Sharp and locked in";
    if (value >= 40) return "Some focus, slightly scattered";
    return "Low focus, ease in";
  }
  if (type === "load") {
    if (value >= 70) return "Hoge belasting, overweeg rust";
    if (value >= 40) return "Matige belasting";
    return "Lage belasting";
  }
  return "";
}

function getRingMode(value: number): EnergyRingMode {
  if (value <= 20) return "high-alert";
  if (value >= 90) return "green-peak";
  if (value >= 70) return "green";
  return "default";
}

type Props = {
  open: boolean;
  onClose: () => void;
  date: string;
  initial: {
    energy: number | null;
    focus: number | null;
    sensory_load: number | null;
    sleep_hours: number | null;
    social_load: number | null;
    mental_battery: number | null;
  };
  yesterday?: {
    energy: number | null;
    focus: number | null;
    sensory_load: number | null;
    sleep_hours: number | null;
    social_load: number | null;
  };
};

export function BrainStatusModal({ open, onClose, date, initial, yesterday }: Props) {
  const router = useRouter();
  const appState = useAppState();
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [energy, setEnergy] = useState(initial.energy ?? 5);
  const [focus, setFocus] = useState(initial.focus ?? 5);
  const [mentalBattery, setMentalBattery] = useState(initial.mental_battery ?? 5);
  const [load, setLoad] = useState(initial.sensory_load ?? 5);
  const [sleep, setSleep] = useState(String(initial.sleep_hours ?? ""));
  const [social, setSocial] = useState(initial.social_load ?? 5);

  useEffect(() => {
    if (open) {
      setEnergy(initial.energy ?? 5);
      setFocus(initial.focus ?? 5);
      setMentalBattery(initial.mental_battery ?? 5);
      setLoad(initial.sensory_load ?? 5);
      setSleep(String(initial.sleep_hours ?? ""));
      setSocial(initial.social_load ?? 5);
      setError(null);
      setSaved(false);
    }
  }, [open, initial.energy, initial.focus, initial.mental_battery, initial.sensory_load, initial.sleep_hours, initial.social_load]);

  const energyPct = scale1To10ToPct(energy);
  const focusPct = scale1To10ToPct(focus);
  const loadPct = scale1To10ToPct(load);

  const hasYesterday = !!yesterday && (yesterday.energy != null || yesterday.focus != null || yesterday.sensory_load != null);

  const suggestedTasks = useMemo(
    () => getSuggestedTaskCount({
      energy,
      focus,
      sensory_load: load,
      social_load: social,
      sleep_hours: sleep ? parseFloat(sleep) : null,
    }),
    [energy, focus, load, social, sleep]
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const result = await saveDailyState({
          date,
          energy,
          focus,
          sensory_load: load,
          sleep_hours: sleep ? parseFloat(sleep) : null,
          social_load: social,
          mental_battery: mentalBattery,
        });
        if (result.ok) {
          setSaved(true);
          appState?.triggerReward();
          router.refresh();
          setTimeout(() => {
            setSaved(false);
            onClose();
          }, 1000);
        } else {
          setError(result.error);
          appState?.triggerError();
        }
      } catch (err) {
        // Catch network errors or other unexpected errors
        const errorMessage = err instanceof Error ? err.message : "Network error. Please check your connection and try again.";
        setError(errorMessage);
        appState?.triggerError();
        console.error("Brain status save error:", err);
      }
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Brain Status Check-in"
      subtitle="Energy, focus en mentale belasting bepalen je dagelijkse capaciteit"
      size="lg"
    >
      <div className="space-y-6">
        {/* Radial meters - 2 columns for more space */}
        <div className="rounded-2xl bg-[rgba(11,18,32,0.75)] backdrop-blur-xl border border-white/[0.08] border-t-[rgba(0,229,255,0.2)] shadow-[0_-2px_0_0_rgba(0,229,255,0.06)] p-6">
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="flex justify-center">
              <div className="flex flex-col items-center gap-2">
                <EnergyRing
                  progress={energyPct}
                  size={96}
                  label=""
                  value={`${energyPct}%`}
                  mode={getRingMode(energyPct)}
                  softGlow
                />
                <span className="text-[11px] text-[var(--text-secondary)]">Energy</span>
                <span className="text-[11px] text-center text-[var(--text-muted)]">
                  {description(energyPct, "energy")}
                </span>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="flex flex-col items-center gap-2">
                <EnergyRing
                  progress={focusPct}
                  size={96}
                  label=""
                  value={`${focusPct}%`}
                  mode={getRingMode(focusPct)}
                  softGlow
                />
                <span className="text-[11px] text-[var(--text-secondary)]">Focus</span>
                <span className="text-[11px] text-center text-[var(--text-muted)]">
                  {description(focusPct, "focus")}
                </span>
              </div>
            </div>
          </div>
          {/* Load meter centered below */}
          <div className="flex justify-center">
            <div className="flex flex-col items-center gap-2">
              <EnergyRing
                progress={loadPct}
                size={96}
                label=""
                value={`${loadPct}%`}
                mode={getRingMode(loadPct)}
                softGlow
              />
              <span className="text-[11px] text-[var(--text-secondary)]">Mentale belasting</span>
              <span className="text-[11px] text-center text-[var(--text-muted)]">
                {description(loadPct, "load")}
              </span>
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div className="rounded-xl border border-[var(--accent-focus)]/30 bg-[var(--accent-focus)]/5 px-4 py-3">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            Live preview: ~{suggestedTasks} task{suggestedTasks !== 1 ? "s" : ""} suggested today
          </p>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            Higher energy + focus, lower load, better sleep → more capacity.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {hasYesterday && (
            <button
              type="button"
              onClick={() => {
                if (yesterday) {
                  setEnergy(yesterday.energy ?? 5);
                  setFocus(yesterday.focus ?? 5);
                  setMentalBattery((yesterday as { mental_battery?: number | null }).mental_battery ?? 5);
                  setLoad(yesterday.sensory_load ?? 5);
                  setSleep(yesterday.sleep_hours != null ? String(yesterday.sleep_hours) : "");
                  setSocial(yesterday.social_load ?? 5);
                }
              }}
              className="w-full rounded-lg border border-[var(--accent-neutral)] bg-[var(--bg-primary)]/60 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] transition"
            >
              Same as yesterday
            </button>
          )}

          <HQSliderRow
            label="Energy"
            value={energy}
            onChange={setEnergy}
            min={1}
            max={10}
          />
          <HQSliderRow
            label="Focus"
            value={focus}
            onChange={setFocus}
            min={1}
            max={10}
          />
          <HQSliderRow
            label="Mental battery"
            value={mentalBattery}
            onChange={setMentalBattery}
            min={1}
            max={10}
          />
          <HQSliderRow
            label="Mentale belasting"
            value={load}
            onChange={setLoad}
            min={1}
            max={10}
          />
          <HQSliderRow
            label="Social load"
            value={social}
            onChange={setSocial}
            min={1}
            max={10}
          />
          <div className="flex flex-wrap items-center gap-4">
            <label htmlFor="brain-sleep" className="hq-label text-[var(--text-secondary)]">
              Sleep (hours)
            </label>
            <input
              id="brain-sleep"
              type="number"
              min={0}
              max={24}
              step={0.5}
              value={sleep}
              onChange={(e) => setSleep(e.target.value)}
              className="hq-input w-20 rounded-[var(--hq-btn-radius)] border border-[var(--accent-neutral)] bg-[var(--bg-primary)] px-3 py-2 text-center text-sm tabular-nums text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-focus)]"
              placeholder="7"
              aria-label="Sleep hours"
            />
          </div>

          {error && (
            <p className="text-sm text-[#f87171]" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-[var(--hq-btn-radius)] border border-[var(--accent-neutral)] bg-[var(--bg-primary)]/60 px-4 py-3 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex-1 rounded-[var(--hq-btn-radius)] bg-[var(--accent-focus)] px-4 py-3 text-sm font-medium text-white disabled:opacity-50 hover:opacity-90 transition"
            >
              {pending ? "Saving…" : saved ? "Saved ✓" : "Save check-in"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function HQSliderRow({
  label,
  value,
  onChange,
  min = 1,
  max = 10,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="rounded-xl bg-[var(--bg-primary)]/60 px-4 py-4">
      <div className="flex items-center justify-between text-sm mb-3">
        <span className="font-medium text-[var(--text-primary)]">{label}</span>
        <span className="tabular-nums font-medium text-[var(--accent-focus)] text-lg">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="hq-slider h-2.5 w-full cursor-pointer appearance-none rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]"
        style={{
          background: `linear-gradient(to right, var(--accent-focus) 0%, var(--accent-focus) ${pct}%, var(--accent-neutral) ${pct}%, var(--accent-neutral) 100%)`,
        }}
        aria-label={`${label}: ${value} out of ${max}`}
      />
    </div>
  );
}
