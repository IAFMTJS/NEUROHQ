"use client";

import { useState, useEffect, useCallback } from "react";
import { useAppState } from "@/components/providers/AppStateProvider";

const DEFAULT_MINUTES = 25;

export function FocusBlock() {
  const appState = useAppState();
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
    appState?.triggerFocus();
  }, [appState]);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setRemainingSeconds((r) => {
        if (r <= 1) {
          appState?.triggerIdle();
          setRunning(false);
        }
        return Math.max(0, r - 1);
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running, appState]);

  const pct = totalSeconds > 0 ? (remainingSeconds / totalSeconds) * 100 : 0;

  return (
    <section
      className="card-simple-accent p-5 hq-card rounded-[var(--hq-card-radius-sharp)] border border-[var(--accent-focus)]/20"
      aria-label="Focus block timer"
    >
      <h2 className="mb-3 hq-h2">Focus block</h2>
      <p className="mb-4 text-xs text-[var(--text-muted)]">Deep work timer. Pick a block and commit.</p>
      {!running ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-[var(--text-secondary)]">Start a block:</span>
          {[15, 25, 45].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => start(m)}
              className="btn-hq-primary rounded-[var(--hq-btn-radius)] px-4 py-2 text-sm font-medium"
            >
              {m} min
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="text-3xl font-mono font-semibold tabular-nums text-[var(--text-primary)]">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </p>
            <button
              type="button"
              onClick={() => { setRunning(false); appState?.triggerIdle(); }}
              className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-focus)] rounded px-2 py-1"
            >
              Stop
            </button>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--accent-neutral)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--accent-focus)] to-[var(--accent-energy)] transition-all duration-1000"
              style={{ width: `${pct}%` }}
            />
          </div>
        </>
      )}
    </section>
  );
}
