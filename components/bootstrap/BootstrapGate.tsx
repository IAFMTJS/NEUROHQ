"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { DailySnapshot } from "@/types/daily-snapshot";
import {
  loadDailySnapshot,
  isCurrentSnapshot,
  mergeSnapshotKeepBest,
} from "@/lib/daily-snapshot-storage";
import { getTodayKey } from "@/lib/daily-date";
import { BootstrapLoader } from "@/components/bootstrap/BootstrapLoader";
import { StoreHydrator } from "@/components/bootstrap/StoreHydrator";
import type { InitializeResult } from "@/lib/daily-initialize";
import { initializeDailySystem } from "@/lib/daily-initialize";

/** Next local 00:01 from `from` (rollover check for calendar-day snapshot). */
function msUntilNextLocal001(from: Date = new Date()): number {
  const next = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 0, 1, 0, 0);
  if (next.getTime() <= from.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next.getTime() - from.getTime();
}

type Props = {
  children: ReactNode;
};

const DailySnapshotContext = createContext<DailySnapshot | null>(null);

export function useDailySnapshot(): DailySnapshot | null {
  return useContext(DailySnapshotContext);
}

/**
 * Gate that ensures a DailySnapshot exists before rendering the dashboard shell.
 * A snapshot is reused for the whole local calendar day (see
 * `getSnapshotValidityDayKey` in `daily-date.ts`): invalid only after the next
 * 00:01. Visibility, a 00:01 timer, a light poll, and storage patch events
 * re-check so day rollover without reload still triggers full bootstrap.
 *
 * Not every route is included in the snapshot (only dashboard, tasks, xp, strategy,
 * learning, budget, analytics). Other pages (e.g. report, assistant) load on demand
 * without triggering a full bootstrap reload — we do not clear or invalidate the
 * snapshot when navigating to those routes.
 */
const SNAPSHOT_STALENESS_POLL_MS = 60_000;

export function BootstrapGate({ children }: Props) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [snapshot, setSnapshot] = useState<DailySnapshot | null>(null);
  const refreshInFlightRef = useRef(false);

  const tryHydrateFromStorage = useCallback(async (): Promise<{ hydrated: boolean; current: boolean }> => {
    const existing = await loadDailySnapshot();
    if (!existing) return { hydrated: false, current: false };

    // Important UX detail:
    // - After 00:01 the stored snapshot is considered "not current".
    // - If we block rendering and show the full loader, push-open UX becomes blank/spinner.
    // - Instead: render immediately from the last stored snapshot and refresh in the background.
    setSnapshot(existing);
    setReady(true);
    return { hydrated: true, current: isCurrentSnapshot(existing) };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const hydrate = await tryHydrateFromStorage();
      if (cancelled) return;
      // No stored snapshot => let <BootstrapLoader> handle the full initialization.
      if (!hydrate.hydrated) return;

      // Stored snapshot exists, but it's stale (not current) => refresh in the background.
      if (!hydrate.current && !refreshInFlightRef.current) {
        refreshInFlightRef.current = true;
        try {
          const result = await initializeDailySystem(undefined, {
            prefetchHref: (href) => router.prefetch(href),
          });
          if (cancelled) return;
          setSnapshot((prev) => {
            const today = getTodayKey();
            if (!prev || prev.date !== result.snapshot.date) return result.snapshot;
            return mergeSnapshotKeepBest(today, prev, result.snapshot);
          });
          setReady(true);
        } catch {
          // Best-effort: keep rendering from the stale snapshot until the next successful refresh.
        } finally {
          refreshInFlightRef.current = false;
        }
      }
    };

    void run();

    let rolloverId: number | undefined;
    const scheduleRolloverCheck = () => {
      if (cancelled) return;
      rolloverId = window.setTimeout(() => {
        void run();
        scheduleRolloverCheck();
      }, msUntilNextLocal001());
    };
    scheduleRolloverCheck();

    const onVisibility = () => {
      if (document.visibilityState === "visible") void run();
    };
    document.addEventListener("visibilitychange", onVisibility);
    const intervalId = window.setInterval(() => void run(), SNAPSHOT_STALENESS_POLL_MS);
    const onSnapshotPatched = () => void run();
    window.addEventListener("neurohq-daily-snapshot-updated", onSnapshotPatched);

    return () => {
      cancelled = true;
      if (rolloverId !== undefined) window.clearTimeout(rolloverId);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("neurohq-daily-snapshot-updated", onSnapshotPatched);
      window.clearInterval(intervalId);
    };
  }, [tryHydrateFromStorage]);

  const handleReady = useCallback((result: InitializeResult) => {
    setSnapshot(result.snapshot);
    setReady(true);
  }, []);

  if (!ready) {
    return <BootstrapLoader onReady={handleReady} />;
  }

  return (
    <DailySnapshotContext.Provider value={snapshot}>
      <StoreHydrator snapshot={snapshot}>{children}</StoreHydrator>
    </DailySnapshotContext.Provider>
  );
}


