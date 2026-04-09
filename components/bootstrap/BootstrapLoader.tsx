"use client";

import { startTransition, useEffect, useState } from "react";
import type { DailySnapshot } from "@/types/daily-snapshot";
import { createClient } from "@/lib/supabase/client";
import { getSnapshotValidityDayKey } from "@/lib/daily-date";
import { persistDailyInitResult, readPersistedDailyInit } from "@/lib/daily-init-persist";
import {
  DAILY_BOOTSTRAP_STEPS,
  initializeDailySystem,
  type PreloadProgress,
  type PreloadStepId,
  type InitializeResult,
} from "@/lib/daily-initialize";
import { requestDurableStorage } from "@/lib/storage-persist";
import { LoadingMascotHero } from "@/components/loading/LoadingMascotHero";

type Props = {
  onReady: (result: InitializeResult) => void;
};

function isStandaloneDisplayMode(): boolean {
  if (typeof window === "undefined") return false;
  return (
    (window.matchMedia?.("(display-mode: standalone)")?.matches ?? false) ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** True if Supabase likely has a persisted session (localStorage not readable yet on cold start). */
function likelyHasStoredSupabaseSession(): boolean {
  try {
    if (typeof localStorage === "undefined") return false;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("sb-") && k.endsWith("-auth-token")) return true;
    }
  } catch {
    return false;
  }
  return false;
}

/**
 * iOS PWA cold start: Supabase session from storage often arrives a few hundred ms after JS runs.
 * If we only call getUser() once, we skip IndexedDB replay and refetch everything every launch.
 */
async function resolveSessionUserIdForBootstrap(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { session: first },
  } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
  if (first?.user?.id) return first.user.id;

  const maxWaitMs =
    isStandaloneDisplayMode() && likelyHasStoredSupabaseSession()
      ? 2400
      : likelyHasStoredSupabaseSession()
        ? 1200
        : 0;
  if (maxWaitMs > 0) {
    requestDurableStorage();
    const deadline = Date.now() + maxWaitMs;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 70));
      const {
        data: { session },
      } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
      if (session?.user?.id) return session.user.id;
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
  return user?.id ?? null;
}

const STEP_COPY: Record<PreloadStepId, string> = {
  fetchMissions: "Dashboard, missions, budget & growth (today)",
  fetchXP: "XP, streak & forecasts",
  fetchStrategy: "Strategy focus",
  fetchAnalytics: "Analytics & insights",
  fetchSettings: "Preferences & account",
};

export function BootstrapLoader({ onReady }: Props) {
  const [snapshot, setSnapshot] = useState<DailySnapshot | null>(null);
  const [progress, setProgress] = useState<PreloadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const dayKey = getSnapshotValidityDayKey();
        let userId = await resolveSessionUserIdForBootstrap();

        // Align SSR cookies with client storage before any `/api/*` call (PWA / slow storage often races otherwise).
        if (!cancelled && (isStandaloneDisplayMode() || likelyHasStoredSupabaseSession())) {
          const supabase = createClient();
          await supabase.auth.refreshSession().catch(() => {});
          if (!userId) {
            const {
              data: { session },
            } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
            userId = session?.user?.id ?? null;
          }
          await new Promise((r) => setTimeout(r, 80));
        }

        if (userId && !cancelled) {
          requestDurableStorage();
          const cached = await readPersistedDailyInit(userId, dayKey);
          if (cached) {
            setSnapshot(cached.snapshot);
            onReady(cached);
            return;
          }
        }

        let result = await initializeDailySystem((p) => {
          if (!cancelled) startTransition(() => setProgress(p));
        });
        if (cancelled) return;

        const persistUserId = userId;
        if (persistUserId) {
          await persistDailyInitResult(persistUserId, result).catch(() => {});
        }
        setSnapshot(result.snapshot);
        onReady(result);
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "";
        const maybeRecoverable =
          msg.includes("sessie") ||
          msg.includes("bootstrap") ||
          msg.includes("geldige bootstrap-response");
        if (maybeRecoverable) {
          try {
            const supabase = createClient();
            await supabase.auth.refreshSession().catch(() => {});
            await new Promise((r) => setTimeout(r, 450));
            const result = await initializeDailySystem((p) => {
              if (!cancelled) startTransition(() => setProgress(p));
            });
            if (cancelled) return;
            const {
              data: { session },
            } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
            const uid = session?.user?.id ?? null;
            if (uid) {
              await persistDailyInitResult(uid, result).catch(() => {});
            }
            setSnapshot(result.snapshot);
            onReady(result);
            return;
          } catch {
            /* show original error */
          }
        }
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
      : 0;

  const activeLabel =
    progress && STEP_COPY[progress.step]
      ? STEP_COPY[progress.step]
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
        <section className="w-full max-w-xl rounded-2xl border border-violet-300/30 bg-[linear-gradient(160deg,rgba(35,20,73,0.78),rgba(14,20,52,0.78))] px-6 py-5 shadow-[0_16px_60px_rgba(18,8,40,0.55)] backdrop-blur">
          <LoadingMascotHero className="mb-2" variant="page" />
          <div className="mb-4">
            <h1 className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-100/85">
              Initializing System
            </h1>
            <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-violet-200/65">
              Bootstrap + Snapshot
            </p>
          </div>
          <p className="mt-2 text-sm font-semibold text-violet-50">
            {activeLabel}
          </p>
          {progress != null && (
            <p className="mt-1 text-xs text-cyan-100/80">
              {progress.phase === "start"
                ? `Working on step ${progress.stepIndex + 1} of ${total}`
                : `Completed ${progress.completedSteps} of ${total} steps`}
              {" · "}
              {pct}%
            </p>
          )}
          {detailLine && (
            <p className="mt-1 rounded-md border border-violet-300/20 bg-black/20 px-2 py-1 font-mono text-[10px] leading-relaxed text-violet-100/70">
              {detailLine}
            </p>
          )}
          <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full border border-violet-200/20 bg-violet-950/45" aria-hidden>
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,rgba(34,211,238,0.95),rgba(129,140,248,0.95),rgba(192,132,252,0.95))] shadow-[0_0_18px_rgba(129,140,248,0.65)] transition-[width] duration-200 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>

          {progress != null && (
            <ol className="mt-4 max-h-40 space-y-1 overflow-y-auto text-left text-[11px] text-violet-100/65">
              {DAILY_BOOTSTRAP_STEPS.map((stepId, idx) => {
                const done = idx < progress.completedSteps;
                const current = idx === progress.stepIndex && progress.phase === "start";
                return (
                  <li
                    key={stepId}
                    className={
                      done
                        ? "rounded-md border border-emerald-300/20 bg-emerald-500/10 px-2 py-1 text-emerald-100/80"
                        : current
                        ? "rounded-md border border-cyan-200/30 bg-cyan-400/10 px-2 py-1 font-medium text-cyan-100"
                        : "rounded-md border border-transparent px-2 py-1 opacity-55"
                    }
                  >
                    <span aria-hidden>{done ? "✓ " : current ? "◉ " : "○ "}</span>
                    {STEP_COPY[stepId]}
                  </li>
                );
              })}
            </ol>
          )}

          {snapshot && (
            <p className="mt-3 text-xs text-violet-100/70">
              Today: <span className="font-mono text-cyan-100/90">{snapshot.date}</span>
            </p>
          )}
          {error && <p className="mt-3 text-xs text-amber-300">{error}</p>}
        </section>
      </div>
    </main>
  );
}
