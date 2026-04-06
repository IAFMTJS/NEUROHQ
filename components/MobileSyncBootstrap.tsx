"use client";

import { useEffect } from "react";
import { isNativeCapacitorRuntime, isSupabaseFirstMobileEnabled } from "@/lib/mobile/feature-flags";
import { warmNativeVisualAssetCache } from "@/lib/mobile/native-fs-cache";
import { flushOutboxQueue } from "@/lib/mobile/sync-engine";
import { publishSyncMetrics } from "@/lib/mobile/metrics";

export function MobileSyncBootstrap() {
  useEffect(() => {
    if (!isNativeCapacitorRuntime()) return;
    const runWarm = () => void warmNativeVisualAssetCache().catch(() => {});
    let idleId: number | undefined;
    let timeoutId: number | undefined;
    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(runWarm, { timeout: 12_000 });
    } else {
      timeoutId = window.setTimeout(runWarm, 1_500);
    }
    return () => {
      if (idleId != null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId != null) clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseFirstMobileEnabled()) return;
    let timer: ReturnType<typeof setInterval> | null = null;

    const run = () => {
      if (!navigator.onLine) return;
      void flushOutboxQueue();
      void publishSyncMetrics();
    };

    run();
    timer = setInterval(run, 60_000);
    window.addEventListener("online", run);
    document.addEventListener("visibilitychange", run);

    let appListenerRemove: (() => void) | undefined;
    if (isNativeCapacitorRuntime()) {
      void import("@capacitor/app")
        .then(({ App }) =>
          App.addListener("appStateChange", ({ isActive }) => {
            if (isActive) run();
          })
        )
        .then((handle) => {
          appListenerRemove = () => {
            void handle.remove();
          };
        })
        .catch(() => {});
    }

    return () => {
      window.removeEventListener("online", run);
      document.removeEventListener("visibilitychange", run);
      if (timer) clearInterval(timer);
      appListenerRemove?.();
    };
  }, []);

  return null;
}

