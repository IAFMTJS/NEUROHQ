"use client";

import { useCallback, useEffect, useState } from "react";
import { QuestCampaignModal } from "@/components/quests/QuestCampaignModal";
import type { QuestDockPayload } from "@/app/actions/quest-campaign";

async function fetchQuest(): Promise<QuestDockPayload | null> {
  const res = await fetch("/api/quest-campaign?mode=dock", { credentials: "same-origin" });
  if (!res.ok) return null;
  const json = (await res.json()) as { quest?: QuestDockPayload | null };
  return json.quest ?? null;
}

/** Dashboard-only floating opener; hidden when nothing to solve today (correct flow). */
export function QuestCampaignDock() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<QuestDockPayload | null>(null);

  const load = useCallback(() => {
    void fetchQuest().then(setStatus);
  }, []);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;
    const startPolling = () => {
      if (intervalId != null) return;
      intervalId = setInterval(() => {
        if (document.visibilityState !== "visible") return;
        load();
      }, 120_000);
    };
    const stopPolling = () => {
      if (intervalId != null) {
        clearInterval(intervalId);
        intervalId = undefined;
      }
    };
    const onVis = () => {
      if (document.visibilityState === "visible") {
        load();
        startPolling();
      } else {
        stopPolling();
      }
    };
    if (document.visibilityState === "visible") {
      load();
      startPolling();
    }
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [load]);

  if (!status) return null;

  return (
    <>
      {status.showDashboardFab ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="quest-fab group fixed right-[max(12px,env(safe-area-inset-right))] top-[calc(env(safe-area-inset-top,0px)+4.5rem)] z-[45] flex h-14 w-14 items-center justify-center rounded-full border border-violet-300/45 bg-gradient-to-br from-violet-500/95 via-violet-700/90 to-indigo-950/95 text-2xl shadow-[0_4px_0_rgba(49,46,129,0.5),0_12px_40px_rgba(139,92,246,0.42)] outline-none ring-2 ring-violet-400/25 transition hover:scale-[1.06] hover:border-violet-200/55 hover:shadow-[0_4px_0_rgba(49,46,129,0.55),0_16px_48px_rgba(167,139,250,0.5)] focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base,#0f0a1a)]"
          aria-label="Open platformquest"
          title="Platformquest"
        >
          <span className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)] transition group-hover:scale-110" aria-hidden>
            🧩
          </span>
        </button>
      ) : null}
      <QuestCampaignModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
