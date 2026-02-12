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
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[var(--bg-primary)] p-6" role="dialog" aria-modal="true" aria-labelledby="focus-title">
      <h1 id="focus-title" className="mb-2 text-center text-lg font-semibold text-neuro-silver">Focus</h1>
      <p className="mb-6 max-w-sm text-center text-sm text-neuro-muted">{taskTitle}</p>
      {!running ? (
        <div className="mb-6 flex items-center gap-2">
          <label className="text-sm text-neuro-muted">Minutes</label>
          <input
            type="number"
            min={1}
            max={120}
            value={minutes}
            onChange={(e) => setMinutes(Math.max(1, Math.min(120, parseInt(e.target.value, 10) || 1)))}
            className="w-16 rounded-lg border border-neuro-border bg-neuro-dark px-3 py-2 text-center text-neuro-silver"
          />
        </div>
      ) : (
        <p className="mb-6 font-mono text-4xl font-bold tabular-nums text-neuro-blue">{formatTime(secondsLeft)}</p>
      )}
      <div className="flex flex-wrap justify-center gap-3">
        {!running ? (
          <button type="button" onClick={() => setRunning(true)} className="btn-primary rounded-lg px-6 py-3 text-base font-medium">Start timer</button>
        ) : (
          <button type="button" onClick={() => setRunning(false)} className="rounded-lg border border-neuro-border px-6 py-3 text-base font-medium text-neuro-silver hover:bg-neuro-surface">Pause</button>
        )}
        <button type="button" onClick={handleComplete} disabled={pending} className="rounded-lg border border-green-500/50 px-6 py-3 text-base font-medium text-green-400 hover:bg-green-500/10 disabled:opacity-50">Complete</button>
        <button type="button" onClick={handleSnooze} disabled={pending} className="rounded-lg border border-neuro-border px-6 py-3 text-base font-medium text-neuro-silver hover:bg-neuro-surface disabled:opacity-50">Snooze</button>
        <button type="button" onClick={onClose} className="rounded-lg border border-neuro-border px-6 py-3 text-base font-medium text-neuro-muted hover:bg-neuro-surface">Close</button>
      </div>
    </div>
  );
}
