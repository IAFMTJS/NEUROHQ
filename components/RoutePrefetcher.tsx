"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BOOTSTRAP_PREFETCH_ROUTES } from "@/lib/bootstrap-prefetch-routes";
import { isAssistantEnabled } from "@/lib/feature-flags";

/**
 * Warms the App Router flight cache using the same route set as bootstrap `preloadPages`
 * (`lib/bootstrap-prefetch-routes.ts`). Needed when users skip the full loader (same-day cache hit).
 */
function shellRoutesToPrefetch(): string[] {
  return BOOTSTRAP_PREFETCH_ROUTES.filter(
    (path) => path !== "/assistant" || isAssistantEnabled()
  );
}

function canPrefetchOnConnection(): boolean {
  if (typeof navigator === "undefined") return true;
  const connection = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  }).connection as
    | { saveData?: boolean; effectiveType?: string }
    | undefined;
  if (!connection) return true;
  if (connection.saveData) return false;
  return connection.effectiveType !== "slow-2g" && connection.effectiveType !== "2g";
}

function runWhenIdle(fn: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  if ("requestIdleCallback" in window) {
    const id = window.requestIdleCallback(fn, { timeout: 500 });
    return () => window.cancelIdleCallback(id);
  }
  // Use global timers to avoid DOM lib inference edge-cases in certain TS configs.
  const t = globalThis.setTimeout(fn, 200);
  return () => globalThis.clearTimeout(t);
}

/**
 * Warms the App Router flight cache for all main shell routes so bottom-nav hops
 * stay fast (not only the 1–2 neighbors we used to prefetch after a 3s delay).
 */
export function RoutePrefetcher() {
  const router = useRouter();
  const pathname = usePathname();
  const normalized = pathname.replace(/\/$/, "") || "/";
  const prefetchedRoutesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!canPrefetchOnConnection()) return;

    // Prefetch in small batches to avoid overwhelming the main thread / network,
    // which can make navigation feel frozen on some devices.
    const targets = shellRoutesToPrefetch();
    let queue = targets.filter((route) => route !== normalized);
    let cancelled = false;
    const BATCH_SIZE = 2;

    const prefetchBatch = () => {
      if (cancelled) return;
      if (document.visibilityState !== "visible") return;

      let n = 0;
      while (queue.length && n < BATCH_SIZE) {
        const route = queue.shift()!;
        if (prefetchedRoutesRef.current.has(route)) continue;
        prefetchedRoutesRef.current.add(route);
        n += 1;
        try {
          router.prefetch(route);
        } catch {
          prefetchedRoutesRef.current.delete(route);
        }
      }

      if (queue.length) {
        // Continue warming the cache in later idle slots.
        runWhenIdle(prefetchBatch);
      }
    };

    const cancel = runWhenIdle(prefetchBatch);

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        runWhenIdle(prefetchBatch);
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      cancel();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [normalized, router]);

  return null;
}
