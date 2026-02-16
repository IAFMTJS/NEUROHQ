"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { completeTask, snoozeTask } from "@/app/actions/tasks";

const DEFAULT_MINUTES = 25;

type Props = {
  open: boolean;
  onClose: () => void;
  taskId: string;
  taskTitle: string;
  onComplete?: () => void;
  onSnooze?: () => void;
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function FocusModal({ open, onClose, taskId, taskTitle, onComplete, onSnooze }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [minutes, setMinutes] = useState(DEFAULT_MINUTES);
  const [secondsLeft, setSecondsLeft] = useState(minutes * 60);
  const [running, setRunning] = useState(false);

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
    completeTask(taskId).then(() => {
      onComplete?.();
      router.refresh();
      onClose();
    }).finally(() => setPending(false));
  }, [taskId, onComplete, router, onClose]);

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
          {!running ? (
            <div className="flex flex-col items-center gap-4">
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
              onClick={() => setRunning(true)}
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
