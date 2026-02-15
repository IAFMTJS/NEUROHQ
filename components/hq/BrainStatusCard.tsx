"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { saveDailyState } from "@/app/actions/daily-state";
import { getSuggestedTaskCount } from "@/lib/utils/energy";
import { RadialMeter } from "./RadialMeter";
import { useAppState } from "@/components/providers/AppStateProvider";

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
    if (value >= 70) return "High load, consider rest";
    if (value >= 40) return "Minimal stress, steady";
    return "Low load";
  }
  return "";
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

export function BrainStatusCard({ date, initial, yesterday }: Props) {
  const router = useRouter();
  const appState = useAppState();
  const [expanded, setExpanded] = useState(false);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [energy, setEnergy] = useState(initial.energy ?? 5);
  const [focus, setFocus] = useState(initial.focus ?? 5);
  const [load, setLoad] = useState(initial.sensory_load ?? 5);
  const [sleep, setSleep] = useState(String(initial.sleep_hours ?? ""));
  const [social, setSocial] = useState(initial.social_load ?? 5);

  useEffect(() => {
    if (!expanded) {
      setEnergy(initial.energy ?? 5);
      setFocus(initial.focus ?? 5);
      setLoad(initial.sensory_load ?? 5);
      setSleep(String(initial.sleep_hours ?? ""));
      setSocial(initial.social_load ?? 5);
    }
  }, [expanded, initial.energy, initial.focus, initial.sensory_load, initial.sleep_hours, initial.social_load]);

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
      const result = await saveDailyState({
        date,
        energy,
        focus,
        sensory_load: load,
        sleep_hours: sleep ? parseFloat(sleep) : null,
        social_load: social,
      });
      if (result.ok) {
        setSaved(true);
        setExpanded(false);
        appState?.triggerReward();
        router.refresh();
        setTimeout(() => setSaved(false), 2500);
      } else {
        setError(result.error);
        appState?.triggerError();
      }
    });
  }

  return (
    <section
      className="hq-card hq-card-enter rounded-[var(--hq-card-radius-sharp)] p-5"
      style={{ animationDelay: "50ms" }}
      aria-label="Brain Status"
    >
      <h2 className="hq-h2 mb-5">Brain Status</h2>
      <p className="mb-4 text-xs text-[var(--text-muted)]">
        Energy, focus, and load drive your daily task capacity. Sleep and social load affect headroom.
      </p>
      <div className="grid grid-cols-3 gap-4">
        <RadialMeter
          value={energyPct}
          label="Energy"
          description={description(energyPct, "energy")}
          variant="energy"
          delay={0}
        />
        <RadialMeter
          value={focusPct}
          label="Focus"
          description={description(focusPct, "focus")}
          variant="focus"
          delay={80}
        />
        <RadialMeter
          value={loadPct}
          label="Load"
          description={description(loadPct, "load")}
          variant="warning"
          delay={160}
        />
      </div>

      <div className="mt-5 border-t border-[var(--card-border)] pt-5">
        <button
          type="button"
          onClick={() => {
            if (expanded) {
              setEnergy(initial.energy ?? 5);
              setFocus(initial.focus ?? 5);
              setLoad(initial.sensory_load ?? 5);
              setSleep(String(initial.sleep_hours ?? ""));
              setSocial(initial.social_load ?? 5);
              setError(null);
            }
            setExpanded((e) => !e);
          }}
          className="btn-hq-secondary w-full rounded-[var(--hq-btn-radius)] py-2.5 px-4 text-sm"
          aria-expanded={expanded}
        >
          {expanded ? "Cancel" : "Update check-in"}
        </button>

        {expanded && (
          <form onSubmit={handleSubmit} className="mt-5 space-y-5">
            {hasYesterday && (
              <button
                type="button"
                onClick={() => {
                  if (yesterday) {
                    setEnergy(yesterday.energy ?? 5);
                    setFocus(yesterday.focus ?? 5);
                    setLoad(yesterday.sensory_load ?? 5);
                    setSleep(yesterday.sleep_hours != null ? String(yesterday.sleep_hours) : "");
                    setSocial(yesterday.social_load ?? 5);
                  }
                }}
                className="w-full rounded-lg border border-[var(--accent-neutral)] bg-[var(--bg-primary)]/60 px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] transition"
              >
                Same as yesterday
              </button>
            )}
            <div className="rounded-xl border border-[var(--accent-focus)]/20 bg-[var(--bg-primary)]/80 px-4 py-3">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Live preview: ~{suggestedTasks} task{suggestedTasks !== 1 ? "s" : ""} suggested today
              </p>
              <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                Higher energy + focus, lower load, better sleep → more capacity. Save to update your budget.
              </p>
            </div>
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
              label="Load"
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
            <button
              type="submit"
              disabled={pending}
              className="btn-hq-primary w-full rounded-[var(--hq-btn-radius)] py-3 px-4 text-sm disabled:opacity-50"
            >
              {pending ? "Saving…" : saved ? "Saved" : "Save check-in"}
            </button>
          </form>
        )}
      </div>
    </section>
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
    <div className="rounded-xl bg-[var(--bg-primary)]/60 px-3 py-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-[var(--text-primary)]">{label}</span>
        <span className="tabular-nums font-medium text-[var(--accent-focus)]">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="hq-slider mt-2 h-2.5 w-full cursor-pointer appearance-none rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]"
        style={{
          background: `linear-gradient(to right, var(--accent-focus) 0%, var(--accent-focus) ${pct}%, var(--accent-neutral) ${pct}%, var(--accent-neutral) 100%)`,
        }}
        aria-label={`${label}: ${value} out of ${max}`}
      />
    </div>
  );
}
