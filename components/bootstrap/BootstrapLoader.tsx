"use client";

import { useEffect, useState } from "react";
import type { DailySnapshot } from "@/types/daily-snapshot";
import {
  initializeDailySystem,
  type PreloadProgress,
  type InitializeResult,
} from "@/lib/daily-initialize";
import hudStyles from "@/components/hud-test/hud.module.css";

type Props = {
  onReady: (result: InitializeResult) => void;
};

const STEP_COPY: Record<string, string> = {
  fetchDashboard: "Loading command center...",
  fetchMissions: "Loading missions engine...",
  fetchXP: "Loading XP and streak...",
  fetchStrategy: "Loading strategy focus...",
  fetchLearning: "Loading growth systems...",
  fetchBudget: "Loading budget & goals...",
  fetchAnalytics: "Loading analytics & insights...",
  preloadPages: "Loading modules...",
  preloadAssets: "Loading visuals...",
  prepareCache: "Optimizing memory...",
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

  const pct =
    progress && progress.totalSteps > 0
      ? Math.round((progress.completedSteps / progress.totalSteps) * 100)
      : kind === "fromCache"
      ? 100
      : 0;

  const stepLabel =
    progress && STEP_COPY[progress.step]
      ? STEP_COPY[progress.step]
      : kind === "fromCache"
      ? "Restoring today’s state..."
      : "Initializing systems...";

  return (
    <main
      className={`relative min-h-screen overflow-hidden ${hudStyles.cinematicBackdrop}`}
      aria-busy="true"
      aria-label="Initializing NEUROHQ"
    >
      <div className={hudStyles.spaceMist} aria-hidden />
      <div className={hudStyles.starLayerFar} aria-hidden />
      <div className={hudStyles.starLayerNear} aria-hidden />
      <div className={hudStyles.backgroundAtmosphere} aria-hidden />
      <div className={hudStyles.colorBlend} aria-hidden />
      <div className={hudStyles.spaceNoise} aria-hidden />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <section className="w-full max-w-md rounded-2xl border border-[var(--card-border)] bg-[var(--bg-surface)]/80 px-6 py-5 shadow-xl backdrop-blur">
          <h1 className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--text-muted)]">
            Initializing System
          </h1>
          <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
            {stepLabel} {pct > 0 ? `${pct}%` : null}
          </p>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10" aria-hidden>
            <div
              className="h-full rounded-full bg-[var(--accent-focus)] transition-[width] duration-200 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          {snapshot && (
            <p className="mt-3 text-xs text-[var(--text-muted)]">
              Today: <span className="font-mono text-[var(--text-secondary)]">{snapshot.date}</span>
            </p>
          )}
          {error && (
            <p className="mt-3 text-xs text-amber-300">
              {error}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

