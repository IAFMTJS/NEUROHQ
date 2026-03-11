"use client";

import { useEffect } from "react";
import { flushHQStoreToStorage } from "@/lib/hq-store";

/**
 * Flush HQ store to localStorage when the app is hidden or closed,
 * so a full reload (reopen tab/PWA) always restores the latest state.
 * Zustand persist already writes on every state change; this adds an
 * explicit flush on hide/close so we don't rely on the last tick.
 */
export function HQStorePersistOnHide() {
  useEffect(() => {
    const flush = () => flushHQStoreToStorage();

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") flush();
    };

    const onPageHide = () => flush();

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, []);

  return null;
}
