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
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type PaydaySettings = {
  last_payday_date: string | null;
  payday_day_of_month: number | null;
};

type SettingsPayload = {
  preferences: UserPreferences;
  payday: PaydaySettings;
  /** `users.updated_at` — budget/payday row changes */
  usersRowUpdatedAt?: string | null;
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

async function fetchSettingsMeta(): Promise<{
  preferencesUpdatedAt: string | null;
  usersRowUpdatedAt: string | null;
} | null> {
  const res = await fetch("/api/settings?mode=meta", { credentials: "include", cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  return data as { preferencesUpdatedAt: string | null; usersRowUpdatedAt: string | null };
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
    let cancelled = false;
    const supabase = createClient();

    const syncSettings = async (session: Session | null) => {
      if (cancelled) return;
      if (!session) {
        setSettings(null);
        return;
      }
      try {
        const res = await fetch("/api/settings", {
          credentials: "include",
          cache: "no-store",
        });
        if (cancelled) return;
        setSettings(res.ok ? ((await res.json()) as SettingsPayload) : null);
      } catch {
        if (!cancelled) setSettings(null);
      }
    };

    void supabase.auth.getSession().then(({ data: { session } }) => {
      void syncSettings(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncSettings(session);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const onFocus = () => {
      void (async () => {
        try {
          const supabase = createClient();
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (!session) return;

          if (!settings) {
            setSettings(await fetchSettings());
            return;
          }
          const meta = await fetchSettingsMeta();
          const localUpdatedAt = settings.preferences?.updated_at ?? null;
          const localUsersAt = settings.usersRowUpdatedAt ?? null;
          let needRefetch = false;
          if (!meta?.preferencesUpdatedAt || !localUpdatedAt) {
            needRefetch = true;
          } else {
            const serverTs = Date.parse(meta.preferencesUpdatedAt);
            const localTs = Date.parse(localUpdatedAt);
            if (!Number.isNaN(serverTs) && !Number.isNaN(localTs) && serverTs > localTs) {
              needRefetch = true;
            }
          }
          if (!needRefetch && meta?.usersRowUpdatedAt && localUsersAt) {
            const uServer = Date.parse(meta.usersRowUpdatedAt);
            const uLocal = Date.parse(localUsersAt);
            if (!Number.isNaN(uServer) && !Number.isNaN(uLocal) && uServer > uLocal) {
              needRefetch = true;
            }
          }
          if (needRefetch) {
            setSettings(await fetchSettings());
          }
        } catch {
          setSettings(null);
        }
      })();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [settings]);

  return (
    <SettingsContext.Provider value={{ settings, invalidate }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
