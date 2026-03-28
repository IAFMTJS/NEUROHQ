"use client";

import { useEffect, useState, useTransition } from "react";
import { updateUserPreferences } from "@/app/actions/preferences";
import { useSettings } from "@/lib/settings-context";
import { neuroToast } from "@/lib/ui/neuro-toast";

type Props = {
  initialDaysOff: number[] | null | undefined;
  initialMode: "soft" | "hard" | null | undefined;
  engineLayout?: boolean;
};

const ISO_WEEKDAY_LABELS: Record<number, string> = {
  1: "Ma",
  2: "Di",
  3: "Wo",
  4: "Do",
  5: "Vr",
  6: "Za",
  7: "Zo",
};

const pillOff =
  "border-[var(--card-border)] bg-[var(--bg-primary)] text-[var(--text-muted)] hover:border-[var(--semantic-ring)]/30";
const pillOn = "border-[var(--accent-focus)]/70 bg-[var(--accent-focus)]/10 text-[var(--text-primary)]";

export function SettingsDaysOff({ initialDaysOff, initialMode, engineLayout = false }: Props) {
  const [pending, startTransition] = useTransition();
  const [daysOff, setDaysOff] = useState<number[]>(initialDaysOff ?? []);
  const [mode, setModeState] = useState<"soft" | "hard">(initialMode === "hard" ? "hard" : "soft");
  const { invalidate: invalidateSettings } = useSettings();

  useEffect(() => {
    setDaysOff(initialDaysOff ?? []);
  }, [initialDaysOff]);

  useEffect(() => {
    setModeState(initialMode === "hard" ? "hard" : "soft");
  }, [initialMode]);

  function toggleDay(d: number) {
    const prev = [...daysOff];
    const next = new Set(prev);
    if (next.has(d)) next.delete(d);
    else next.add(d);
    const sorted = Array.from(next).sort((a, b) => a - b);
    setDaysOff(sorted);
    startTransition(async () => {
      try {
        await updateUserPreferences({
          usual_days_off: sorted.length ? sorted : null,
        });
        await invalidateSettings();
        neuroToast.success("Vrije dagen bijgewerkt.");
      } catch (e) {
        setDaysOff(prev);
        neuroToast.error(e instanceof Error ? e.message : "Opslaan mislukt.");
      }
    });
  }

  function setMode(next: "soft" | "hard") {
    const prev = mode;
    setModeState(next);
    startTransition(async () => {
      try {
        await updateUserPreferences({
          day_off_mode: next,
        });
        await invalidateSettings();
        neuroToast.success(next === "hard" ? "Dag-vrije modus: hard." : "Dag-vrije modus: soft.");
      } catch (e) {
        setModeState(prev);
        neuroToast.error(e instanceof Error ? e.message : "Opslaan mislukt.");
      }
    });
  }

  const daysOffSet = new Set(daysOff);

  const inner = (
    <>
      <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
        Dagen waarop je meestal vrij bent van werk. NEUROHQ gebruikt dit om meer herstel- en huishoudmissies voor te
        stellen zonder rigide regels.
      </p>
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5, 6, 7].map((d) => {
          const active = daysOffSet.has(d);
          return (
            <button
              key={d}
              type="button"
              onClick={() => toggleDay(d)}
              disabled={pending}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
                active ? pillOn : pillOff
              }`}
            >
              {ISO_WEEKDAY_LABELS[d]}
            </button>
          );
        })}
      </div>
      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Dag-vrije modus</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode("soft")}
            disabled={pending}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
              mode === "soft" ? pillOn : pillOff
            }`}
          >
            Soft
          </button>
          <button
            type="button"
            onClick={() => setMode("hard")}
            disabled={pending}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
              mode === "hard" ? pillOn : pillOff
            }`}
          >
            Hard
          </button>
        </div>
        <p className="text-[11px] leading-snug text-[var(--text-muted)]">
          Soft = vooral bias (meer herstel/huishouden). Hard = vermijd werk-achtige missies op deze dagen tenzij je ze
          expliciet toevoegt.
        </p>
      </div>
      {pending ? <p className="text-[11px] text-[var(--text-muted)]">Opslaan…</p> : null}
    </>
  );

  if (engineLayout) {
    return <div className="space-y-4">{inner}</div>;
  }

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Typische vrije dagen</h2>
      <div className="card-simple space-y-3">{inner}</div>
    </section>
  );
}
