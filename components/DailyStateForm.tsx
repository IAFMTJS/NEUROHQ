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

export function DailyStateForm({ date, initial }: Props) {
  const [energy, setEnergy] = useState(initial.energy ?? 5);
  const [focus, setFocus] = useState(initial.focus ?? 5);
  const [sensory, setSensory] = useState(initial.sensory_load ?? 5);
  const [sleep, setSleep] = useState(String(initial.sleep_hours ?? ""));
  const [social, setSocial] = useState(initial.social_load ?? 5);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await saveDailyState({
        date,
        energy,
        focus,
        sensory_load: sensory,
        sleep_hours: sleep ? parseFloat(sleep) : null,
        social_load: social,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-neutral-700 bg-neuro-surface p-4">
      <h2 className="mb-3 text-sm font-medium text-neuro-silver">Today&apos;s state</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label className="block text-xs text-neutral-400">Energy (1–10)</label>
          <input
            type="range"
            min={1}
            max={10}
            value={energy}
            onChange={(e) => setEnergy(Number(e.target.value))}
            className="mt-1 w-full accent-neuro-blue"
          />
          <span className="text-sm text-neutral-300">{energy}</span>
        </div>
        <div>
          <label className="block text-xs text-neutral-400">Focus (1–10)</label>
          <input
            type="range"
            min={1}
            max={10}
            value={focus}
            onChange={(e) => setFocus(Number(e.target.value))}
            className="mt-1 w-full accent-neuro-blue"
          />
          <span className="text-sm text-neutral-300">{focus}</span>
        </div>
        <div>
          <label className="block text-xs text-neutral-400">Sensory load (1–10)</label>
          <input
            type="range"
            min={1}
            max={10}
            value={sensory}
            onChange={(e) => setSensory(Number(e.target.value))}
            className="mt-1 w-full accent-neuro-blue"
          />
          <span className="text-sm text-neutral-300">{sensory}</span>
        </div>
        <div>
          <label className="block text-xs text-neutral-400">Sleep (hours)</label>
          <input
            type="number"
            min={0}
            max={24}
            step={0.5}
            value={sleep}
            onChange={(e) => setSleep(e.target.value)}
            className="mt-1 w-full rounded border border-neutral-600 bg-neuro-dark px-2 py-1 text-sm text-white"
            placeholder="7"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-400">Social load (1–10)</label>
          <input
            type="range"
            min={1}
            max={10}
            value={social}
            onChange={(e) => setSocial(Number(e.target.value))}
            className="mt-1 w-full accent-neuro-blue"
          />
          <span className="text-sm text-neutral-300">{social}</span>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-neuro-blue px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        {saved && <span className="text-xs text-green-400">Saved</span>}
      </div>
    </form>
  );
}
