"use client";

import { useEffect, useState, useTransition } from "react";
import { updateUserPreferences } from "@/app/actions/preferences";

type Props = {
  initialDaysOff: number[] | null | undefined;
  initialMode: "soft" | "hard" | null | undefined;
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

export function SettingsDaysOff({ initialDaysOff, initialMode }: Props) {
  const [pending, startTransition] = useTransition();
  const [daysOff, setDaysOff] = useState<number[]>(initialDaysOff ?? []);
  const [mode, setModeState] = useState<"soft" | "hard">(
    initialMode === "hard" ? "hard" : "soft",
  );

  // Keep local state in sync if server props change after a refresh.
  useEffect(() => {
    setDaysOff(initialDaysOff ?? []);
  }, [initialDaysOff]);

  useEffect(() => {
    setModeState(initialMode === "hard" ? "hard" : "soft");
  }, [initialMode]);

  function toggleDay(d: number) {
    setDaysOff((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      const sorted = Array.from(next).sort((a, b) => a - b);
      startTransition(async () => {
        await updateUserPreferences({
          usual_days_off: sorted.length ? sorted : null,
        });
      });
      return sorted;
    });
  }

  function setMode(next: "soft" | "hard") {
    setModeState(next);
    startTransition(async () => {
      await updateUserPreferences({
        day_off_mode: next,
      });
    });
  }

  const daysOffSet = new Set(daysOff);

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        Typische vrije dagen
      </h2>
      <div className="card-simple space-y-3">
        <p className="text-xs text-[var(--text-muted)]">
          Dagen waarop je meestal vrij bent van werk. NEUROHQ gebruikt dit om meer herstel- en
          huishouden-missies voor te stellen zonder rigide regels.
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
                className={`rounded-full px-3 py-1 text-xs border ${
                  active
                    ? "bg-[var(--accent-focus)]/20 text-[var(--accent-focus)] border-[var(--accent-focus)]/60"
                    : "bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--card-border)]"
                }`}
              >
                {ISO_WEEKDAY_LABELS[d]}
              </button>
            );
          })}
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-[var(--text-secondary)]">Dag-vrije modus</p>
          <div className="flex flex-wrap gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => setMode("soft")}
              disabled={pending}
              className={`rounded-full px-3 py-1 border ${
                mode === "soft"
                  ? "bg-[var(--accent-focus)]/20 text-[var(--accent-focus)] border-[var(--accent-focus)]/60"
                  : "bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--card-border)]"
              }`}
            >
              Soft
            </button>
            <button
              type="button"
              onClick={() => setMode("hard")}
              disabled={pending}
              className={`rounded-full px-3 py-1 border ${
                mode === "hard"
                  ? "bg-[var(--accent-focus)]/20 text-[var(--accent-focus)] border-[var(--accent-focus)]/60"
                  : "bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--card-border)]"
              }`}
            >
              Hard
            </button>
          </div>
          <p className="text-[11px] text-[var(--text-muted)]">
            Soft = vooral bias (meer herstel/huishouden). Hard = vermijd werk-achtige missies op
            deze dagen tenzij je ze expliciet toevoegt.
          </p>
        </div>
        {pending && (
          <p className="text-[11px] text-[var(--text-muted)]">Opslaan…</p>
        )}
      </div>
    </section>
  );
}

