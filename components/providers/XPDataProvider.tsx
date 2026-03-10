"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
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
  const stateRef = useRef(state);
  const preloadStartedRef = useRef(false);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const setXPData = useCallback((data: XPCachePayload) => {
    setState((prev) => ({
      ...prev,
      data,
      loading: false,
      error: null,
    }));
  }, []);

  const preloadXP = useCallback(async () => {
    if (preloadStartedRef.current) return;
    preloadStartedRef.current = true;

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
      setState({
        data: fresh,
        loading: false,
        error: null,
      });
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
    } finally {
      preloadStartedRef.current = false;
    }
  }, [initialDateStr]);

  useEffect(() => {
    if (state.data) {
      // Already have initial data (SSR or cache), just ensure background refresh
      preloadXP().catch(() => {});
      return;
    }
    preloadXP().catch(() => {});
  }, [preloadXP, state.data]);

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

