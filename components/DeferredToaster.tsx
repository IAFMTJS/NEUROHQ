"use client";

import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { NeuroToastIcon } from "@/components/brand/NeuroToastIcon";

/**
 * Renders Toaster after first paint so sonner doesn't block initial hydration.
 * Uses requestIdleCallback when available for light UI / fast load.
 */
export function DeferredToaster() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const schedule = window.requestIdleCallback
      ? (cb: () => void) => window.requestIdleCallback(cb, { timeout: 500 })
      : (cb: () => void) => setTimeout(cb, 150);
    schedule(() => setMounted(true));
  }, []);

  if (!mounted) return null;
  return (
    <Toaster
      richColors
      position="bottom-center"
      closeButton
      offset="var(--toast-offset-bottom)"
      icons={{
        success: <NeuroToastIcon variant="success" />,
        error: <NeuroToastIcon variant="error" />,
        warning: <NeuroToastIcon variant="warning" />,
        info: <NeuroToastIcon variant="info" />,
        loading: <NeuroToastIcon variant="loading" />,
      }}
      toastOptions={{
        className: "hq-toast",
      }}
    />
  );
}
