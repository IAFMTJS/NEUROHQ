"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { UserPreferences } from "@/types/preferences.types";

type PaydaySettings = {
  last_payday_date: string | null;
  payday_day_of_month: number | null;
};

type SettingsPayload = {
  preferences: UserPreferences;
  payday: PaydaySettings;
} | null;

const SettingsContext = createContext<{
  settings: SettingsPayload;
  invalidate: () => Promise<void>;
}>({ settings: null, invalidate: async () => {} });

async function fetchSettings(): Promise<SettingsPayload> {
  const res = await fetch("/api/settings", { credentials: "include", cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  return data as SettingsPayload;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SettingsPayload>(null);

  const invalidate = useCallback(async () => {
    try {
      const next = await fetchSettings();
      setSettings(next);
    } catch {
      setSettings(null);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    fetch("/api/settings", {
      credentials: "include",
      cache: "no-store",
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setSettings((data ?? null) as SettingsPayload);
      })
      .catch(() => {
        if (!cancelled) setSettings(null);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const onFocus = () => {
      void fetchSettings()
        .then((data) => setSettings(data))
        .catch(() => setSettings(null));
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, invalidate }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
