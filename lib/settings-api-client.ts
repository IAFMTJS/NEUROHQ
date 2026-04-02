"use client";

import type { UserPreferences } from "@/types/preferences.types";

/** Shape of GET /api/settings (non-meta). Shared so concurrent callers coalesce to one request. */
export type SettingsApiPayload = {
  preferences: UserPreferences;
  payday: {
    last_payday_date: string | null;
    payday_day_of_month: number | null;
  };
  usersRowUpdatedAt?: string | null;
};

let inflight: Promise<SettingsApiPayload | null> | null = null;

/**
 * Single in-flight GET /api/settings per burst (SettingsProvider auth, daily bootstrap, merge sync).
 */
export function fetchSettingsPayload(): Promise<SettingsApiPayload | null> {
  if (inflight != null) return inflight;
  inflight = (async (): Promise<SettingsApiPayload | null> => {
    try {
      const res = await fetch("/api/settings", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) return null;
      return (await res.json()) as SettingsApiPayload;
    } catch {
      return null;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}
