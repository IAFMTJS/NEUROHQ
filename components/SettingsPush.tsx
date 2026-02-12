"use client";

import { useState, useCallback } from "react";

const VAPID_PUBLIC = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY : undefined;

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function SettingsPush() {
  const [status, setStatus] = useState<"idle" | "loading" | "enabled" | "unsupported" | "denied" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const enable = useCallback(async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setStatus("unsupported");
      return;
    }
    setStatus("loading");
    setMessage(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        setMessage("Permission denied.");
        return;
      }
      if (!VAPID_PUBLIC) {
        setStatus("error");
        setMessage("Push not configured (missing VAPID key).");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await reg.update();
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC) as BufferSource,
      });
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
      setStatus("enabled");
      setMessage("Notifications enabled. You’ll get daily quote and reminders (max 3/day).");
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof Error ? e.message : "Something went wrong.");
    }
  }, []);

  return (
    <div className="rounded-lg border border-neutral-700 bg-neuro-surface p-4">
      <h2 className="text-sm font-medium text-neuro-silver">Notifications</h2>
      <p className="mt-2 text-sm text-neutral-400">
        Enable daily quote and reminders (max 3 per day). Requires a supported browser.
      </p>
      {!VAPID_PUBLIC && (
        <p className="mt-2 text-xs text-amber-500">
          Add <code className="rounded bg-neutral-800 px-1">NEXT_PUBLIC_VAPID_PUBLIC_KEY</code> to enable push.
        </p>
      )}
      {message && (
        <p className={`mt-2 text-sm ${status === "error" ? "text-red-400" : "text-neutral-300"}`} role="status">
          {message}
        </p>
      )}
      <button
        type="button"
        onClick={enable}
        disabled={status === "loading" || status === "enabled"}
        className="mt-3 rounded bg-neuro-blue px-3 py-2 text-sm font-medium text-white transition hover:bg-neuro-blue/90 disabled:opacity-50"
      >
        {status === "loading" ? "Enabling…" : status === "enabled" ? "Enabled" : "Enable notifications"}
      </button>
    </div>
  );
}
