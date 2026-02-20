"use client";

import { useState } from "react";
import { logMissedReason } from "@/app/actions/behavior";

interface FailureInterventionProps {
  onClose: () => void;
}

export function FailureIntervention({ onClose }: FailureInterventionProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reasons = [
    { value: "no_time", label: "No time" },
    { value: "no_energy", label: "No energy" },
    { value: "forgot", label: "Forgot" },
    { value: "low_motivation", label: "Low motivation" },
  ];

  const handleSubmit = async () => {
    if (!selectedReason) return;
    setSubmitting(true);
    try {
      await logMissedReason(selectedReason as any);
      onClose();
    } catch (error) {
      console.error("Failed to log missed reason:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="card-simple max-w-md w-full">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
          Streak Broken — Reflection Required
        </h2>
        <p className="text-sm text-[var(--text-muted)] mb-4">
          Your streak has been broken. Understanding why helps build better patterns.
        </p>
        <div className="space-y-2 mb-4">
          {reasons.map((reason) => (
            <label
              key={reason.value}
              className="flex items-center gap-3 p-3 rounded-lg border border-[var(--card-border)] hover:bg-[var(--bg-surface)] cursor-pointer"
            >
              <input
                type="radio"
                name="missedReason"
                value={reason.value}
                checked={selectedReason === reason.value}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="w-4 h-4"
              />
              <span className="text-sm text-[var(--text-primary)]">{reason.label}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedReason || submitting}
            className="flex-1 px-4 py-2 text-sm font-medium bg-[var(--accent-focus)] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Saving..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
