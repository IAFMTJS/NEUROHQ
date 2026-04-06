"use client";

let shared: AudioContext | null = null;
let listenersAttached = false;

export function getSharedAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (shared?.state === "closed") shared = null;
  if (shared) return shared;
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    shared = new AC();
    return shared;
  } catch {
    return null;
  }
}

export function resumeSharedAudioContext(): Promise<void> {
  const c = getSharedAudioContext();
  if (!c) return Promise.resolve();
  if (c.state === "suspended") return c.resume().then(() => undefined);
  return Promise.resolve();
}

/** Call once in the app shell so the first tap/key unlocks audio on mobile. */
export function ensureUiAudioUnlockListeners(): void {
  if (typeof window === "undefined" || listenersAttached) return;
  listenersAttached = true;
  const unlock = () => {
    void resumeSharedAudioContext();
  };
  window.addEventListener("pointerdown", unlock, { passive: true });
  window.addEventListener("keydown", unlock, { passive: true });
}
