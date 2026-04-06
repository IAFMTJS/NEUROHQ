"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { getSnapshotValidityDayKey } from "@/lib/daily-date";
import { initializeDailySystem } from "@/lib/daily-initialize";
import { persistDailyInitResult, readPersistedDailyInit } from "@/lib/daily-init-persist";

function nextPackageRunDelayMs(now: Date): number {
  const next = new Date(now);
  next.setHours(0, 1, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return Math.max(1_000, next.getTime() - now.getTime());
}

async function resolveSignedInUserId(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.user?.id) return session.user.id;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * Builds and persists a full daily package once per validity day (00:01 boundary),
 * so cold starts can restore from device data while sync still runs in background.
 */
export function DailyDataPackageScheduler() {
  const runningRef = useRef(false);
  const cachedDayPerUserRef = useRef<string | null>(null);
  const lastSeenValidityDayRef = useRef<string>(getSnapshotValidityDayKey());

  useEffect(() => {
    let disposed = false;
    let nextRunTimeout: ReturnType<typeof setTimeout> | null = null;

    const ensureDailyPackage = async (force = false) => {
      if (disposed || runningRef.current) return;
      if (typeof navigator !== "undefined" && !navigator.onLine) return;
      runningRef.current = true;
      try {
        const userId = await resolveSignedInUserId();
        if (!userId) return;
        const dayKey = getSnapshotValidityDayKey();
        const cacheMarker = `${userId}:${dayKey}`;
        if (!force && cachedDayPerUserRef.current === cacheMarker) return;
        if (!force) {
          const existing = await readPersistedDailyInit(userId, dayKey);
          if (existing) {
            cachedDayPerUserRef.current = cacheMarker;
            return;
          }
        }
        const result = await initializeDailySystem();
        if (disposed) return;
        await persistDailyInitResult(userId, result);
        cachedDayPerUserRef.current = cacheMarker;
      } catch (err) {
        console.warn("[daily-package] failed to build package", err);
      } finally {
        runningRef.current = false;
      }
    };

    const scheduleNext = () => {
      if (disposed) return;
      const delay = nextPackageRunDelayMs(new Date());
      if (nextRunTimeout) clearTimeout(nextRunTimeout);
      nextRunTimeout = setTimeout(() => {
        void ensureDailyPackage(true).finally(scheduleNext);
      }, delay);
    };

    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      const currentDay = getSnapshotValidityDayKey();
      const dayChanged = currentDay !== lastSeenValidityDayRef.current;
      lastSeenValidityDayRef.current = currentDay;
      void ensureDailyPackage(dayChanged);
    };

    const onOnline = () => {
      void ensureDailyPackage(false);
    };

    void ensureDailyPackage(false);
    scheduleNext();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", onOnline);

    return () => {
      disposed = true;
      if (nextRunTimeout) clearTimeout(nextRunTimeout);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  return null;
}

