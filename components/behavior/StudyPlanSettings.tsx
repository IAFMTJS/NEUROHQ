"use client";

import { useState } from "react";
import { updateStudyPlan, type StudyPlan } from "@/app/actions/behavior";

interface StudyPlanSettingsProps {
  initialPlan: StudyPlan;
}

export function StudyPlanSettings({ initialPlan }: StudyPlanSettingsProps) {
  const [plan, setPlan] = useState(initialPlan);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateStudyPlan(plan);
    } catch (error) {
      console.error("Failed to update study plan:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card-simple">
      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-3">
        Study Plan Settings
      </h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
            Daily Goal (minutes)
          </label>
          <input
            type="number"
            min="1"
            max="480"
            value={plan.dailyGoalMinutes}
            onChange={(e) =>
              setPlan({ ...plan, dailyGoalMinutes: parseInt(e.target.value) || 30 })
            }
            className="w-full px-3 py-2 border border-[var(--card-border)] rounded-lg bg-[var(--bg-surface)] text-[var(--text-primary)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
            Preferred Study Time
          </label>
          <input
            type="time"
            value={plan.preferredTime || ""}
            onChange={(e) => setPlan({ ...plan, preferredTime: e.target.value || null })}
            className="w-full px-3 py-2 border border-[var(--card-border)] rounded-lg bg-[var(--bg-surface)] text-[var(--text-primary)]"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="reminderEnabled"
            checked={plan.reminderEnabled}
            onChange={(e) => setPlan({ ...plan, reminderEnabled: e.target.checked })}
            className="w-4 h-4"
          />
          <label htmlFor="reminderEnabled" className="text-sm text-[var(--text-primary)]">
            Enable reminders
          </label>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full px-4 py-2 text-sm font-medium bg-[var(--accent-focus)] text-white rounded-lg disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Plan"}
        </button>
      </div>
    </div>
  );
}
