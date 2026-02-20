"use client";

import { useState, useCallback } from "react";
import { updatePushQuoteTime, updatePushQuietHours, type QuietHours } from "@/app/actions/auth";

const VAPID_PUBLIC = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY : undefined;

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

type Props = { initialPushQuoteTime?: string | null; initialQuietHours?: QuietHours };

export function SettingsPush({ initialPushQuoteTime = null, initialQuietHours = { start: null, end: null } }: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "enabled" | "unsupported" | "denied" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [pushQuoteTime, setPushQuoteTime] = useState(initialPushQuoteTime ?? "");
  const [quoteTimePending, setQuoteTimePending] = useState(false);
  const [quietStart, setQuietStart] = useState(initialQuietHours.start ?? "");
  const [quietEnd, setQuietEnd] = useState(initialQuietHours.end ?? "");
  const [quietPending, setQuietPending] = useState(false);

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
    <div className="card-simple overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Notifications</h2>
      </div>
      <div className="p-4">
      <p className="text-sm text-[var(--text-muted)]">
        Enable daily quote and reminders (max 3 per day). Requires a supported browser.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label htmlFor="push-quote-time" className="text-sm font-medium text-[var(--text-primary)]">
          Quote time (optional)
        </label>
        <input
          id="push-quote-time"
          type="time"
          value={pushQuoteTime}
          onChange={(e) => setPushQuoteTime(e.target.value)}
          onBlur={async () => {
            const val = pushQuoteTime.trim() || null;
            if (val === (initialPushQuoteTime ?? "")) return;
            setQuoteTimePending(true);
            try {
              await updatePushQuoteTime(val);
            } finally {
              setQuoteTimePending(false);
            }
          }}
          className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)]"
        />
        {quoteTimePending && <span className="text-xs text-[var(--text-muted)]">Saving…</span>}
        <span className="text-xs text-[var(--text-muted)]">When to send the daily quote. Leave empty for default.</span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-[var(--text-primary)]">Quiet hours (no push)</span>
        <input
          type="time"
          value={quietStart}
          onChange={(e) => setQuietStart(e.target.value)}
          onBlur={async () => {
            const s = quietStart.trim() || null;
            const e = quietEnd.trim() || null;
            if (s === (initialQuietHours.start ?? "") && e === (initialQuietHours.end ?? "")) return;
            setQuietPending(true);
            try {
              await updatePushQuietHours(s, e);
            } finally {
              setQuietPending(false);
            }
          }}
          className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)]"
        />
        <span className="text-[var(--text-muted)]">–</span>
        <input
          type="time"
          value={quietEnd}
          onChange={(e) => setQuietEnd(e.target.value)}
          onBlur={async () => {
            const s = quietStart.trim() || null;
            const e = quietEnd.trim() || null;
            if (s === (initialQuietHours.start ?? "") && e === (initialQuietHours.end ?? "")) return;
            setQuietPending(true);
            try {
              await updatePushQuietHours(s, e);
            } finally {
              setQuietPending(false);
            }
          }}
          className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)]"
        />
        {quietPending && <span className="text-xs text-[var(--text-muted)]">Saving…</span>}
        <span className="text-xs text-[var(--text-muted)]">No notifications in this window (your local time).</span>
      </div>
      {!VAPID_PUBLIC && (
        <div className="mt-2 space-y-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          <p className="font-medium">Push not configured (missing VAPID key).</p>
          <p>1. In your project root run: <code className="rounded bg-[var(--bg-primary)] px-1 py-0.5">npm run generate-vapid</code></p>
          <p>2. Copy the two printed lines into <code className="rounded bg-[var(--bg-primary)] px-1 py-0.5">.env.local</code> (create it from <code className="rounded bg-[var(--bg-primary)] px-1 py-0.5">.env.example</code> if needed).</p>
          <p>3. Restart the dev server so the new env vars are picked up.</p>
        </div>
      )}
      {message && (
        <p className={`mt-2 text-sm ${status === "error" ? "text-red-400" : "text-[var(--text-primary)]"}`} role="status">
          {message}
        </p>
      )}
      <button
        type="button"
        onClick={enable}
        disabled={status === "loading" || status === "enabled"}
        className="btn-primary mt-3 rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50"
      >
        {status === "loading" ? "Enabling…" : status === "enabled" ? "Enabled" : "Enable notifications"}
      </button>
      </div>
    </div>
  );
}
