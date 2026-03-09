"use client";

import { useEffect } from "react";
import { ensurePushSubscription, isPushConfigured, supportsPush } from "@/lib/push-client";

const PROMPT_GUARD_KEY = "neurohq-push-prompted-at";
const PROMPT_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

type PushPreferencesResponse = {
  subscribed: boolean;
  pushRemindersEnabled: boolean;
};

export function PushAutoPrompt() {
  useEffect(() => {
    if (!supportsPush() || !isPushConfigured()) return;

    let cancelled = false;
    const maybePrompt = async () => {
      try {
        const res = await fetch("/api/push/preferences", { credentials: "include" });
        if (!res.ok) return;
        const data = (await res.json()) as PushPreferencesResponse;
        if (cancelled || !data.pushRemindersEnabled || data.subscribed) return;

        if (Notification.permission === "denied") return;
        if (Notification.permission === "granted") {
          await ensurePushSubscription();
          return;
        }

        const lastPromptedRaw = window.localStorage.getItem(PROMPT_GUARD_KEY);
        const lastPrompted = lastPromptedRaw ? Number(lastPromptedRaw) : 0;
        if (lastPrompted && Date.now() - lastPrompted < PROMPT_COOLDOWN_MS) return;

        window.localStorage.setItem(PROMPT_GUARD_KEY, String(Date.now()));
        await ensurePushSubscription();
      } catch {
        // Best-effort enhancement only.
      }
    };

    void maybePrompt();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
