"use client";

import { useEffect, useState } from "react";
import { Toaster, toast } from "sonner";
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

  /** Sluit alleen bij tik buiten de toast of op het kruisje — niet door swipe/timer (zie gepatchte sonner + toastOptions). */
  useEffect(() => {
    if (!mounted || typeof document === "undefined") return;
    const onPointerDownCapture = (e: PointerEvent) => {
      if (toast.getToasts().length === 0) return;
      const el = e.target;
      if (!(el instanceof Element)) return;
      if (el.closest("[data-sonner-toast]")) return;
      toast.dismiss();
    };
    document.addEventListener("pointerdown", onPointerDownCapture, true);
    return () => document.removeEventListener("pointerdown", onPointerDownCapture, true);
  }, [mounted]);

  if (!mounted) return null;
  /* Sonner uses `mobileOffset` for bottom on ≤600px; default 16px sat on the dock. */
  const dockToastOffset = "var(--toast-offset-bottom)";
  return (
    <Toaster
      theme="dark"
      richColors={false}
      position="bottom-center"
      closeButton
      offset={{ bottom: dockToastOffset }}
      mobileOffset={{ bottom: dockToastOffset }}
      icons={{
        success: <NeuroToastIcon variant="success" />,
        error: <NeuroToastIcon variant="error" />,
        warning: <NeuroToastIcon variant="warning" />,
        info: <NeuroToastIcon variant="info" />,
        loading: <NeuroToastIcon variant="loading" />,
      }}
      toastOptions={{
        className: "hq-toast",
        dismissible: false,
        /* Geen auto-sluit; sluiten via kruisje of tik buiten de toast (document listener hierboven). */
        duration: Number.POSITIVE_INFINITY,
      }}
    />
  );
}
