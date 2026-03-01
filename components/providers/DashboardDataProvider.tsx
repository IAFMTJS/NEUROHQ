"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type DashboardCritical = Record<string, unknown>;
export type DashboardSecondary = Record<string, unknown>;

type DashboardDataState = {
  critical: DashboardCritical | null;
  secondary: DashboardSecondary | null;
};

type DashboardDataContextValue = DashboardDataState & {
  setDashboardData: (data: { critical?: DashboardCritical | null; secondary?: DashboardSecondary | null }) => void;
  preloadDashboard: () => Promise<void>;
};

const DashboardDataContext = createContext<DashboardDataContextValue | null>(null);

async function fetchCritical(): Promise<DashboardCritical> {
  const res = await fetch("/api/dashboard/data?part=critical", { credentials: "include" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = typeof (body && body.error) === "string" ? body.error : `Dashboard critical ${res.status}`;
    throw new Error(res.status === 401 ? "Unauthorized" : msg);
  }
  return res.json();
}

async function fetchSecondary(): Promise<DashboardSecondary> {
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
  });

  const setDashboardData = useCallback(
    (data: { critical?: DashboardCritical | null; secondary?: DashboardSecondary | null }) => {
      setState((prev) => ({
        critical: data.critical !== undefined ? data.critical : prev.critical,
        secondary: data.secondary !== undefined ? data.secondary : prev.secondary,
      }));
    },
    []
  );

  const preloadDashboard = useCallback(async () => {
    try {
      const critical = await fetchCritical();
      setState((prev) => ({ ...prev, critical }));
      const secondary = await fetchSecondary();
      setState((prev) => ({ ...prev, secondary }));
    } catch {
      // Silently fail; dashboard page will fetch on demand
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const run = () => {
      preloadDashboard();
    };
    if ("requestIdleCallback" in window) {
      const id = requestIdleCallback(run, { timeout: 1500 });
      return () => cancelIdleCallback(id);
    }
    const t = setTimeout(run, 1000);
    return () => clearTimeout(t);
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
