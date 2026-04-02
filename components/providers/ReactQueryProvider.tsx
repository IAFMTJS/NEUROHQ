"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useEffect, useState } from "react";
import { registerBootstrapQueryClient } from "@/lib/bootstrap-query-client-ref";

type ReactQueryProviderProps = {
  children: ReactNode;
};

export function ReactQueryProvider({ children }: ReactQueryProviderProps) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Daily data is effectively static for a day; avoid refetch spam.
            staleTime: 24 * 60 * 60 * 1000,
            // Keep cached for the whole session; GC on tab close.
            gcTime: Infinity,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
          },
          mutations: {
            // Let callers opt into optimistic updates; keep retries conservative.
            retry: 1,
          },
        },
      })
  );

  useEffect(() => {
    registerBootstrapQueryClient(client);
    return () => registerBootstrapQueryClient(null);
  }, [client]);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

