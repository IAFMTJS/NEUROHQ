"use client";

import { useSettings } from "@/lib/settings-context";

/** Use in cards: shorter copy paths without changing tokens/CSS. */
export function useSimplifiedContent(): boolean {
  return useSettings().settings?.preferences?.simplified_content === true;
}
