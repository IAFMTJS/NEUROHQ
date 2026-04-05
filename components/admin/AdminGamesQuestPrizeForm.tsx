"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { adminUpdateQuestPrizeSummary } from "@/app/actions/quest-campaign";

type QuestOption = { id: string; slug: string; title: string; prize_summary: string | null };

export function AdminGamesQuestPrizeForm({ quests }: { quests: QuestOption[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [campaignId, setCampaignId] = useState(quests[0]?.id ?? "");
  const selected = quests.find((q) => q.id === campaignId) ?? quests[0];
  const [text, setText] = useState(selected?.prize_summary ?? "");

  if (quests.length === 0) {
    return (
      <p className="text-sm text-white/45">
        Geen quest-campagne in de database. Maak er een aan via{" "}
        <a href="/admin/quests" className="text-amber-300 underline underline-offset-2">
          Admin → Quest
        </a>
        .
      </p>
    );
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        setErr(null);
        if (!campaignId) {
          setErr("Kies een campagne.");
          return;
        }
        startTransition(async () => {
          try {
            await adminUpdateQuestPrizeSummary({ campaign_id: campaignId, prize_summary: text });
            router.refresh();
          } catch (er) {
            setErr(er instanceof Error ? er.message : "Opslaan mislukt.");
          }
        });
      }}
    >
      {err ? (
        <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{err}</p>
      ) : null}
      {quests.length > 1 ? (
        <div>
          <label className="mb-1 block text-xs font-medium text-white/50" htmlFor="gq-campaign">
            Campagne
          </label>
          <select
            id="gq-campaign"
            value={campaignId}
            onChange={(e) => {
              const id = e.target.value;
              setCampaignId(id);
              const q = quests.find((x) => x.id === id);
              setText(q?.prize_summary ?? "");
            }}
            className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-amber-500/50"
          >
            {quests.map((q) => (
              <option key={q.id} value={q.id}>
                {q.title} ({q.slug})
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <div>
        <label className="mb-1 block text-xs font-medium text-white/50" htmlFor="gq-prize">
          Prijs / beloning (zichtbaar voor spelers)
        </label>
        <textarea
          id="gq-prize"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Bijv. +1000 XP · +20% flex budget · badge The Unbreakable"
          className="w-full resize-y rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-amber-500/50"
        />
        <p className="mt-1 text-[10px] text-white/35">
          Zelfde tekst als onder Admin → Quest. Leeg = app vult af uit ingestelde XP / flex / badge.
        </p>
      </div>
      <button
        type="submit"
        disabled={pending || !campaignId}
        className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-[#050810] hover:bg-amber-400 disabled:opacity-50"
      >
        {pending ? "Opslaan…" : "Prijs opslaan"}
      </button>
    </form>
  );
}
