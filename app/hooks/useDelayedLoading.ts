"use client";

import { useEffect, useState } from "react";

const DEFAULT_DELAY_MS = 250;

/**
 * Returns true only after `delayMs` of loading — avoids flashing spinners on fast loads.
 * Psychological UX: show loading state only when the user would notice the wait.
 */
export function useDelayedLoading(isLoading: boolean, delayMs: number = DEFAULT_DELAY_MS): boolean {
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setShowLoading(false);
      return;
    }
    const t = setTimeout(() => setShowLoading(true), delayMs);
    return () => clearTimeout(t);
  }, [isLoading, delayMs]);

  return isLoading && showLoading;
}
