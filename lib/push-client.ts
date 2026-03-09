const VAPID_PUBLIC = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY : undefined;

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function supportsPush(): boolean {
  return typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator;
}

export function isPushConfigured(): boolean {
  return Boolean(VAPID_PUBLIC);
}

export async function ensurePushSubscription(): Promise<{ subscribed: boolean; permission: NotificationPermission }> {
  if (!supportsPush()) throw new Error("This browser does not support push notifications.");

  let permission = Notification.permission;
  if (permission !== "granted") {
    permission = await Notification.requestPermission();
  }
  if (permission !== "granted") {
    return { subscribed: false, permission };
  }
  if (!VAPID_PUBLIC) {
    throw new Error("Push notifications are optional. Add VAPID keys to enable them.");
  }

  await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  const reg = await Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Service worker did not activate in time. Refresh the page and try again.")), 15000)
    ),
  ]);
  const existing = await reg.pushManager.getSubscription();
  const sub =
    existing ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC) as BufferSource,
    }));
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ subscription: sub.toJSON() }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to save subscription");
  }
  return { subscribed: true, permission };
}

export async function removePushSubscription(): Promise<void> {
  if ("serviceWorker" in navigator) {
    const reg = await navigator.serviceWorker.ready.catch(() => null);
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      await sub.unsubscribe().catch(() => {});
    }
  }
  await fetch("/api/push/subscribe", {
    method: "DELETE",
    credentials: "include",
  });
}
