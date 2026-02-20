/**
 * Dark Commander Intelligence Core - Mission Confirmation Modal
 * Shows simulation preview and requires explicit confirmation before execution
 */

"use client";

import { useState } from "react";
import type { SimulationResult } from "@/lib/dcic/types";
import { confirmCompleteMission, confirmStartMission } from "@/app/actions/dcic/missions";

interface MissionConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  missionId: string;
  missionName: string;
  actionType: "start" | "complete";
  simulation: SimulationResult;
}

export function MissionConfirmationModal({
  open,
  onClose,
  missionId,
  missionName,
  actionType,
  simulation,
}: MissionConfirmationModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);

    try {
      const result =
        actionType === "start"
          ? await confirmStartMission(missionId)
          : await confirmCompleteMission(missionId);

      if (!result.success) {
        setError(result.error || "Failed to execute mission");
        return;
      }

      // Success - close modal
      onClose();
      // Refresh page to show updated state
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setError(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleCancel}
    >
      <div
        className="relative w-full max-w-md rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-xl font-semibold text-[var(--text-primary)]">
          {actionType === "start" ? "Start Mission?" : "Complete Mission?"}
        </h2>

        <div className="mb-6 space-y-4">
          <div>
            <p className="text-sm text-[var(--text-muted)]">Mission</p>
            <p className="text-lg font-medium text-[var(--text-primary)]">
              {missionName}
            </p>
          </div>

          {actionType === "complete" && (
            <>
              <div className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-secondary)] p-4">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Preview
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-[var(--text-muted)]">XP Gain</span>
                    <span className="font-semibold text-[var(--accent-primary)]">
                      +{simulation.xpGain}
                    </span>
                  </div>
                  {simulation.newLevel > simulation.newLevel - 1 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-[var(--text-muted)]">New Level</span>
                      <span className="font-semibold text-[var(--accent-primary)]">
                        {simulation.newLevel}
                      </span>
                    </div>
                  )}
                  {simulation.newRank !== simulation.newRank && (
                    <div className="flex justify-between">
                      <span className="text-sm text-[var(--text-muted)]">New Rank</span>
                      <span className="font-semibold text-[var(--accent-primary)]">
                        {simulation.newRank}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-[var(--text-muted)]">Energy After</span>
                    <span className="font-semibold text-[var(--text-primary)]">
                      {simulation.energyAfter}/100
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-[var(--text-muted)]">Streak After</span>
                    <span className="font-semibold text-[var(--accent-primary)]">
                      {simulation.streakAfter} days
                    </span>
                  </div>
                  {simulation.projectedAchievements.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[var(--card-border)]">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-2">
                        Achievements Unlocked
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {simulation.projectedAchievements.map((achievement) => (
                          <span
                            key={achievement}
                            className="rounded bg-[var(--accent-primary)]/20 px-2 py-1 text-xs font-medium text-[var(--accent-primary)]"
                          >
                            {achievement}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {actionType === "start" && (
            <div className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-secondary)] p-4">
              <div className="flex justify-between">
                <span className="text-sm text-[var(--text-muted)]">Energy After</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {simulation.energyAfter}/100
                </span>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-500">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 rounded-lg border border-[var(--card-border)] bg-[var(--bg-secondary)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-tertiary)] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 rounded-lg bg-[var(--accent-primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-primary)]/90 disabled:opacity-50"
          >
            {loading ? "Processing..." : actionType === "start" ? "Start" : "Complete"}
          </button>
        </div>
      </div>
    </div>
  );
}
