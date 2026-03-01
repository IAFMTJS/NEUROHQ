"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { recordBudgetDisciplineMission } from "@/app/actions/missions-performance";
import type { BudgetDisciplineMissionKey } from "@/app/actions/budget-discipline";

type MissionKey = BudgetDisciplineMissionKey;

const MISSIONS: { key: MissionKey; label: string; rewardXp: number }[] = [
  { key: "safe_spend", label: "Stay under safe spend", rewardXp: 20 },
  { key: "log_all", label: "Log all expenses", rewardXp: 10 },
  { key: "no_impulse", label: "No impulse purchases", rewardXp: 15 },
];

type Props = {
  /** Server-loaded: missions already completed today (so checkboxes stay checked after refresh). */
  initialCompletedToday?: MissionKey[];
};

export function DailyControlMissionsCard({ initialCompletedToday = [] }: Props) {
  const [pendingKey, setPendingKey] = useState<MissionKey | null>(null);
  const [completedToday, setCompletedToday] = useState<Set<MissionKey>>(
    () => new Set(initialCompletedToday)
  );
  const [isPending, startTransition] = useTransition();

  function handleToggle(key: MissionKey) {
    if (completedToday.has(key) || isPending) return;
    setPendingKey(key);
    startTransition(async () => {
      try {
        const result = await recordBudgetDisciplineMission({ mission: key });
        if (!result.ok) {
          toast.error(result.reason ?? "Niet voldaan: mission niet gehaald.");
          return;
        }
        setCompletedToday((prev) => new Set(prev).add(key));
        toast.success("Mission recorded");
      } catch (e) {
        console.error(e);
        toast.error("Could not record mission");
      } finally {
        setPendingKey(null);
      }
    });
  }

  return (
    <section className="card-simple overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Daily Control Missions</h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
          Lightweight missions that connect your daily budget behavior to XP, streaks, and achievements.
        </p>
      </div>
      <div className="p-4 space-y-2">
        {MISSIONS.map((m) => {
          const checked = completedToday.has(m.key);
          const disabled = checked || isPending;
          return (
            <label
              key={m.key}
              className="flex cursor-pointer items-center justify-between rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/50 px-3 py-2 text-sm"
            >
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => handleToggle(m.key)}
                  className="h-4 w-4 rounded border-[var(--card-border)] bg-[var(--bg-primary)] text-[var(--accent-primary)]"
                />
                <span className="text-[var(--text-primary)]">{m.label}</span>
              </span>
              <span className="text-xs font-medium text-[var(--accent-primary)]">
                +{m.rewardXp} XP
              </span>
            </label>
          );
        })}
      </div>
    </section>
  );
}

