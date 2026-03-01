"use client";

import type { AppMode } from "@/lib/app-mode";

export { ModeBanner } from "@/components/ModeBanner";
export { AddCalendarEventForm } from "@/components/AddCalendarEventForm";

// Temporary HMR-safe fallback to break stale module graph edge.
export function ModeExplanationModal(_: { mode: AppMode }) {
  return null;
}
