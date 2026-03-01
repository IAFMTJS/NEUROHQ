"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { DashboardCritical, DashboardSecondary } from "@/types/dashboard-data.types";
import {
  getDashboardCache,
  setDashboardCache,
  getTodayDateStr,
} from "@/lib/dashboard-cache";

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
  const res = await fetch("/api/dashboard/data?part=all", { credentials: "include" });
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
  const res = await fetch("/api/dashboard/data?part=critical", { credentials: "include" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = typeof (body && body.error) === "string" ? body.error : `Dashboard critical ${res.status}`;
    throw new Error(res.status === 401 ? "Unauthorized" : msg);
  }
  return res.json() as Promise<DashboardCritical>;
}

export async function fetchSecondary(): Promise<DashboardSecondary> {
  const res = await fetch("/api/dashboard/data?part=secondary", { credentials: "include" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = typeof (body && body.error) === "string" ? body.error : `Dashboard secondary ${res.status}`;
    throw new Error(msg);
  }
  return res.json();
}

export function DashboardDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DashboardDataState>({
    critical: null,
    secondary: null,
    loadingCritical: false,
    loadingSecondary: false,
  });
  const preloadStartedRef = useRef(false);

  const setDashboardData = useCallback(
    (data: { critical?: DashboardCritical | null; secondary?: DashboardSecondary | null }) => {
      setState((prev) => ({
        ...prev,
        critical: data.critical !== undefined ? data.critical : prev.critical,
        secondary: data.secondary !== undefined ? data.secondary : prev.secondary,
      }));
    },
    []
  );

  const preloadDashboard = useCallback(async () => {
    if (preloadStartedRef.current) return;
    preloadStartedRef.current = true;

    const dateStr = getTodayDateStr();
    // Restore from cache first so reopening the PWA same day shows last-known data immediately (no "loses memory" on iOS)
    try {
      const cached = await getDashboardCache(dateStr);
      if (cached?.critical && cached?.secondary) {
        setState((prev) => ({
          ...prev,
          critical: cached.critical,
          secondary: cached.secondary,
          loadingCritical: false,
          loadingSecondary: false,
        }));
      } else {
        setState((prev) => ({ ...prev, loadingCritical: true, loadingSecondary: true }));
      }
    } catch {
      setState((prev) => ({ ...prev, loadingCritical: true, loadingSecondary: true }));
    }

    try {
      const { critical, secondary } = await fetchAll();
      setState((prev) => ({
        ...prev,
        critical,
        secondary,
        loadingCritical: false,
        loadingSecondary: false,
      }));
      await setDashboardCache(dateStr, critical, secondary);
    } catch (err) {
      setState((prev) => ({ ...prev, loadingCritical: false, loadingSecondary: false }));
      preloadStartedRef.current = false; // Allow retry
      throw err; // So shell can show error when it called preloadDashboard()
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Start preload immediately so data is in state before user navigates; ref avoids double start if shell already called preloadDashboard()
    if (!preloadStartedRef.current) preloadDashboard().catch(() => {});
  }, [preloadDashboard]);

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
