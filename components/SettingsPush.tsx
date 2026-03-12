"use client";

import { useState, useTransition } from "react";
import { updatePushQuoteTime, updatePushQuietHours, type QuietHours } from "@/app/actions/auth";
import { updateUserPreferences } from "@/app/actions/preferences";
import { ensurePushSubscription, isPushConfigured, removePushSubscription, supportsPush } from "@/lib/push-client";

// Persist last-saved values so remounts (e.g. React Strict Mode) don't revert to stale server props.
let lastSavedQuoteTime: string | null = null;
let lastSavedQuietHours: QuietHours = { start: null, end: null };

type Props = {
  initialPushQuoteTime?: string | null;
  initialQuietHours?: QuietHours;
  initialPushSubscribed?: boolean;
  initialPushRemindersEnabled?: boolean;
  initialPushMorningEnabled?: boolean;
  initialPushEveningEnabled?: boolean;
  initialPushWeeklyLearningEnabled?: boolean;
};

export function SettingsPush({
  initialPushQuoteTime = null,
  initialQuietHours = { start: null, end: null },
  initialPushSubscribed = false,
  initialPushRemindersEnabled = true,
  initialPushMorningEnabled = true,
  initialPushEveningEnabled = true,
  initialPushWeeklyLearningEnabled = true,
}: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "enabled" | "unsupported" | "denied" | "error">(
    initialPushSubscribed ? "enabled" : "idle"
  );
  const [message, setMessage] = useState<string | null>(null);
  const [subscribed, setSubscribed] = useState(initialPushSubscribed);
  const [pushQuoteTime, setPushQuoteTime] = useState(() => (lastSavedQuoteTime ?? initialPushQuoteTime ?? "") as string);
  const [quoteTimePending, setQuoteTimePending] = useState(false);
  const [quietStart, setQuietStart] = useState(() => (lastSavedQuietHours.start ?? initialQuietHours.start ?? "") as string);
  const [quietEnd, setQuietEnd] = useState(() => (lastSavedQuietHours.end ?? initialQuietHours.end ?? "") as string);
  const [quietPending, setQuietPending] = useState(false);
  const [prefsPending, startPrefsTransition] = useTransition();
  const [pushRemindersEnabled, setPushRemindersEnabled] = useState(initialPushRemindersEnabled);
  const [pushMorningEnabled, setPushMorningEnabled] = useState(initialPushMorningEnabled);
  const [pushEveningEnabled, setPushEveningEnabled] = useState(initialPushEveningEnabled);
  const [pushWeeklyLearningEnabled, setPushWeeklyLearningEnabled] = useState(initialPushWeeklyLearningEnabled);
  const [testPending, setTestPending] = useState(false);
  const [serverTestPending, setServerTestPending] = useState(false);

  const savePrefs = (next: {
    push_reminders_enabled?: boolean;
    push_morning_enabled?: boolean;
    push_evening_enabled?: boolean;
    push_weekly_learning_enabled?: boolean;
  }) => {
    startPrefsTransition(async () => {
      try {
        await updateUserPreferences(next);
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "Could not save push reminder settings.");
      }
    });
  };

  const enable = async () => {
    if (!supportsPush()) {
      setStatus("unsupported");
      return;
    }
    setStatus("loading");
    setMessage(null);
    try {
      const result = await ensurePushSubscription();
      if (!result.subscribed) {
        setStatus("denied");
        setMessage("Browser permission not granted.");
        return;
      }
      setSubscribed(true);
      setStatus("enabled");
      setMessage("Push is connected. Morning, evening, and weekly reminders follow your settings below.");
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof Error ? e.message : "Something went wrong.");
    }
  };

  const disconnect = async () => {
    setStatus("loading");
    setMessage(null);
    try {
      await removePushSubscription();
      setSubscribed(false);
      setStatus("idle");
      setMessage("Browser push disconnected. Your reminder preferences stay saved.");
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof Error ? e.message : "Could not disconnect push.");
    }
  };

  const scheduleTestNotification = async () => {
    if (!supportsPush()) {
      setMessage("This browser does not support push notifications.");
      return;
    }
    setTestPending(true);
    setMessage(null);
    try {
      // On platforms like iOS, make sure we explicitly ask for notification permission
      // before trying to show a local notification from the service worker.
      if (typeof Notification !== "undefined") {
        const current = Notification.permission;
        if (current === "default") {
          const permission = await Notification.requestPermission();
          if (permission !== "granted") {
            setMessage(
              permission === "denied"
                ? "Notifications are blocked for this app. Enable them in your device settings to see push alerts."
                : "Browser permission not granted."
            );
            setTestPending(false);
            return;
          }
        } else if (current === "denied") {
          setMessage("Notifications are blocked for this app. Enable them in your device settings to see push alerts.");
          setTestPending(false);
          return;
        }
      }
      // Ensure a service worker registration exists so we can send it a message.
      if (!("serviceWorker" in navigator)) {
        throw new Error("Service worker not available.");
      }
      let reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      }
      const sw = reg.active || reg.waiting || reg.installing;
      if (!sw) {
        throw new Error("Service worker did not activate. Refresh the page and try again.");
      }
      sw.postMessage({ type: "TEST_PUSH_IN_30S" });
      setMessage("Test notification scheduled. It should appear in about 30 seconds.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not schedule test notification.");
    } finally {
      setTestPending(false);
    }
  };

  const sendServerPushTest = async () => {
    setServerTestPending(true);
    setMessage(null);
    try {
      const res = await fetch("/api/push/test", {
        method: "POST",
        credentials: "include",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errMsg =
          typeof body.error === "string"
            ? body.error
            : res.status === 401
              ? "Not logged in on this device."
              : "Server push test failed.";
        setMessage(errMsg);
        return;
      }
      setMessage("Server push test sent. If push is configured, it should appear even when the PWA is closed.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not send server push test.");
    } finally {
      setServerTestPending(false);
    }
  };

  return (
    <div className="card-simple overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Push reminders</h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
          Scheduled push reminders default to on. The app can ask for browser permission and then send morning, evening, and weekly reminders plus existing push alerts.
        </p>
      </div>
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Scheduled push reminders</p>
            <p className="text-xs text-[var(--text-muted)]">Master switch for morning, evening, and weekly learning reminders.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={pushRemindersEnabled}
            disabled={prefsPending}
            onClick={() => {
              const next = !pushRemindersEnabled;
              setPushRemindersEnabled(next);
              savePrefs({ push_reminders_enabled: next });
            }}
            className="relative h-7 w-12 shrink-0 rounded-full bg-[var(--input-bg)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] disabled:opacity-60"
            data-state={pushRemindersEnabled ? "on" : "off"}
          >
            <span
              className="absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform"
              style={{ transform: pushRemindersEnabled ? "translateX(20px)" : "translateX(2px)" }}
            />
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              label: "Morning push",
              checked: pushMorningEnabled,
              setter: setPushMorningEnabled,
              key: "push_morning_enabled" as const,
            },
            {
              label: "Evening push",
              checked: pushEveningEnabled,
              setter: setPushEveningEnabled,
              key: "push_evening_enabled" as const,
            },
            {
              label: "Weekly learning push",
              checked: pushWeeklyLearningEnabled,
              setter: setPushWeeklyLearningEnabled,
              key: "push_weekly_learning_enabled" as const,
            },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              disabled={prefsPending || !pushRemindersEnabled}
              onClick={() => {
                const next = !item.checked;
                item.setter(next);
                savePrefs({ [item.key]: next });
              }}
              className={`rounded-xl border px-3 py-3 text-left text-sm transition ${
                item.checked && pushRemindersEnabled
                  ? "border-[var(--accent-focus)]/60 bg-[var(--accent-focus)]/10 text-[var(--text-primary)]"
                  : "border-[var(--card-border)] bg-[var(--bg-primary)] text-[var(--text-muted)]"
              } disabled:opacity-50`}
            >
              <span className="block font-medium">{item.label}</span>
              <span className="mt-1 block text-xs">{item.checked && pushRemindersEnabled ? "On" : "Off"}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
              setQuoteTimePending(true);
              try {
                const saved = await updatePushQuoteTime(val);
                lastSavedQuoteTime = saved;
                setPushQuoteTime(saved ?? "");
              } catch (e) {
                setMessage(e instanceof Error ? e.message : "Kon quote-tijd niet opslaan.");
              } finally {
                setQuoteTimePending(false);
              }
            }}
            className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)]"
          />
          {quoteTimePending && <span className="text-xs text-[var(--text-muted)]">Saving…</span>}
          <span className="text-xs text-[var(--text-muted)]">Stored separately for quote pushes.</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-[var(--text-primary)]">Quiet hours (no push)</span>
          <input
            type="time"
            value={quietStart}
            onChange={(e) => setQuietStart(e.target.value)}
            onBlur={async () => {
              const s = quietStart.trim() || null;
              const e = quietEnd.trim() || null;
              setQuietPending(true);
              try {
                const saved = await updatePushQuietHours(s, e);
                lastSavedQuietHours = saved;
                setQuietStart(saved.start ?? "");
                setQuietEnd(saved.end ?? "");
              } catch (err) {
                setMessage(err instanceof Error ? err.message : "Kon stille uren niet opslaan.");
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
              setQuietPending(true);
              try {
                const saved = await updatePushQuietHours(s, e);
                lastSavedQuietHours = saved;
                setQuietStart(saved.start ?? "");
                setQuietEnd(saved.end ?? "");
              } catch (err) {
                setMessage(err instanceof Error ? err.message : "Kon stille uren niet opslaan.");
              } finally {
                setQuietPending(false);
              }
            }}
            className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)]"
          />
          {quietPending && <span className="text-xs text-[var(--text-muted)]">Saving…</span>}
          <span className="text-xs text-[var(--text-muted)]">Applied to scheduled reminders and the existing push alerts.</span>
        </div>

        {!isPushConfigured() && (
          <div className="space-y-2 rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)] px-3 py-2 text-xs text-[var(--text-muted)]">
            <p className="font-medium text-[var(--text-secondary)]">Push notifications (optional)</p>
            <p>To enable push in this environment, add VAPID keys:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Run <code className="rounded bg-[var(--bg-primary)] px-1 py-0.5">npm run generate-vapid</code>.</li>
              <li>Copy the printed values into <code className="rounded bg-[var(--bg-primary)] px-1 py-0.5">.env.local</code>.</li>
              <li>Restart the dev server.</li>
            </ol>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={enable}
            disabled={status === "loading" || subscribed}
            className="btn-primary rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {status === "loading" ? "Working…" : subscribed ? "Push connected" : "Enable browser push"}
          </button>
          <button
            type="button"
            onClick={disconnect}
            disabled={status === "loading" || !subscribed}
            className="rounded-lg border border-[var(--card-border)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] disabled:opacity-50"
          >
            Disconnect
          </button>
          <span className="text-xs text-[var(--text-muted)]">
            {subscribed ? "Browser subscription active." : "No browser subscription yet."}
          </span>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={scheduleTestNotification}
            disabled={testPending || status === "loading"}
            className="rounded-lg border border-[var(--card-border)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] disabled:opacity-50"
          >
            {testPending ? "Scheduling…" : "Test notification in 30s"}
          </button>
          <span className="text-xs text-[var(--text-muted)]">
            Schedules a one-off local notification ≈30 seconden later to preview how push looks, even when the PWA is in the background.
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={sendServerPushTest}
            disabled={serverTestPending || status === "loading"}
            className="rounded-lg border border-[var(--card-border)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] disabled:opacity-50"
          >
            {serverTestPending ? "Sending…" : "Server push test"}
          </button>
          <span className="text-xs text-[var(--text-muted)]">
            Sends a real push from the server via APNs. It should arrive even when the PWA is fully closed.
          </span>
        </div>

        {message && (
          <p className={`text-sm ${status === "error" ? "text-red-400" : "text-[var(--text-primary)]"}`} role="status">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
