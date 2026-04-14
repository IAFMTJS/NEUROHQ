"use client";

import { useEffect } from "react";
import { isNativeCapacitorRuntime, isSupabaseFirstMobileEnabled } from "@/lib/mobile/feature-flags";
import { applyNativeResolvedCssAssets } from "@/lib/mobile/native-css-assets";
import { warmNativeVisualAssetCache, warmNativeVisualAssetCacheCritical } from "@/lib/mobile/native-fs-cache";
import { flushOutboxQueue } from "@/lib/mobile/sync-engine";
import { publishSyncMetrics } from "@/lib/mobile/metrics";

export function MobileSyncBootstrap() {
  useEffect(() => {
    if (!isNativeCapacitorRuntime()) return;

    let raf1 = 0;
    let raf2 = 0;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        void import("@capacitor/splash-screen")
          .then(({ SplashScreen }) => SplashScreen.hide().catch(() => {}))
          .catch(() => {});
      });
    });

    const refreshCss = () => void applyNativeResolvedCssAssets().catch(() => {});
    refreshCss();

    const criticalTimer = window.setTimeout(() => {
      void warmNativeVisualAssetCacheCritical().then(refreshCss).catch(() => {});
    }, 350);

    const runFullWarm = () => void warmNativeVisualAssetCache().then(refreshCss).catch(() => {});
    let idleId: number | undefined;
    let fallbackTimer: number | undefined;
    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(runFullWarm, { timeout: 12_000 });
    } else {
      fallbackTimer = window.setTimeout(runFullWarm, 1_500);
    }

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      clearTimeout(criticalTimer);
      if (idleId != null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (fallbackTimer != null) clearTimeout(fallbackTimer);
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseFirstMobileEnabled()) return;
    let timer: ReturnType<typeof setInterval> | null = null;

    const run = () => {
      if (!navigator.onLine) return;
      if (document.visibilityState !== "visible") return;
      void flushOutboxQueue();
      void publishSyncMetrics();
    };
    const runOnVisible = () => {
      if (document.visibilityState !== "visible") return;
      run();
    };

    run();
    timer = setInterval(run, 120_000);
    window.addEventListener("online", run);
    document.addEventListener("visibilitychange", runOnVisible);

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
      document.removeEventListener("visibilitychange", runOnVisible);
      if (timer) clearInterval(timer);
      appListenerRemove?.();
    };
  }, []);

  return null;
}

