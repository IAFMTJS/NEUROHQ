"use client";

import type { QueryClient } from "@tanstack/react-query";

let registered: QueryClient | null = null;

/** Lets non-React callers (e.g. `refreshMergedSnapshotFromNetwork`) update the TanStack Query cache. */
export function registerBootstrapQueryClient(client: QueryClient | null): void {
  registered = client;
}

export function getBootstrapQueryClient(): QueryClient | null {
  return registered;
}
