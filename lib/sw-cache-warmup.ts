"use client";

const DEFAULT_WARMUP_MS = 55_000;
const DEFAULT_CONTROLLER_WAIT_MS = 4_000;

async function getActiveServiceWorkerController(maxWaitMs: number): Promise<ServiceWorker | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  if (navigator.serviceWorker.controller) return navigator.serviceWorker.controller;
  return Promise.race([
    navigator.serviceWorker.ready.then(() => navigator.serviceWorker.controller),
    new Promise<ServiceWorker | null>((resolve) => {
      setTimeout(() => resolve(null), maxWaitMs);
    }),
  ]);
}

/**
 * Runs SW `warmupBackgroundCaches` and resolves when the worker replies or on timeout.
 */
export function requestSwCacheWarmup(options: {
  includeAuth: boolean;
  today: string;
  timeoutMs?: number;
  controllerWaitMs?: number;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return Promise.resolve({ ok: false, reason: "no-sw-api" });
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_WARMUP_MS;
  const controllerWaitMs = options.controllerWaitMs ?? DEFAULT_CONTROLLER_WAIT_MS;

  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: { ok: true } | { ok: false; reason: string }) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };

    const timer = setTimeout(() => finish({ ok: false, reason: "timeout" }), timeoutMs);

    void (async () => {
      const controller = await getActiveServiceWorkerController(controllerWaitMs);
      if (!controller) {
        finish({ ok: false, reason: "no-controller" });
        return;
      }
      if (settled) return;

      try {
        const channel = new MessageChannel();
        channel.port1.onmessage = (event: MessageEvent<{ ok?: boolean; error?: string }>) => {
          const data = event.data;
          if (data && data.ok === true) {
            finish({ ok: true });
          } else {
            finish({ ok: false, reason: data?.error || "sw-reported-failure" });
          }
        };
        channel.port1.onmessageerror = () => finish({ ok: false, reason: "port-message-error" });

        controller.postMessage(
          {
            type: "WARMUP_BACKGROUND_CACHE",
            includeAuth: options.includeAuth,
            today: options.today,
            neurohqReplyPort: true,
          },
          [channel.port2]
        );
      } catch {
        finish({ ok: false, reason: "postMessage-failed" });
      }
    })();
  });
}

/** Retries when the worker is not ready yet or the warmup races a slow network. */
export async function requestSwCacheWarmupWithRetries(
  options: {
    includeAuth: boolean;
    today: string;
    timeoutMs?: number;
    controllerWaitMs?: number;
  },
  opts?: { maxAttempts?: number; delayMs?: number }
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const maxAttempts = Math.max(1, opts?.maxAttempts ?? 3);
  const delayMs = opts?.delayMs ?? 700;
  let last: { ok: true } | { ok: false; reason: string } = { ok: false, reason: "no-attempt" };
  for (let i = 0; i < maxAttempts; i++) {
    if (i > 0) {
      await new Promise((r) => setTimeout(r, delayMs * i));
    }
    last = await requestSwCacheWarmup(options);
    if (last.ok) return last;
    const retryable = last.reason === "timeout" || last.reason === "no-controller";
    if (!retryable) break;
  }
  return last;
}
