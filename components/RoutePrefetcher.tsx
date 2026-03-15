"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isAssistantEnabled } from "@/lib/feature-flags";

const NEXT_ROUTE_CANDIDATES: Record<string, string[]> = {
  "/dashboard": ["/tasks", "/assistant"],
  "/tasks": ["/dashboard", "/assistant"],
  "/assistant": ["/tasks", "/dashboard"],
  "/budget": ["/dashboard"],
  "/learning": ["/dashboard"],
  "/strategy": ["/dashboard"],
  "/settings": ["/dashboard"],
  "/xp": ["/dashboard"],
};

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

/**
 * Prefetches critical routes when idle to improve navigation performance
 */
export function RoutePrefetcher() {
  const router = useRouter();
  const pathname = usePathname();
  const prefetchedRoutesRef = useRef<Set<string>>(new Set());
  const routesToPrefetch = useMemo(() => {
    const candidates = NEXT_ROUTE_CANDIDATES[pathname] ?? [];
    return candidates.filter(
      (route) => route !== pathname && (route !== "/assistant" || isAssistantEnabled())
    );
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.visibilityState !== "visible") return;
    if (!canPrefetchOnConnection()) return;
    if (routesToPrefetch.length === 0) return;

    const prefetchOnIdle = () => {
      if ("requestIdleCallback" in window) {
        requestIdleCallback(
          () => {
            routesToPrefetch.forEach((route) => {
              if (prefetchedRoutesRef.current.has(route)) return;
              prefetchedRoutesRef.current.add(route);
              router.prefetch(route);
            });
          },
          { timeout: 2000 }
        );
      } else {
        setTimeout(() => {
          routesToPrefetch.forEach((route) => {
            if (prefetchedRoutesRef.current.has(route)) return;
            prefetchedRoutesRef.current.add(route);
            router.prefetch(route);
          });
        }, 2000);
      }
    };

    const timeout = setTimeout(prefetchOnIdle, 3000);

    return () => clearTimeout(timeout);
  }, [pathname, router, routesToPrefetch]);

  return null;
}
