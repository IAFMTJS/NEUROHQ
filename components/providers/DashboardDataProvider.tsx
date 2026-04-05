"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { DashboardCritical, DashboardSecondary } from "@/types/dashboard-data.types";
import { getDashboardCache, setDashboardCache, getTodayDateStr } from "@/lib/dashboard-cache";
import { useHQStore } from "@/lib/hq-store";
import { applyBootstrapTodayToApp, refreshMergedSnapshotFromNetwork } from "@/lib/daily-bootstrap";
import { fetchBootstrapTodayFromApi } from "@/lib/bootstrap-query";

export type { DashboardCritical, DashboardSecondary };

/**
 * Single network path with dashboard: `GET /api/bootstrap/today` (same payload as bootstrap + merge).
 * Updates HQ store via `applyBootstrapTodayToApp` so TanStack + Zustand stay aligned.
 */
export async function fetchAll(signal?: AbortSignal): Promise<{ critical: DashboardCritical; secondary: DashboardSecondary }> {
  const data = await fetchBootstrapTodayFromApi(signal, { variant: "full" });
  applyBootstrapTodayToApp(data);
  const critical = data.dashboard?.critical as DashboardCritical | undefined;
  const secondary = data.dashboard?.secondary as DashboardSecondary | undefined;
  if (!critical || !secondary) throw new Error("Invalid dashboard response");
  return { critical, secondary };
}

export async function fetchCritical(signal?: AbortSignal): Promise<DashboardCritical> {
  const { critical } = await fetchAll(signal);
  return critical;
}

export async function fetchSecondary(signal?: AbortSignal): Promise<DashboardSecondary> {
  const { secondary } = await fetchAll(signal);
  return secondary;
}

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

type DashboardDataProviderProps = {
  children: ReactNode;
  /** Same-day dashboard from server snapshot / TanStack (first paint before Zustand layout hydrate). */
  initialCritical?: DashboardCritical | null;
  initialSecondary?: DashboardSecondary | null;
};

/**
 * Dashboard critical/secondary: **HQ store first** (bootstrap + `applyBootstrapTodayToApp`), then props, then IDB resume.
 * Persists to IndexedDB when the pair is complete so PWA reopen stays instant without an extra dashboard API.
 */
export function DashboardDataProvider({ children, initialCritical, initialSecondary }: DashboardDataProviderProps) {
  const storeCritical = useHQStore((s) => s.dashboardCritical);
  const storeSecondary = useHQStore((s) => s.dashboardSecondary);
  const setDashboardSnapshot = useHQStore((s) => s.setDashboardSnapshot);

  const critical = storeCritical ?? initialCritical ?? null;
  const secondary = storeSecondary ?? initialSecondary ?? null;

  const [loading, setLoading] = useState(false);
  const preloadStartedRef = useRef(false);
  const pathname = usePathname();
  const hasInitialData = Boolean(initialCritical || initialSecondary);

  const setDashboardData = useCallback(
    (data: { critical?: DashboardCritical | null; secondary?: DashboardSecondary | null }) => {
      setDashboardSnapshot(data);
    },
    [setDashboardSnapshot]
  );

  const preloadDashboard = useCallback(async () => {
    if (preloadStartedRef.current) return;
    preloadStartedRef.current = true;
    const dateStr = getTodayDateStr();

    try {
      let c = useHQStore.getState().dashboardCritical;
      let s = useHQStore.getState().dashboardSecondary;

      if (c && s) {
        await setDashboardCache(dateStr, c, s);
        return;
      }

      const cached = await getDashboardCache(dateStr);
      if (cached?.critical && cached?.secondary) {
        setDashboardSnapshot({ critical: cached.critical, secondary: cached.secondary });
        return;
      }

      setLoading(true);
      await refreshMergedSnapshotFromNetwork();
      c = useHQStore.getState().dashboardCritical;
      s = useHQStore.getState().dashboardSecondary;

      if (!c || !s) {
        const fresh = await fetchBootstrapTodayFromApi(undefined, { variant: "full" });
        applyBootstrapTodayToApp(fresh);
        c = useHQStore.getState().dashboardCritical;
        s = useHQStore.getState().dashboardSecondary;
      }

      if (c && s) {
        await setDashboardCache(dateStr, c, s);
      } else {
        throw new Error("Dashboard data unavailable");
      }
    } finally {
      setLoading(false);
      preloadStartedRef.current = false;
    }
  }, [setDashboardSnapshot]);

  useEffect(() => {
    if (!storeCritical || !storeSecondary) return;
    const dateStr = getTodayDateStr();
    void setDashboardCache(dateStr, storeCritical, storeSecondary).catch(() => {});
  }, [storeCritical, storeSecondary]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (pathname !== "/dashboard" && hasInitialData) return;
    void preloadDashboard().catch(() => {});
  }, [preloadDashboard, hasInitialData, pathname]);

  const loadingCritical = loading && !critical;
  const loadingSecondary = loading && !secondary;

  const value: DashboardDataContextValue = {
    critical,
    secondary,
    loadingCritical,
    loadingSecondary,
    setDashboardData,
    preloadDashboard,
  };

  return <DashboardDataContext.Provider value={value}>{children}</DashboardDataContext.Provider>;
}

export function useDashboardData(): DashboardDataContextValue | null {
  return useContext(DashboardDataContext);
}
