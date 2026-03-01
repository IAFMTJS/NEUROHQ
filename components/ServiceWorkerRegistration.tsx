"use client";

import { useEffect, useState } from "react";

export function ServiceWorkerRegistration() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    const isProduction = process.env.NODE_ENV === "production";

    // In dev, a previously installed SW can serve stale HTML and cause hydration mismatches.
    // Force cleanup so `next dev` always reflects current server/client bundles.
    if (!isProduction) {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
        .catch(() => {
          // Ignore cleanup errors in development.
        });
      if ("caches" in window) {
        caches
          .keys()
          .then((keys) =>
            Promise.all(
              keys
                .filter((key) => key.startsWith("neurohq-"))
                .map((key) => caches.delete(key))
            )
          )
          .catch(() => {
            // Ignore cleanup errors in development.
          });
      }
      return;
    }

    const onControllerChange = () => window.location.reload();
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    const syncOfflineQueueWhenOnline = () => {
      if (!navigator.onLine) return;
      navigator.serviceWorker.ready.then((reg) => reg.active?.postMessage({ type: "SYNC_OFFLINE_QUEUE" }));
    };
    window.addEventListener("online", syncOfflineQueueWhenOnline);

    let intervalId: ReturnType<typeof setInterval> | undefined;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        navigator.serviceWorker.ready
          .then((readyRegistration) => {
            readyRegistration.active?.postMessage({ type: "WARMUP_BACKGROUND_CACHE" });
            if (navigator.onLine) {
              readyRegistration.active?.postMessage({ type: "SYNC_OFFLINE_QUEUE" });
            }
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
        intervalId = setInterval(() => registration.update(), 60 * 60 * 1000);
      })
      .catch((err) => console.error("Service Worker registration failed:", err));
    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      window.removeEventListener("online", syncOfflineQueueWhenOnline);
      if (intervalId !== undefined) clearInterval(intervalId);
    };
  }, []);

  const handleRefresh = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
      setUpdateAvailable(false);
      setWaitingWorker(null);
    }
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
