"use client";

import { useState, useTransition } from "react";
import { saveDailyState } from "@/app/actions/daily-state";

type Props = {
  date: string;
  initial: {
    energy: number | null;
    focus: number | null;
    sensory_load: number | null;
    sleep_hours: number | null;
    social_load: number | null;
  };
};

const DIMENSIONS = [
  { key: "energy" as const, label: "Energy" },
  { key: "focus" as const, label: "Focus" },
  { key: "sensory" as const, label: "Sensory load" },
  { key: "social" as const, label: "Social load" },
];

function SliderRow({
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
    <div className="rounded-xl bg-neuro-dark/50 px-3 py-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-neuro-silver">{label}</span>
        <span className="tabular-nums font-medium text-neuro-blue">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="daily-state-slider mt-2 h-2.5 w-full cursor-pointer appearance-none rounded-full bg-neuro-border focus:outline-none focus:ring-2 focus:ring-neuro-blue focus:ring-offset-2 focus:ring-offset-neuro-surface"
        style={{
          background: `linear-gradient(to right, #58a6ff 0%, #58a6ff ${pct}%, var(--neuro-border) ${pct}%, var(--neuro-border) 100%)`,
        }}
        aria-label={`${label}: ${value} out of ${max}`}
      />
    </div>
  );
}

function summaryLine(energy: number, focus: number, sleep: string) {
  const sleepNum = sleep ? parseFloat(sleep) : null;
  const parts: string[] = [];
  if (energy >= 7) parts.push("good energy");
  else if (energy >= 4) parts.push("moderate energy");
  else parts.push("low energy");
  if (focus >= 7) parts.push("focused");
  else if (focus >= 4) parts.push("some focus");
  if (sleepNum !== null && sleepNum >= 7) parts.push("rested");
  else if (sleepNum !== null && sleepNum < 5) parts.push("short sleep");
  return parts.length ? `You're ${parts.join(" · ")} today.` : "Set your check-in to see your day at a glance.";
}

export function DailyStateForm({ date, initial }: Props) {
  const [energy, setEnergy] = useState(initial.energy ?? 5);
  const [focus, setFocus] = useState(initial.focus ?? 5);
  const [sensory, setSensory] = useState(initial.sensory_load ?? 5);
  const [sleep, setSleep] = useState(String(initial.sleep_hours ?? ""));
  const [social, setSocial] = useState(initial.social_load ?? 5);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await saveDailyState({
        date,
        energy,
        focus,
        sensory_load: sensory,
        sleep_hours: sleep ? parseFloat(sleep) : null,
        social_load: social,
      });
      if (result.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else {
        setError(result.error);
      }
    });
  }

  const summary = summaryLine(energy, focus, sleep);

  return (
    <section className="daily-state-card overflow-hidden" aria-labelledby="daily-state-heading">
      <div className="daily-state-header">
        <h2 id="daily-state-heading" className="text-lg font-semibold text-neuro-silver">
          How are you today?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-neuro-muted/95">{summary}</p>
      </div>
      <form onSubmit={handleSubmit} className="p-5">
        <div className="space-y-5">
          {DIMENSIONS.map((d) => (
            <SliderRow
              key={d.key}
              label={d.label}
              value={
                d.key === "energy" ? energy :
                d.key === "focus" ? focus :
                d.key === "sensory" ? sensory : social
              }
              onChange={
                d.key === "energy" ? setEnergy :
                d.key === "focus" ? setFocus :
                d.key === "sensory" ? setSensory : setSocial
              }
            />
          ))}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-neuro-border/80 pt-5">
          <div className="flex items-center gap-2">
            <label htmlFor="daily-sleep" className="text-sm font-medium text-neuro-muted">
              Sleep (hours)
            </label>
            <input
              id="daily-sleep"
              type="number"
              min={0}
              max={24}
              step={0.5}
              value={sleep}
              onChange={(e) => setSleep(e.target.value)}
              className="w-20 rounded-lg border border-neuro-border bg-neuro-dark px-3 py-2.5 text-center text-sm tabular-nums text-neuro-silver placeholder-neuro-muted focus:border-neuro-blue focus:outline-none focus:ring-2 focus:ring-neuro-blue/30"
              placeholder="7"
              aria-label="Sleep hours"
            />
          </div>
          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="btn-primary ml-auto rounded-lg px-5 py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {pending ? "Saving…" : saved ? "Saved" : "Save check-in"}
          </button>
        </div>
      </form>
    </section>
  );
}
