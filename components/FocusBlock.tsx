"use client";

import { useState, useEffect, useCallback } from "react";

const DEFAULT_MINUTES = 25;

export function FocusBlock() {
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(DEFAULT_MINUTES * 60);
  const [running, setRunning] = useState(false);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  const start = useCallback((mins: number) => {
    const total = mins * 60;
    setTotalSeconds(total);
    setRemainingSeconds(total);
    setRunning(true);
  }, []);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setRemainingSeconds((r) => {
        if (r <= 1) setRunning(false);
        return Math.max(0, r - 1);
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running]);

  const pct = totalSeconds > 0 ? (remainingSeconds / totalSeconds) * 100 : 0;

  return (
    <section
      className="card-modern-accent p-5"
      aria-label="Focus block timer"
    >
      <h2 className="mb-3 text-sm font-semibold text-neuro-silver">Focus block</h2>
      {!running ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-neutral-400">Start a block:</span>
          {[15, 25, 45].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => start(m)}
              className="btn-primary rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neuro-blue focus:ring-offset-2 focus:ring-offset-neuro-dark"
            >
              {m} min
            </button>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4">
          <p className="text-3xl font-mono font-semibold tabular-nums text-neuro-silver">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </p>
          <button
            type="button"
            onClick={() => setRunning(false)}
            className="text-sm text-neutral-400 hover:text-neuro-silver focus:outline-none focus:underline"
          >
            Stop
          </button>
        </div>
      )}
      {running && (
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-neutral-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-neuro-blue to-neuro-blue-light transition-all duration-1000"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </section>
  );
}
