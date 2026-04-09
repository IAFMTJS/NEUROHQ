"use client";

import { useEffect, useState } from "react";
import { flushOutboxQueue } from "@/lib/mobile/sync-engine";
import { isSupabaseFirstMobileEnabled } from "@/lib/mobile/feature-flags";
import { getDashboardPayloadLocalFirst } from "@/lib/data/dashboard-repository";
import { publishSyncMetrics } from "@/lib/mobile/metrics";
import { syncPendingDailyStateNow } from "@/lib/client-pending-writes";

export function ServiceWorkerRegistration() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const isAuthenticatedWarmupRoute = () => {
      const p = window.location.pathname.replace(/\/$/, "") || "/";
      return (
        p === "/dashboard" ||
        p === "/tasks" ||
        p === "/budget" ||
        p === "/strategy" ||
        p === "/analytics" ||
        p === "/report" ||
        p === "/settings" ||
        p === "/profile" ||
        p === "/help" ||
        p === "/assistant" ||
        p.startsWith("/learning")
      );
    };

    const postWarmupAndSync = (reg: ServiceWorkerRegistration) => {
      const includeAuth = isAuthenticatedWarmupRoute();
      const today = new Date().toISOString().slice(0, 10);
      reg.active?.postMessage({ type: "WARMUP_BACKGROUND_CACHE", includeAuth, today });
      if (navigator.onLine) {
        reg.active?.postMessage({ type: "SYNC_OFFLINE_QUEUE" });
        void syncPendingDailyStateNow();
      }
    };

    /** iOS WebKit often suspends the SW; nudge cache refresh when the PWA returns to foreground. */
    let lastForegroundWarmup = 0;
    let lastHiddenAt = 0;
    const FOREGROUND_WARMUP_MIN_MS = 90_000;
    /** After screen lock / background, refresh sooner than the generic throttle. */
    const FOREGROUND_WARMUP_AFTER_BACKGROUND_MS = 8_000;

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        lastHiddenAt = Date.now();
        return;
      }
      const now = Date.now();
      const awayMs = lastHiddenAt ? now - lastHiddenAt : 0;
      lastHiddenAt = 0;
      const bypassThrottle = awayMs >= FOREGROUND_WARMUP_AFTER_BACKGROUND_MS;
      if (!bypassThrottle && now - lastForegroundWarmup < FOREGROUND_WARMUP_MIN_MS) return;
      lastForegroundWarmup = now;
      navigator.serviceWorker.ready.then(postWarmupAndSync).catch(() => {});
    };

    const hardReloadToLatest = () => {
      const url = new URL(window.location.href);
      url.searchParams.set("__swv", String(Date.now()));
      window.location.replace(url.toString());
    };

    const onControllerChange = () => hardReloadToLatest();
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    const syncOfflineQueueWhenOnline = () => {
      if (!navigator.onLine) return;
      if (isSupabaseFirstMobileEnabled()) {
        void flushOutboxQueue();
        void publishSyncMetrics();
      }
      void syncPendingDailyStateNow();
      navigator.serviceWorker.ready.then((reg) => reg.active?.postMessage({ type: "SYNC_OFFLINE_QUEUE" }));
    };
    window.addEventListener("online", syncOfflineQueueWhenOnline);
    document.addEventListener("visibilitychange", onVisibilityChange);

    let intervalId: ReturnType<typeof setInterval> | undefined;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        if (isSupabaseFirstMobileEnabled()) {
          // Warm dashboard cache for faster post-resume paints in mobile/PWA.
          void getDashboardPayloadLocalFirst({ preferCache: true }).catch(() => {});
          void flushOutboxQueue();
          void publishSyncMetrics(true);
        }
        navigator.serviceWorker.ready
          .then((readyRegistration) => {
            postWarmupAndSync(readyRegistration);
          })
          .catch(() => {});

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              setWaitingWorker(registration.waiting ?? newWorker);
              setUpdateAvailable(true);
            }
          });
        });
        if (registration.waiting && navigator.serviceWorker.controller) {
          setWaitingWorker(registration.waiting);
          setUpdateAvailable(true);
        }
        intervalId = setInterval(() => {
          registration.update().catch(() => {
            // Registration may have been unregistered (e.g. user cleared site data). Stop polling.
            if (intervalId !== undefined) clearInterval(intervalId);
          });
        }, 60 * 60 * 1000);
      })
      .catch((err) => console.error("Service Worker registration failed:", err));
    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      window.removeEventListener("online", syncOfflineQueueWhenOnline);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (intervalId !== undefined) clearInterval(intervalId);
    };
  }, []);

  const hardReloadToLatest = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("__swv", String(Date.now()));
    window.location.replace(url.toString());
  };

  const handleRefresh = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
      setUpdateAvailable(false);
      setWaitingWorker(null);
      return;
    }
    // Fallback: if no waiting worker is attached, still force a cache-busting reload.
    hardReloadToLatest();
  };

  if (!updateAvailable) return null;
  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-[200] flex items-center justify-between gap-3 rounded-xl border border-[var(--accent-focus)]/40 bg-[var(--bg-surface)] px-4 py-3 shadow-lg toast"
      role="alert"
    >
      <span className="text-sm font-medium text-[var(--text-primary)]">Nieuwe versie beschikbaar</span>
      <button
        type="button"
        onClick={handleRefresh}
        className="shrink-0 rounded-lg bg-[var(--accent-focus)] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
      >
        Vernieuwen
      </button>
    </div>
  );
}
