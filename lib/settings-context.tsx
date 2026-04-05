"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { fetchSettingsPayload, type SettingsApiPayload } from "@/lib/settings-api-client";
import { resetDcicGameStateBootstrap } from "@/lib/dcic/game-state-client";
import { resetBootstrapMergeEtag } from "@/lib/daily-snapshot-full-sync";
import { resetBootstrapApplyFingerprint } from "@/lib/daily-bootstrap";
import { useHQStore } from "@/lib/hq-store";
import { clearDailySnapshot } from "@/lib/daily-snapshot-storage";

type SettingsPayload = SettingsApiPayload | null;

const SettingsContext = createContext<{
  settings: SettingsPayload;
  invalidate: () => Promise<void>;
}>({ settings: null, invalidate: async () => {} });

async function fetchSettings(): Promise<SettingsPayload> {
  return fetchSettingsPayload();
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

/** Auth events that imply user/session identity changed; skip TOKEN_REFRESHED etc. to avoid refetch storms. */
function shouldSyncSettingsOnAuthEvent(event: string): boolean {
  return (
    event === "INITIAL_SESSION" ||
    event === "SIGNED_IN" ||
    event === "SIGNED_OUT" ||
    event === "USER_UPDATED"
  );
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SettingsPayload>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

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
    let syncSeq = 0;
    const supabase = createClient();

    const syncSettings = async (session: Session | null) => {
      const seq = ++syncSeq;
      if (cancelled) return;
      if (!session) {
        setSettings(null);
        resetDcicGameStateBootstrap();
        resetBootstrapMergeEtag();
        resetBootstrapApplyFingerprint();
        useHQStore.getState().setMissionsPipeline(null);
        void clearDailySnapshot();
        return;
      }
      try {
        const data = await fetchSettingsPayload();
        if (cancelled || seq !== syncSeq) return;
        setSettings(data);
      } catch {
        if (!cancelled && seq === syncSeq) setSettings(null);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!shouldSyncSettingsOnAuthEvent(event)) return;
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

          const s = settingsRef.current;
          if (!s) {
            setSettings(await fetchSettings());
            return;
          }
          const meta = await fetchSettingsMeta();
          const localUpdatedAt = s.preferences?.updated_at ?? null;
          const localUsersAt = s.usersRowUpdatedAt ?? null;
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
          // Tab refocus / transient network errors must not wipe settings (would blank large parts of the app).
        }
      })();
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
