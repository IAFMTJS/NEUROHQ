"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isAssistantEnabled } from "@/lib/feature-flags";

/**
 * Bottom-nav destinations (keep aligned with `lib/navigation/bottom-nav-links.tsx`).
 * `router.prefetch` fills Next.js’s client RSC cache; raw `fetch("/tasks")` from the
 * daily bootstrap does not, so tab switches were often cold after the first hop.
 */
const SHELL_ROUTES = [
  "/tasks",
  "/budget",
  "/learning",
  "/dashboard",
  "/strategy",
  "/profile",
  "/settings",
] as const;

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
  const t = window.setTimeout(fn, 200);
  return () => window.clearTimeout(t);
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

    const prefetchAll = () => {
      if (document.visibilityState !== "visible") return;

      const targets: string[] = [...SHELL_ROUTES];
      if (isAssistantEnabled()) targets.push("/assistant");

      for (const route of targets) {
        if (route === normalized) continue;
        if (prefetchedRoutesRef.current.has(route)) continue;
        prefetchedRoutesRef.current.add(route);
        try {
          router.prefetch(route);
        } catch {
          prefetchedRoutesRef.current.delete(route);
        }
      }
    };

    const cancel = runWhenIdle(prefetchAll);

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        runWhenIdle(prefetchAll);
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancel();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [normalized, router]);

  return null;
}
