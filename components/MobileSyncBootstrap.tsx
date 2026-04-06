"use client";

import { useEffect } from "react";
import { flushOutboxQueue } from "@/lib/mobile/sync-engine";
import { isSupabaseFirstMobileEnabled } from "@/lib/mobile/feature-flags";
import { publishSyncMetrics } from "@/lib/mobile/metrics";

export function MobileSyncBootstrap() {
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
    return () => {
      window.removeEventListener("online", run);
      document.removeEventListener("visibilitychange", run);
      if (timer) clearInterval(timer);
    };
  }, []);

  return null;
}

