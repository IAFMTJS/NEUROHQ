"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { DashboardCritical, DashboardSecondary } from "@/types/dashboard-data.types";
import {
  getDashboardCache,
  setDashboardCache,
  getTodayDateStr,
} from "@/lib/dashboard-cache";
import { useHQStore, getPersistedDashboardSync } from "@/lib/hq-store";

export type { DashboardCritical, DashboardSecondary };

type DashboardDataState = {
  critical: DashboardCritical | null;
  secondary: DashboardSecondary | null;
  loadingCritical: boolean;
  loadingSecondary: boolean;
};

type DashboardDataContextValue = DashboardDataState & {
  setDashboardData: (data: { critical?: DashboardCritical | null; secondary?: DashboardSecondary | null }) => void;
  preloadDashboard: () => Promise<void>;
};

const DashboardDataContext = createContext<DashboardDataContextValue | null>(null);

/** Single request returning both critical and secondary; no duplicate work on server. */
export async function fetchAll(): Promise<{ critical: DashboardCritical; secondary: DashboardSecondary }> {
  const res = await fetch(`/api/dashboard/data?part=all&ts=${Date.now()}`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = typeof (body && body.error) === "string" ? body.error : `Dashboard ${res.status}`;
    throw new Error(res.status === 401 ? "Unauthorized" : msg);
  }
  const data = (await res.json()) as { critical: DashboardCritical; secondary: DashboardSecondary };
  if (!data.critical || !data.secondary) throw new Error("Invalid dashboard response");
  return data;
}

export async function fetchCritical(): Promise<DashboardCritical> {
  const res = await fetch(`/api/dashboard/data?part=critical&ts=${Date.now()}`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = typeof (body && body.error) === "string" ? body.error : `Dashboard critical ${res.status}`;
    throw new Error(res.status === 401 ? "Unauthorized" : msg);
  }
  return res.json() as Promise<DashboardCritical>;
}

export async function fetchSecondary(): Promise<DashboardSecondary> {
  const res = await fetch(`/api/dashboard/data?part=secondary&ts=${Date.now()}`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = typeof (body && body.error) === "string" ? body.error : `Dashboard secondary ${res.status}`;
    throw new Error(msg);
  }
  return res.json();
}

type DashboardDataProviderProps = {
  children: ReactNode;
  /** When provided (e.g. from dashboard page server fetch), first paint has data and we skip client fetch. */
  initialCritical?: DashboardCritical | null;
  initialSecondary?: DashboardSecondary | null;
};

