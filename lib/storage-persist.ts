"use client";

/**
 * Ask the browser for durable storage so IndexedDB / Cache API are less likely to be purged
 * (especially iOS PWA after backgrounding). Safe no-op when unsupported.
 */
export function requestDurableStorage(): void {
  if (typeof window === "undefined" || !("storage" in navigator)) return;
  const storage = navigator.storage as Navigator["storage"] & {
    persist?: () => Promise<boolean>;
    persisted?: () => Promise<boolean>;
  };
  if (!storage?.persist) return;
  void storage
    .persisted?.()
    .then((isPersisted: boolean) => {
      if (isPersisted) return;
      return storage.persist?.();
    })
    .catch(() => {});
}
