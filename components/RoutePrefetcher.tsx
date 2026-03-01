"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Prefetches critical routes when idle to improve navigation performance
 */
export function RoutePrefetcher() {
  const router = useRouter();

  useEffect(() => {
    // Only prefetch on client, when idle
    if (typeof window === "undefined") return;

    // Exclude /report so first load only hits dashboard; report loads when user navigates.
    const prefetchRoutes = [
      "/dashboard",
      "/tasks",
      "/assistant",
      "/budget",
      "/learning",
      "/strategy",
      "/settings",
    ];

    // Use requestIdleCallback for background prefetching
    const prefetchOnIdle = () => {
      if ("requestIdleCallback" in window) {
        requestIdleCallback(
          () => {
            prefetchRoutes.forEach((route) => {
              router.prefetch(route);
            });
          },
          { timeout: 2000 }
        );
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(() => {
          prefetchRoutes.forEach((route) => {
            router.prefetch(route);
          });
        }, 2000);
      }
    };

    // Prefetch after initial load
    const timeout = setTimeout(prefetchOnIdle, 3000);

    return () => clearTimeout(timeout);
  }, [router]);

  return null;
}
