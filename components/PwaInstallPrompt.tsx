"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  readonly platforms?: string[];
  readonly userChoice?: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt: () => Promise<void>;
};

const DEV_STANDALONE_KEY = "neurohq_dev_standalone";

function isStandaloneDisplayMode() {
  if (typeof window === "undefined") return false;
  if ((window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || (navigator as any).standalone) {
    return true;
  }
  // Dev-only: mimic installed PWA so you can test without installing (e.g. localhost + ?pwaStandalone=1)
  if (window.location.hostname === "localhost" && window.localStorage.getItem(DEV_STANDALONE_KEY) === "1") {
    return true;
  }
  return false;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [shouldShow, setShouldShow] = useState(false);

  const STORAGE_KEY = "neurohq_pwa_prompt_last_response";
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Dev-only: sync ?pwaStandalone=1|0 to localStorage so standalone mimic persists or can be turned off
    if (window.location.hostname === "localhost") {
      const pwa = new URLSearchParams(window.location.search).get("pwaStandalone");
      if (pwa === "1") window.localStorage.setItem(DEV_STANDALONE_KEY, "1");
      if (pwa === "0") window.localStorage.removeItem(DEV_STANDALONE_KEY);
    }
    if (isStandaloneDisplayMode()) return;

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { ts: number; outcome?: "accepted" | "dismissed" };
        if (Number.isFinite(parsed.ts) && Date.now() - parsed.ts < ONE_DAY_MS) {
          // User already made a choice recently; don't bother them again yet.
          return;
        }
      }
    } catch {
      // If storage is unavailable or corrupted, just fall back to showing the prompt normally.
    }

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

  const persistOutcome = (outcome: "accepted" | "dismissed") => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ts: Date.now(),
          outcome,
        }),
      );
    } catch {
      // Ignore storage errors.
    }
  };

  const handleInstall = async () => {
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      persistOutcome(choice.outcome);
    } catch {
      // Ignore install errors.
    } finally {
      setShouldShow(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    persistOutcome("dismissed");
    setShouldShow(false);
    setDeferredPrompt(null);
  };

  return (
    <div
      className="fixed left-4 right-4 z-[190] flex items-center justify-between gap-3 rounded-xl border border-[var(--accent-focus)]/30 bg-[var(--bg-surface)]/95 px-4 py-3 shadow-lg backdrop-blur"
      style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
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

