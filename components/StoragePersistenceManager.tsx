"use client";

import { useEffect } from "react";

export function StoragePersistenceManager() {
  useEffect(() => {
    if (typeof window === "undefined" || !("storage" in navigator)) return;
    const storage: any = (navigator as any).storage;
    if (!storage || typeof storage.persist !== "function") return;

    storage
      .persisted()
      .then((isPersisted: boolean) => {
        if (isPersisted) return;
        return storage.persist();
      })
      .catch(() => {
        // Ignore persistence errors; browser may not support it.
      });
  }, []);

  return null;
}

