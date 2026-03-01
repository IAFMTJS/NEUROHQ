"use client";

import { useEffect, useState } from "react";
import { StoragePersistenceManager } from "@/components/StoragePersistenceManager";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";

/**
 * Renders PWA and storage components after first paint so they don't compete
 * with initial layout and hydration. Uses requestIdleCallback when available.
 */
export function DeferredRootComponents() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const schedule = window.requestIdleCallback
      ? (cb: () => void) => window.requestIdleCallback(cb, { timeout: 300 })
      : (cb: () => void) => setTimeout(cb, 100);
    schedule(() => setMounted(true));
  }, []);

  if (!mounted) return null;
  return (
    <>
      <StoragePersistenceManager />
      <PwaInstallPrompt />
    </>
  );
}
