"use client";

import { useEffect, useState } from "react";
import { Toaster, toast } from "sonner";
import { NeuroToastIcon } from "@/components/brand/NeuroToastIcon";
import { LEVEL_UP_TOAST_ID } from "@/lib/ui/level-up-celebration";

/** True if the event target is inside the toast DOM or a portaled overlay (modal/sheet) opened on top. */
function pointerTargetKeepsToastsOpen(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  if (target.closest("[data-sonner-toast]")) return true;
  /* createPortal(..., document.body) — e.g. Modal, BottomSheet — lives outside the toast <li>. */
  const modalish = target.closest("[aria-modal]");
  if (
    modalish instanceof HTMLElement &&
    modalish.getAttribute("aria-modal") !== "false"
  ) {
    return true;
  }
  return false;
}

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

  /** Sluit alleen bij tik buiten de toast of op het kruisje — niet door swipe/timer (zie gepatchte sonner + toastOptions). Level-up toast blijft staan tot sluitknop. */
  useEffect(() => {
    if (!mounted || typeof document === "undefined") return;
    const onPointerDownCapture = (e: PointerEvent) => {
      const list = toast.getToasts();
      if (list.length === 0) return;
      if (pointerTargetKeepsToastsOpen(e.target)) return;
      for (const t of list) {
        if (t.id === LEVEL_UP_TOAST_ID) continue;
        toast.dismiss(t.id);
      }
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
        /* Geen auto-sluit; sluiten via kruisje of tik buiten de toast (document listener hierboven). */
        duration: Number.POSITIVE_INFINITY,
      }}
    />
  );
}
