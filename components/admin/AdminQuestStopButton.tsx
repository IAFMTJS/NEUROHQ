"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { adminStopQuestCampaign } from "@/app/actions/quest-campaign";

type Props = {
  campaignId: string;
  slug?: string;
  /** compact = alleen icoon-achtige knop in tabel */
  variant?: "default" | "compact";
  /** Bijv. formulier: fout in bestaande alert-balk i.p.v. window.alert */
  onError?: (message: string) => void;
};

export function AdminQuestStopButton({ campaignId, slug, variant = "default", onError }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function runStop() {
    const label = slug ? `“${slug}”` : "deze campagne";
    if (
      !confirm(
        `${label} nu stoppen? De actieve quest-run verdwijnt voor spelers; alle quest-voortgang voor deze run wordt gewist. Er blijft een inactief sjabloon (zelfde inhoud) om later opnieuw in te plannen. Reeds toegekende finale-XP of achievements worden niet teruggedraaid.`
      )
    ) {
      return;
    }
    startTransition(async () => {
      try {
        const { id } = await adminStopQuestCampaign(campaignId);
        router.push(`/admin/quests?campaign=${encodeURIComponent(id)}`);
        router.refresh();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Stoppen mislukt.";
        if (onError) onError(msg);
        else alert(msg);
      }
    });
  }

  if (variant === "compact") {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={runStop}
        className="rounded border border-rose-500/40 bg-rose-500/15 px-2 py-1 text-[11px] font-semibold text-rose-100 hover:bg-rose-500/25 disabled:opacity-50"
      >
        {pending ? "…" : "Stop"}
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={runStop}
      className="rounded-lg border border-rose-500/50 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-100 hover:bg-rose-500/20 disabled:opacity-50"
    >
      {pending ? "Stoppen…" : "Quest stoppen"}
    </button>
  );
}
