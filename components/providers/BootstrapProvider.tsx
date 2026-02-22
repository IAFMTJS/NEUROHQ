"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getAppBootstrap, type AppBootstrap } from "@/app/actions/bootstrap";

type BootstrapContextValue = {
  bootstrap: AppBootstrap | null;
  loading: boolean;
  refetch: () => Promise<void>;
};

const BootstrapContext = createContext<BootstrapContextValue | null>(null);

export function useBootstrap() {
  const ctx = useContext(BootstrapContext);
  return ctx;
}

export function useBootstrapRequired() {
  const ctx = useContext(BootstrapContext);
  if (!ctx) throw new Error("useBootstrap must be used within BootstrapProvider");
  return ctx;
}

type BootstrapProviderProps = { children: React.ReactNode };

export function BootstrapProvider({ children }: BootstrapProviderProps) {
  const [bootstrap, setBootstrap] = useState<AppBootstrap | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const data = await getAppBootstrap();
      setBootstrap(data);
    } catch (err) {
      console.error("Bootstrap failed:", err);
      setBootstrap(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const value: BootstrapContextValue = { bootstrap, loading, refetch };
  return (
    <BootstrapContext.Provider value={value}>
      {children}
    </BootstrapContext.Provider>
  );
}
