"use client";

import { useCallback, useEffect, useState } from "react";
import { QuestCampaignModal } from "@/components/quests/QuestCampaignModal";
import type { QuestClientPayload } from "@/app/actions/quest-campaign";

async function fetchQuest(): Promise<QuestClientPayload | null> {
  const res = await fetch("/api/quest-campaign", { credentials: "same-origin" });
  if (!res.ok) return null;
  const json = (await res.json()) as { quest?: QuestClientPayload | null };
  return json.quest ?? null;
}

/** Dashboard-only floating opener; hidden when nothing to solve today (correct flow). */
export function QuestCampaignDock() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<QuestClientPayload | null>(null);

  const load = useCallback(() => {
    void fetchQuest().then(setStatus);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  if (!status) return null;

  return (
    <>
      {status.showDashboardFab ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="quest-fab fixed bottom-[calc(env(safe-area-inset-bottom)+88px)] right-[max(12px,env(safe-area-inset-right))] z-[45] flex h-14 w-14 items-center justify-center rounded-full border border-violet-400/50 bg-gradient-to-br from-violet-600/90 to-indigo-900/95 text-2xl shadow-[0_8px_32px_rgba(139,92,246,0.45)] outline-none transition hover:scale-[1.04] hover:border-violet-300/70 focus-visible:ring-2 focus-visible:ring-violet-400/80"
          aria-label="Open platformquest"
          title="Quest"
        >
          <span aria-hidden>🧩</span>
        </button>
      ) : null}
      <QuestCampaignModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
