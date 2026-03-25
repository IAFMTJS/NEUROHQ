"use client";

import { useEffect, useState, useTransition } from "react";
import {
  updateStudyPlan,
  updateAccountabilitySettings,
  type StudyPlan,
  type AccountabilitySettings,
} from "@/app/actions/behavior";

type Props = {
  initialStudyPlan: StudyPlan;
  initialAccountability: AccountabilitySettings;
};

export function SettingsEngineProfile({
  initialStudyPlan,
  initialAccountability,
}: Props) {
  const [studyPlan, setStudyPlan] = useState<StudyPlan>(initialStudyPlan);
  const [accountability, setAccountability] =
    useState<AccountabilitySettings>(initialAccountability);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [studyPending, startStudyTransition] = useTransition();
  const [accountabilityPending, startAccountabilityTransition] = useTransition();

  useEffect(() => {
    setStudyPlan(initialStudyPlan);
  }, [initialStudyPlan]);

  useEffect(() => {
    setAccountability(initialAccountability);
  }, [initialAccountability]);

  const saveStudyPlan = () => {
    setError(null);
    setMessage(null);
    startStudyTransition(async () => {
      try {
        await updateStudyPlan({
          dailyGoalMinutes: Math.max(
            5,
            Math.min(240, Math.round(studyPlan.dailyGoalMinutes))
          ),
          preferredTime: studyPlan.preferredTime?.trim()
            ? studyPlan.preferredTime
            : null,
          reminderEnabled: studyPlan.reminderEnabled,
        });
        setMessage("Learning ritme opgeslagen.");
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "Kon learning ritme niet opslaan."
        );
      }
    });
  };

  const saveAccountability = () => {
    setError(null);
    setMessage(null);
    startAccountabilityTransition(async () => {
      try {
        await updateAccountabilitySettings({
          enabled: accountability.enabled,
          penaltyXPEnabled: accountability.penaltyXPEnabled,
          penaltyXPAmount: accountability.penaltyXPAmount,
          streakFreezeTokens: accountability.streakFreezeTokens,
        });
        setMessage("Accountability instellingen opgeslagen.");
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "Kon accountability niet opslaan."
        );
      }
    });
  };

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        Engine-profiel
      </h2>

      <div className="card-simple space-y-3">
        <p className="text-[11px] text-[var(--text-muted)]">
          Extra user-specifieke input voor de data-driven engine: leer-ritme en
          accountability bepalen je pacing, waarschuwingen en suggesties.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-[var(--text-muted)]">
            Dagelijks leerdoel (minuten)
            <input
              type="number"
              min={5}
              max={240}
              value={studyPlan.dailyGoalMinutes}
              onChange={(e) =>
                setStudyPlan((prev) => ({
                  ...prev,
                  dailyGoalMinutes: Number(e.target.value || 0),
                }))
              }
              className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1.5 text-sm"
            />
          </label>

          <label className="text-xs text-[var(--text-muted)]">
            Voorkeursmoment (optioneel)
            <input
              type="time"
              value={studyPlan.preferredTime ?? ""}
              onChange={(e) =>
                setStudyPlan((prev) => ({
                  ...prev,
                  preferredTime: e.target.value || null,
                }))
              }
              className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1.5 text-sm"
            />
          </label>
        </div>

        <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          <input
            type="checkbox"
            checked={studyPlan.reminderEnabled}
            onChange={(e) =>
              setStudyPlan((prev) => ({
                ...prev,
                reminderEnabled: e.target.checked,
              }))
            }
            className="rounded border-[var(--card-border)]"
          />
          Learning reminders toestaan
        </label>

        <button
          type="button"
          onClick={saveStudyPlan}
          disabled={studyPending}
          className="inline-flex items-center rounded-lg bg-[var(--accent-focus)] px-3 py-1.5 text-xs font-medium text-black disabled:opacity-50"
        >
          {studyPending ? "Opslaan..." : "Learning ritme opslaan"}
        </button>
      </div>

      <div className="card-simple space-y-3">
        <p className="text-xs font-medium text-[var(--text-secondary)]">
          Accountability
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-[var(--text-muted)]">
            XP-penalty bij gemiste dagen
            <input
              type="number"
              min={0}
              max={500}
              value={accountability.penaltyXPAmount}
              onChange={(e) =>
                setAccountability((prev) => ({
                  ...prev,
                  penaltyXPAmount: Number(e.target.value || 0),
                }))
              }
              className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs text-[var(--text-muted)]">
            Streak freeze tokens
            <input
              type="number"
              min={0}
              max={10}
              value={accountability.streakFreezeTokens}
              onChange={(e) =>
                setAccountability((prev) => ({
                  ...prev,
                  streakFreezeTokens: Number(e.target.value || 0),
                }))
              }
              className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1.5 text-sm"
            />
          </label>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <input
              type="checkbox"
              checked={accountability.enabled}
              onChange={(e) =>
                setAccountability((prev) => ({
                  ...prev,
                  enabled: e.target.checked,
                }))
              }
              className="rounded border-[var(--card-border)]"
            />
            Accountability aan
          </label>
          <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <input
              type="checkbox"
              checked={accountability.penaltyXPEnabled}
              onChange={(e) =>
                setAccountability((prev) => ({
                  ...prev,
                  penaltyXPEnabled: e.target.checked,
                }))
              }
              className="rounded border-[var(--card-border)]"
            />
            XP-penalty actief
          </label>
        </div>

        <button
          type="button"
          onClick={saveAccountability}
          disabled={accountabilityPending}
          className="inline-flex items-center rounded-lg bg-[var(--accent-focus)] px-3 py-1.5 text-xs font-medium text-black disabled:opacity-50"
        >
          {accountabilityPending ? "Opslaan..." : "Accountability opslaan"}
        </button>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
      {message && <p className="text-xs text-[var(--text-muted)]">{message}</p>}
    </section>
  );
}

