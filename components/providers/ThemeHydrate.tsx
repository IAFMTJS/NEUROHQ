"use client";

import { useEffect } from "react";
import { useTheme } from "./ThemeProvider";
import { getUserPreferencesOrDefaults } from "@/app/actions/preferences";

/** Call once when inside authenticated area to sync theme/emotion from server. */
export function ThemeHydrate() {
  const { hydrate } = useTheme();

  useEffect(() => {
    let cancelled = false;
    getUserPreferencesOrDefaults().then((prefs) => {
      if (!cancelled) {
        hydrate(prefs);
        document.documentElement.dataset.compactUi = prefs.compact_ui ? "true" : "false";
        document.documentElement.dataset.reducedMotion = prefs.reduced_motion ? "true" : "false";
      }
    });
    return () => { cancelled = true; };
  }, [hydrate]);

  return null;
}
