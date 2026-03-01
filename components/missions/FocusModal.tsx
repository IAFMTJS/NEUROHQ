"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { snoozeTask } from "@/app/actions/tasks";
import { startTaskWithHeavyCost } from "@/app/actions/decision-cost";
import { useOfflineCompleteTask } from "@/app/hooks/useOfflineCompleteTask";
import { getDailyState, setEmotionalStatePreStart, type EmotionalStatePreStart } from "@/app/actions/daily-state";

const DEFAULT_MINUTES = 25;

const EMOTIONAL_OPTIONS: { value: EmotionalStatePreStart; label: string }[] = [
  { value: "focused", label: "Gefocust" },
  { value: "tired", label: "Moe" },
  { value: "resistance", label: "Weerstand" },
  { value: "distracted", label: "Afgeleid" },
  { value: "motivated", label: "Gemotiveerd" },
];

type Props = {
  open: boolean;
  onClose: () => void;
  taskId: string;
  taskTitle: string;
  /** For Emotional State Check (default: today). */
  date?: string;
  /** Anti-Distraction Guard: show "Dit verlaagt je Alignment Score" when outside primary/secondary. */
  taskDomain?: string | null;
  strategyMapping?: { primaryDomain: string; secondaryDomains: string[] } | null;
  onComplete?: (result?: import("@/app/actions/tasks").CompleteTaskResult) => void;
  onSnooze?: () => void;
  /** Optional 0–1 energy match score from missions engine. */
  energyMatchScore?: number | null;
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function classifyEnergyMatch(score: number | null | undefined): "high" | "ok" | "low" | null {
  if (score == null) return null;
  if (score >= 0.7) return "high";
  if (score < 0.3) return "low";
  return "ok";
}

export function FocusModal({ open, onClose, taskId, taskTitle, date: dateProp, taskDomain, strategyMapping, onComplete, onSnooze, energyMatchScore }: Props) {
  const router = useRouter();
  const completeTaskOffline = useOfflineCompleteTask();
  const today = new Date().toISOString().slice(0, 10);
  const date = dateProp ?? today;
  const [pending, setPending] = useState(false);
  const [minutes, setMinutes] = useState(DEFAULT_MINUTES);
  const [secondsLeft, setSecondsLeft] = useState(minutes * 60);
  const [running, setRunning] = useState(false);
  const [dailyState, setDailyState] = useState<{ emotional_state?: string | null } | null>(null);
  const [emotionalStateSet, setEmotionalStateSet] = useState(false);
  const outsideFocus =
    taskDomain &&
    strategyMapping &&
    taskDomain !== strategyMapping.primaryDomain &&
    !strategyMapping.secondaryDomains.includes(taskDomain);
  const energyMatchCategory = classifyEnergyMatch(energyMatchScore ?? undefined);
  const isLowSynergy = energyMatchCategory === "low";

  useEffect(() => {
    if (!open) return;
    getDailyState(date).then((d) => setDailyState(d as { emotional_state?: string | null } | null));
  }, [open, date]);

  const totalSeconds = minutes * 60;
  useEffect(() => {
    setSecondsLeft(totalSeconds);
  }, [minutes, open]);

  useEffect(() => {
    if (!open || !running || secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(t);
  }, [open, running, secondsLeft]);

  useEffect(() => {
    if (running && secondsLeft === 0) setRunning(false);
  }, [running, secondsLeft]);

  const handleComplete = useCallback(() => {
    setPending(true);
    completeTaskOffline(taskId).then((result) => {
      onComplete?.(result ?? undefined);
      router.refresh();
      onClose();
    }).finally(() => setPending(false));
  }, [taskId, completeTaskOffline, onComplete, router, onClose]);

  const handleSnooze = useCallback(() => {
    setPending(true);
    snoozeTask(taskId).then(() => {
      onSnooze?.();
      router.refresh();
      onClose();
    }).finally(() => setPending(false));
  }, [taskId, onSnooze, router, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="focus-modal-title"
    >
      <div className="modal-backdrop absolute inset-0" aria-hidden onClick={onClose} />
      <div
        className="modal-card relative w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-card-header">
          <div className="flex-1">
            <h2 id="focus-modal-title" className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
              Focus
            </h2>
            <p className="mt-0.5 text-sm text-[var(--text-muted)]">{taskTitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[var(--text-muted)] transition-colors hover:bg-[var(--accent-neutral)] hover:text-[var(--text-primary)]"
            aria-label="Close"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </header>

        <div className="modal-card-body">
          {!emotionalStateSet && dailyState && dailyState.emotional_state == null && !running ? (
            <div className="flex flex-col items-center gap-3 py-2">
              <p className="text-sm font-medium text-[var(--text-primary)]">Hoe voel je je nu?</p>
              <div className="flex flex-wrap justify-center gap-2">
                {EMOTIONAL_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setEmotionalStatePreStart(date, value).then(() => {
                        setEmotionalStateSet(true);
                        router.refresh();
                      });
                    }}
                    className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-surface)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--accent-focus)]/20 hover:border-[var(--accent-focus)]/50"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ) : !running ? (
            <div className="flex flex-col items-center gap-4">
              {outsideFocus && (
                <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-center text-sm text-amber-200">
                  Dit verlaagt je Alignment Score (missie buiten je focus).
                </p>
              )}
              {energyMatchCategory && (
                <p className={`rounded-xl border px-3 py-2 text-center text-sm ${
                  isLowSynergy
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                    : "border-[var(--card-border)] bg-[var(--bg-surface)] text-[var(--text-secondary)]"
                }`}>
                  Energy match:{" "}
                  <strong>
                    {energyMatchCategory === "high" ? "hoog" : energyMatchCategory === "ok" ? "ok" : "laag"}
                  </strong>
                  {isLowSynergy && (
                    <>
                      {" · "}Low synergy state · XP −25%, lagere kans op afronden.{" "}
                      <button
                        type="button"
                        onClick={handleSnooze}
                        disabled={pending}
                        className="underline decoration-dotted underline-offset-2"
                      >
                        Plan voor morgen
                      </button>
                      .
                    </>
                  )}
                </p>
              )}
              <label className="text-sm font-medium text-[var(--text-muted)]">Minutes</label>
              <input
                type="number"
                min={1}
                max={120}
                value={minutes}
                onChange={(e) => setMinutes(Math.max(1, Math.min(120, parseInt(e.target.value, 10) || 1)))}
                className="w-20 rounded-xl border border-[var(--card-border)] bg-[var(--bg-overlay)] px-4 py-3 text-center text-2xl font-semibold tabular-nums text-[var(--text-primary)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-4">
              <span className="font-mono text-5xl font-bold tabular-nums text-[var(--accent-focus)]" aria-live="polite">
                {formatTime(secondsLeft)}
              </span>
              <span className="text-sm text-[var(--text-muted)]">remaining</span>
            </div>
          )}
        </div>

        <footer className="modal-card-footer flex-wrap justify-center gap-2">
          {!running ? (
            <button
              type="button"
              onClick={() => {
                setRunning(true);
                startTaskWithHeavyCost(taskId);
              }}
              className="btn-primary rounded-xl px-6 py-3 text-base font-medium"
            >
              Start timer
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setRunning(false)}
              className="rounded-xl border border-[var(--card-border)] bg-transparent px-6 py-3 text-base font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--accent-neutral)]"
            >
              Pause
            </button>
          )}
          <button
            type="button"
            onClick={handleComplete}
            disabled={pending}
            className="rounded-xl border border-[var(--accent-energy)]/50 bg-[var(--accent-energy)]/10 px-6 py-3 text-base font-medium text-[var(--accent-energy)] transition-colors hover:bg-[var(--accent-energy)]/20 disabled:opacity-50"
          >
            Complete
          </button>
          <button
            type="button"
            onClick={handleSnooze}
            disabled={pending}
            className="rounded-xl border border-[var(--card-border)] bg-transparent px-6 py-3 text-base font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--accent-neutral)] disabled:opacity-50"
          >
            Snooze
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--card-border)] bg-transparent px-6 py-3 text-base font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--accent-neutral)]"
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}
