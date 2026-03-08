"use client";

import { useEffect } from "react";
import { useTheme } from "./ThemeProvider";
import { useBootstrap } from "./BootstrapProvider";
import { getUserPreferencesOrDefaults } from "@/app/actions/preferences";

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
            // Only overwrite DOM/localStorage if server prefs differ from current; avoids flash when light UI already set from inline script
            const currentLight = document.documentElement.getAttribute("data-light-ui");
            const nextLight = prefs.light_ui ? "true" : "false";
            if (currentLight !== nextLight) {
              document.documentElement.dataset.lightUi = nextLight;
              localStorage.setItem("neurohq-light-ui", nextLight);
            }
            const currentReduced = document.documentElement.getAttribute("data-reduced-motion");
            const nextReduced = prefs.reduced_motion ? "true" : "false";
            if (currentReduced !== nextReduced) {
              document.documentElement.dataset.reducedMotion = nextReduced;
              localStorage.setItem("neurohq-reduced-motion", nextReduced);
            }
            document.documentElement.dataset.compactUi = prefs.compact_ui ? "true" : "false";
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
