"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { markXpContextNetworkDoneForToday, xpContextNetworkAlreadyDoneForToday } from "@/lib/client-xp-context-session";
import { getTodayKey } from "@/lib/daily-date";
import type { XPCachePayload } from "@/lib/xp-cache";
import { getXPCache, setXPCache } from "@/lib/xp-cache";

type XPDataState = {
  data: XPCachePayload | null;
  loading: boolean;
  error: string | null;
};

type XPDataContextValue = XPDataState & {
  preloadXP: () => Promise<void>;
  setXPData: (data: XPCachePayload) => void;
};

const XPDataContext = createContext<XPDataContextValue | null>(null);

type XPDataProviderProps = {
  children: ReactNode;
  initialDateStr: string;
  initialData?: XPCachePayload | null;
};

export function XPDataProvider({ children, initialDateStr, initialData }: XPDataProviderProps) {
  const [state, setState] = useState<XPDataState>({
    data: initialData ?? null,
    loading: !initialData,
    error: null,
  });
  // When DailySnapshot.xp refreshes (background merge), adopt newer server totals without a full remount.
  // Never replace live/API data with an older snapshot (lower total_xp).
  useEffect(() => {
    if (initialData == null) return;
    setState((prev) => {
      if (!prev.data) {
        return { ...prev, data: initialData, loading: false, error: null };
      }
      const prevXp = prev.data.identity.total_xp;
      const snapXp = initialData.identity.total_xp;
      if (snapXp < prevXp) return prev;
      if (
        snapXp === prevXp &&
        prev.data.identity.level === initialData.identity.level &&
        prev.data.dateStr === initialData.dateStr
      ) {
        return prev;
      }
      return { ...prev, data: initialData, loading: false, error: null };
    });
  }, [initialData]);

  const setXPData = useCallback((data: XPCachePayload) => {
    setState((prev) => ({
      ...prev,
      data,
      loading: false,
      error: null,
    }));
  }, []);

  const preloadXP = useCallback(async () => {
    // 1. Try IndexedDB cache first for instant UI
    let cached: XPCachePayload | null = null;
    try {
      cached = await getXPCache(initialDateStr);
      if (cached) {
        setState((prev) => ({
          ...prev,
          data: prev.data ?? cached,
          loading: false,
        }));
      }
    } catch {
      cached = null;
    }

    const todayKey = getTodayKey();
    const seededForToday =
      initialDateStr === todayKey &&
      ((initialData != null && initialData.dateStr === todayKey) ||
        (cached != null && cached.dateStr === todayKey));
    if (seededForToday && xpContextNetworkAlreadyDoneForToday()) {
      setState((prev) => ({
        ...prev,
        data: prev.data ?? cached ?? initialData ?? null,
        loading: false,
        error: null,
      }));
      return;
    }

    // 2. Fetch fresh XP context from server
    try {
      const res = await fetch(`/api/xp/context?date=${encodeURIComponent(initialDateStr)}&ts=${Date.now()}`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg =
          typeof body?.error === "string" ? body.error : `XP context ${res.status}`;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: prev.data ? prev.error : msg,
        }));
        return;
      }
      const fresh = (await res.json()) as XPCachePayload;
      setState((prev) => {
        if (prev.data && prev.data.identity.total_xp > fresh.identity.total_xp) {
          return { ...prev, loading: false, error: null };
        }
        return { data: fresh, loading: false, error: null };
      });
      markXpContextNetworkDoneForToday();
      setXPCache(initialDateStr, fresh).catch(() => {});
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: prev.data
          ? prev.error
          : err instanceof Error
            ? err.message
            : "Failed to load XP context",
      }));
    }
  }, [initialDateStr]);

  useEffect(() => {
    void preloadXP();
  }, [preloadXP]);

  const value: XPDataContextValue = useMemo(
    () => ({
      ...state,
      preloadXP,
      setXPData,
    }),
    [state, preloadXP, setXPData]
  );

  return <XPDataContext.Provider value={value}>{children}</XPDataContext.Provider>;
}

export function useXPData(): XPDataContextValue | null {
  return useContext(XPDataContext);
}

