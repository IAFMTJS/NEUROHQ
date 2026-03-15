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
    const next = await fetchSettings();
    setSettings(next);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchSettings().then((data) => {
      if (!cancelled) setSettings(data);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const onFocus = () => void fetchSettings().then((data) => setSettings(data));
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
