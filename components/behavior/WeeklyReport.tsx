"use client";

import { useEffect, useState } from "react";

interface WeeklyReportProps {
  weekStart: string;
  weekEnd: string;
  totalMinutes: number;
  missionsCompleted: number;
  streakStatus: number;
  rankProgress?: number;
  onClose: () => void;
}

export function WeeklyReport({
  weekStart,
  weekEnd,
  totalMinutes,
  missionsCompleted,
  streakStatus,
  rankProgress,
  onClose,
}: WeeklyReportProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="card-simple max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Weekly Performance Report
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="text-xs text-[var(--text-muted)] mb-4">
          {new Date(weekStart).toLocaleDateString()} - {new Date(weekEnd).toLocaleDateString()}
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-surface)]">
            <span className="text-sm text-[var(--text-muted)]">Total Minutes</span>
            <span className="text-base font-semibold text-[var(--text-primary)]">
              {totalMinutes} min
            </span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-surface)]">
            <span className="text-sm text-[var(--text-muted)]">Missions Completed</span>
            <span className="text-base font-semibold text-[var(--text-primary)]">
              {missionsCompleted}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-surface)]">
            <span className="text-sm text-[var(--text-muted)]">Streak Status</span>
            <span className="text-base font-semibold text-[var(--text-primary)]">
              {streakStatus} week{streakStatus !== 1 ? "s" : ""}
            </span>
          </div>
          {rankProgress !== undefined && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-surface)]">
              <span className="text-sm text-[var(--text-muted)]">Rank Progress</span>
              <span className="text-base font-semibold text-[var(--text-primary)]">
                Level {rankProgress}
              </span>
            </div>
          )}
        </div>
        <p className="mt-4 text-xs text-[var(--text-muted)] italic">
          Reflection builds awareness. Awareness builds change.
        </p>
        <button
          onClick={onClose}
          className="mt-4 w-full px-4 py-2 text-sm font-medium bg-[var(--accent-focus)] text-white rounded-lg"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
