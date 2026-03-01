"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  readonly platforms?: string[];
  readonly userChoice?: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt: () => Promise<void>;
};

function isStandaloneDisplayMode() {
  if (typeof window === "undefined") return false;
  if ((window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || (navigator as any).standalone) {
    return true;
  }
  return false;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandaloneDisplayMode()) return;

    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setShouldShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  if (!shouldShow || !deferredPrompt) return null;

  const handleInstall = async () => {
    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } catch {
      // Ignore install errors.
    } finally {
      setShouldShow(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShouldShow(false);
    setDeferredPrompt(null);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[190] flex items-center justify-between gap-3 rounded-xl border border-[var(--accent-focus)]/30 bg-[var(--bg-surface)]/95 px-4 py-3 shadow-lg backdrop-blur">
      <span className="text-sm font-medium text-[var(--text-primary)]">Install NEUROHQ on this device?</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleDismiss}
          className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-white/5"
        >
          Later
        </button>
        <button
          type="button"
          onClick={handleInstall}
          className="rounded-lg bg-[var(--accent-focus)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
        >
          Install app
        </button>
      </div>
    </div>
  );
}

