"use client";

import { useEffect } from "react";

/**
 * PWA Badging API: set app icon badge to incomplete task count (capped at 99).
 * No-op when not installed or API unavailable. Clear when count is 0.
 */
export function useAppBadge(incompleteCount: number | undefined) {
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const setBadge = (navigator as { setAppBadge?: (count: number) => Promise<void> }).setAppBadge;
    const clearBadge = (navigator as { clearAppBadge?: () => Promise<void> }).clearAppBadge;
    if (!setBadge || !clearBadge) return;
    if (document.visibilityState !== "visible") return;

    const count = incompleteCount ?? 0;
    const capped = Math.min(99, Math.max(0, count));

    if (capped === 0) {
      clearBadge().catch(() => {});
    } else {
      setBadge(capped).catch(() => {});
    }
  }, [incompleteCount]);
}