export function DashboardDataProvider({ children, initialCritical, initialSecondary }: DashboardDataProviderProps) {
  const globalCritical = useHQStore((s) => s.dashboardCritical);
  const globalSecondary = useHQStore((s) => s.dashboardSecondary);
  const setDashboardSnapshot = useHQStore((s) => s.setDashboardSnapshot);
  const [state, setState] = useState<DashboardDataState>(() => {
    // Important for hydration: initial client render must match server HTML.
    // Server render never sees persisted/localStorage state, so the first client
    // render also only uses server-provided (initial*) and in-memory global state.
    return {
      critical: initialCritical ?? globalCritical ?? null,
      secondary: initialSecondary ?? globalSecondary ?? null,
      loadingCritical: false,
      loadingSecondary: Boolean(initialCritical && !initialSecondary),
    };
  });
  const preloadStartedRef = useRef(false);
  const stateRef = useRef(state);
  const pathname = usePathname();
  const hasInitialData = Boolean(initialCritical || initialSecondary);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const setDashboardData = useCallback(
    (data: { critical?: DashboardCritical | null; secondary?: DashboardSecondary | null }) => {
      setState((prev) => ({
        ...prev,
        critical: data.critical !== undefined ? data.critical : prev.critical,
        secondary: data.secondary !== undefined ? data.secondary : prev.secondary,
      }));
      setDashboardSnapshot(data);
    },
    [setDashboardSnapshot]
  );

  const preloadDashboard = useCallback(async () => {
    if (preloadStartedRef.current) return;
    preloadStartedRef.current = true;

    const dateStr = getTodayDateStr();
    let cachedCritical: DashboardCritical | null = null;
    let cachedSecondary: DashboardSecondary | null = null;
    // Restore from cache first so reopening the PWA same day shows last-known data immediately (no "loses memory" on iOS)
    try {
      const cached = await getDashboardCache(dateStr);
      cachedCritical = cached?.critical ?? null;
      cachedSecondary = cached?.secondary ?? null;
      if (cachedCritical || cachedSecondary) {
        const current = stateRef.current;
        const nextCritical = current.critical ?? cachedCritical;
        const nextSecondary = current.secondary ?? cachedSecondary;

        setState((prev) => ({
          critical: nextCritical,
          secondary: nextSecondary,
          loadingCritical: prev.critical ? prev.loadingCritical : !nextCritical,
          loadingSecondary: prev.secondary ? prev.loadingSecondary : !nextSecondary,
        }));

        setDashboardSnapshot({ critical: nextCritical, secondary: nextSecondary });
      }
    } catch {
      cachedCritical = null;
      cachedSecondary = null;
    }

    // If we have a complete cached snapshot (critical + secondary), use it without hitting the network.
    // Mutations already keep cache fresh; this keeps reopen/resume truly instant.
    if (cachedCritical && cachedSecondary) {
      preloadStartedRef.current = false;
      setState((prev) => ({
        ...prev,
        critical: prev.critical ?? cachedCritical,
        secondary: prev.secondary ?? cachedSecondary,
        loadingCritical: false,
        loadingSecondary: false,
      }));
      setDashboardSnapshot({
        critical: cachedCritical,
        secondary: cachedSecondary,
      });
      return;
    }

    const currentState = stateRef.current;
    const needCritical = !(currentState.critical ?? cachedCritical);
    const needSecondary = !(currentState.secondary ?? cachedSecondary);
    if (!needCritical && !needSecondary) {
      preloadStartedRef.current = false;
      setState((prev) => ({ ...prev, loadingCritical: false, loadingSecondary: false }));
      return;
    }

    setState((prev) => ({
      ...prev,
      loadingCritical: needCritical,
      loadingSecondary: needSecondary,
    }));

    try {
      let critical = currentState.critical ?? cachedCritical;
      let secondary = currentState.secondary ?? cachedSecondary;

      if (needCritical && needSecondary) {
        const all = await fetchAll();
        critical = all.critical;
        secondary = all.secondary;
      } else if (needCritical) {
        critical = await fetchCritical();
      } else if (needSecondary) {
        secondary = await fetchSecondary();
      }

      setState((prev) => ({
        ...prev,
        critical: critical ?? prev.critical,
        secondary: secondary ?? prev.secondary,
        loadingCritical: false,
        loadingSecondary: false,
      }));
      if (critical && secondary) {
        await setDashboardCache(dateStr, critical, secondary);
        setDashboardSnapshot({ critical, secondary });
      }
    } catch (err) {
      setState((prev) => ({ ...prev, loadingCritical: false, loadingSecondary: false }));
      preloadStartedRef.current = false; // Allow retry
      throw err; // So shell can show error when it called preloadDashboard()
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (pathname !== "/dashboard" && hasInitialData) return; // Other routes get a full nested provider already.
    if (!preloadStartedRef.current) preloadDashboard().catch(() => {});
  }, [preloadDashboard, hasInitialData, pathname]);

  const value: DashboardDataContextValue = {
    ...state,
    setDashboardData,
    preloadDashboard,
  };

  return (
    <DashboardDataContext.Provider value={value}>
      {children}
    </DashboardDataContext.Provider>
  );
}

export function useDashboardData(): DashboardDataContextValue | null {
  return useContext(DashboardDataContext);
}
