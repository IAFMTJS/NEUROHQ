"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import {
  updateStudyPlan,
  updateAccountabilitySettings,
  type StudyPlan,
  type AccountabilitySettings,
} from "@/app/actions/behavior";
import { useSettings } from "@/lib/settings-context";
import { neuroToast } from "@/lib/ui/neuro-toast";

type Props = {
  initialStudyPlan: StudyPlan;
  initialAccountability: AccountabilitySettings;
  engineLayout?: boolean;
};

function block(title: string, description: string | null, children: ReactNode, engineLayout: boolean) {
  const wrap = engineLayout
    ? "rounded-xl border border-[var(--card-border)]/70 bg-[var(--bg-primary)]/35 p-4 space-y-3"
    : "rounded-xl border border-[var(--card-border)]/60 bg-[var(--bg-surface)]/15 p-4 space-y-3";
  return (
    <div className={wrap}>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{title}</p>
        {description ? <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}

export function SettingsEngineProfile({
  initialStudyPlan,
  initialAccountability,
  engineLayout = false,
}: Props) {
  const [studyPlan, setStudyPlan] = useState<StudyPlan>(initialStudyPlan);
  const [accountability, setAccountability] = useState<AccountabilitySettings>(initialAccountability);
  const [studyPending, startStudyTransition] = useTransition();
  const [accountabilityPending, startAccountabilityTransition] = useTransition();
  const { invalidate: invalidateSettings } = useSettings();

  useEffect(() => {
    setStudyPlan(initialStudyPlan);
  }, [initialStudyPlan]);

  useEffect(() => {
    setAccountability(initialAccountability);
  }, [initialAccountability]);

  const saveStudyPlan = () => {
    startStudyTransition(async () => {
      try {
        await updateStudyPlan({
          dailyGoalMinutes: Math.max(5, Math.min(240, Math.round(studyPlan.dailyGoalMinutes))),
          preferredTime: studyPlan.preferredTime?.trim() ? studyPlan.preferredTime : null,
          reminderEnabled: studyPlan.reminderEnabled,
        });
        await invalidateSettings();
        neuroToast.success("Leer-ritme opgeslagen.");
      } catch (e) {
        neuroToast.error(e instanceof Error ? e.message : "Kon leer-ritme niet opslaan.");
      }
    });
  };

  const saveAccountability = () => {
    startAccountabilityTransition(async () => {
      try {
        await updateAccountabilitySettings({
          enabled: accountability.enabled,
          penaltyXPEnabled: accountability.penaltyXPEnabled,
          penaltyXPAmount: accountability.penaltyXPAmount,
          streakFreezeTokens: accountability.streakFreezeTokens,
        });
        await invalidateSettings();
        neuroToast.success("Accountability opgeslagen.");
      } catch (e) {
        neuroToast.error(e instanceof Error ? e.message : "Kon accountability niet opslaan.");
      }
    });
  };

  const root = engineLayout ? "space-y-5" : "space-y-4";

  return (
    <div className={root}>
      {!engineLayout ? (
        <>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Engine-profiel</h2>
          <p className="text-[11px] text-[var(--text-muted)]">
            Extra input voor de data-driven engine: leer-ritme en accountability sturen pacing en suggesties.
          </p>
        </>
      ) : null}

      {block(
        "Leer-ritme",
        "Dagelijks doel in minuten, optioneel voorkeursmoment en of reminders mogen.",
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-[var(--text-secondary)]">
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
                className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-2 text-sm text-[var(--text-primary)]"
              />
            </label>
            <label className="text-xs text-[var(--text-secondary)]">
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
                className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-2 text-sm text-[var(--text-primary)]"
              />
            </label>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--text-secondary)]">
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
            className="inline-flex items-center rounded-xl bg-[var(--accent-focus)] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
          >
            {studyPending ? "Opslaan…" : "Leer-ritme opslaan"}
          </button>
        </>,
        engineLayout,
      )}

      {block(
        "Accountability",
        "XP-boetes en streak-freeze; alleen actief als je accountability aanzet.",
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-[var(--text-secondary)]">
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
                className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-2 text-sm text-[var(--text-primary)]"
              />
            </label>
            <label className="text-xs text-[var(--text-secondary)]">
              Streak-freeze tokens
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
                className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-2 text-sm text-[var(--text-primary)]"
              />
            </label>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--text-secondary)]">
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
            <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--text-secondary)]">
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
            className="inline-flex items-center rounded-xl bg-[var(--accent-focus)] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
          >
            {accountabilityPending ? "Opslaan…" : "Accountability opslaan"}
          </button>
        </>,
        engineLayout,
      )}
    </div>
  );
}

