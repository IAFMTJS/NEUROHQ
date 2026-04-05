"use client";

import { useEffect } from "react";
import { useTheme } from "./ThemeProvider";
import { useBootstrap } from "./BootstrapProvider";
import { getUserPreferencesOrDefaults } from "@/app/actions/preferences";
import { applyServerPersonaToLocalStorage } from "@/lib/user-persona-storage";

/** Call once when inside authenticated area to sync theme/emotion from server. Prefers bootstrap preferences when available to avoid duplicate fetch. */
export function ThemeHydrate() {
  const { hydrate } = useTheme();
  const bootstrapCtx = useBootstrap();

  useEffect(() => {
    let cancelled = false;
    const loadPrefs = bootstrapCtx?.bootstrap?.preferences
      ? Promise.resolve(bootstrapCtx.bootstrap.preferences)
      : getUserPreferencesOrDefaults();
    loadPrefs
      .then((prefs) => {
        if (!cancelled) {
          hydrate(prefs);
          try {
            applyServerPersonaToLocalStorage({
              display_callsign: prefs.display_callsign,
              hq_headline: prefs.hq_headline,
              greeting_locale: prefs.greeting_locale,
            });
            // Standard display only (compact / reduced-motion toggles removed from settings).
            const nextReduced = "false";
            const nextCompact = "false";
            document.documentElement.dataset.reducedMotion = nextReduced;
            document.documentElement.dataset.compactUi = nextCompact;
            try {
              localStorage.setItem("neurohq-reduced-motion", nextReduced);
            } catch (_) {}
          } catch (_) {}
        }
      })
      .catch((err) => {
        if (!cancelled) console.error("[ThemeHydrate] Failed to load preferences:", err);
      });
    return () => { cancelled = true; };
  }, [hydrate, bootstrapCtx?.bootstrap?.preferences]);

  return null;
}
