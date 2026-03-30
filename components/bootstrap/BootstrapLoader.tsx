"use client";

import { useEffect, useState } from "react";
import type { DailySnapshot } from "@/types/daily-snapshot";
import {
  DAILY_BOOTSTRAP_STEPS,
  initializeDailySystem,
  type PreloadProgress,
  type PreloadStepId,
  type InitializeResult,
} from "@/lib/daily-initialize";
type Props = {
  onReady: (result: InitializeResult) => void;
};

const STEP_COPY: Record<PreloadStepId, string> = {
  fetchDashboard: "Command center & overview",
  fetchMissions: "Missions, tasks, budget & growth (today)",
  fetchXP: "XP, streak & forecasts",
  fetchStrategy: "Strategy focus",
  fetchAnalytics: "Analytics & insights",
  fetchSettings: "Preferences & account",
  preloadPages: "App routes & modules",
  preloadAssets: "Visuals & mascots",
  prepareCache: "Finalizing local cache",
};

export function BootstrapLoader({ onReady }: Props) {
  const [snapshot, setSnapshot] = useState<DailySnapshot | null>(null);
  const [kind, setKind] = useState<InitializeResult["kind"] | null>(null);
  const [progress, setProgress] = useState<PreloadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const result = await initializeDailySystem((p) => {
          if (!cancelled) setProgress(p);
        });
        if (cancelled) return;
        setSnapshot(result.snapshot);
        setKind(result.kind);
        onReady(result);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to initialize system");
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [onReady]);

  const total = DAILY_BOOTSTRAP_STEPS.length;
  const pct =
    progress && progress.totalSteps > 0
      ? Math.min(
          100,
          Math.round(
            ((progress.completedSteps + (progress.phase === "start" ? 0.35 : 0)) /
              progress.totalSteps) *
              100
          )
        )
      : kind === "fromCache"
      ? 100
      : 0;

  const activeLabel =
    progress && STEP_COPY[progress.step]
      ? STEP_COPY[progress.step]
      : kind === "fromCache"
      ? "Restoring today’s state..."
      : "Initializing systems...";

  const detailLine =
    progress != null
      ? progress.phase === "start"
        ? `Running: ${STEP_COPY[progress.step] ?? progress.step}…`
        : `Done: ${STEP_COPY[progress.step] ?? progress.step}`
      : null;

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-transparent"
      aria-busy="true"
      aria-label="Initializing NEUROHQ"
    >
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <section className="w-full max-w-md rounded-2xl border border-[var(--card-border)] bg-[var(--bg-surface)]/80 px-6 py-5 shadow-xl backdrop-blur">
          <h1 className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--text-muted)]">
            Initializing System
          </h1>
          <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
            {activeLabel}
          </p>
          {progress != null && (
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              {progress.phase === "start"
                ? `Working on step ${progress.stepIndex + 1} of ${total}`
                : `Completed ${progress.completedSteps} of ${total} steps`}
              {" · "}
              {pct}%
            </p>
          )}
          {detailLine && (
            <p className="mt-1 font-mono text-[10px] leading-relaxed text-[var(--text-muted)]">
              {detailLine}
            </p>
          )}
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10" aria-hidden>
            <div
              className="h-full rounded-full bg-[var(--accent-focus)] transition-[width] duration-200 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>

          {progress != null && (
            <ol className="mt-4 max-h-40 space-y-1 overflow-y-auto text-left text-[11px] text-[var(--text-muted)]">
              {DAILY_BOOTSTRAP_STEPS.map((stepId, idx) => {
                const done = idx < progress.completedSteps;
                const current = idx === progress.stepIndex && progress.phase === "start";
                return (
                  <li
                    key={stepId}
                    className={
                      done
                        ? "text-[var(--text-secondary)]"
                        : current
                        ? "font-medium text-[var(--accent-focus)]"
                        : "opacity-50"
                    }
                  >
                    <span aria-hidden>{done ? "✓ " : current ? "◆ " : "○ "}</span>
                    {STEP_COPY[stepId]}
                  </li>
                );
              })}
            </ol>
          )}

          {snapshot && (
            <p className="mt-3 text-xs text-[var(--text-muted)]">
              Today: <span className="font-mono text-[var(--text-secondary)]">{snapshot.date}</span>
            </p>
          )}
          {error && <p className="mt-3 text-xs text-amber-300">{error}</p>}
        </section>
      </div>
    </main>
  );
}
