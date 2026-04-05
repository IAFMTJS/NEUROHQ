"use client";

import { useTransition, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminUpsertQuestCampaign, getDefaultQuestContentJson } from "@/app/actions/quest-campaign";
import { AdminQuestStopButton } from "@/components/admin/AdminQuestStopButton";
import type { Tables } from "@/types/database.types";

type Row = Tables<"platform_quest_campaigns">;

type FormProps = {
  initialRow: Row | null;
  /** Bij nieuwe campagne (naast bestaande): unieke slug zodat opslaan niet per ongeluk de default-slug overschrijft. */
  suggestedSlug?: string | null;
  /** Standaardwaarde checkbox Actief als er nog geen rij is. */
  defaultActiveChecked: boolean;
  submitButtonLabel: string;
};

function isoToDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AdminQuestCampaignForm({
  initialRow,
  suggestedSlug = null,
  defaultActiveChecked,
  submitButtonLabel,
}: FormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [contentJson, setContentJson] = useState("{}");

  useEffect(() => {
    if (initialRow?.content != null) {
      try {
        setContentJson(JSON.stringify(initialRow.content, null, 2));
      } catch {
        setContentJson("{}");
      }
      return;
    }
    void getDefaultQuestContentJson()
      .then(setContentJson)
      .catch(() => setContentJson("{}"));
  }, [initialRow]);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setErr(null);
        const form = e.currentTarget;
        const fd = new FormData(form);
        const slug = String(fd.get("slug") ?? "").trim();
        const title = String(fd.get("title") ?? "").trim();
        const tagline = String(fd.get("tagline") ?? "").trim();
        const startsLocal = String(fd.get("starts_at") ?? "").trim();
        const endsLocal = String(fd.get("ends_at") ?? "").trim();
        const active = fd.get("active") === "on";
        const reward_xp = Number(fd.get("reward_xp") ?? 1000);
        const reward_flex_percent_bp = Number(fd.get("reward_flex_bp") ?? 2000);
        const achievement_key = String(fd.get("achievement_key") ?? "").trim();
        const badge_label = String(fd.get("badge_label") ?? "").trim();
        const prize_summary = String(fd.get("prize_summary") ?? "").trim();

        if (!title) {
          setErr("Titel is verplicht.");
          return;
        }

        const starts_at = startsLocal ? new Date(startsLocal).toISOString() : new Date().toISOString();
        const ends_at = endsLocal ? new Date(endsLocal).toISOString() : null;

        startTransition(async () => {
          try {
            const { id } = await adminUpsertQuestCampaign({
              slug: slug || undefined,
              title,
              tagline,
              starts_at,
              ends_at,
              active,
              content_json: contentJson,
              reward_xp: Number.isFinite(reward_xp) ? reward_xp : 1000,
              reward_flex_percent_bp: Number.isFinite(reward_flex_percent_bp) ? reward_flex_percent_bp : 2000,
              achievement_key,
              badge_label,
              prize_summary: prize_summary || null,
            });
            router.push(`/admin/quests?campaign=${encodeURIComponent(id)}`);
            router.refresh();
          } catch (er) {
            setErr(er instanceof Error ? er.message : "Opslaan mislukt.");
          }
        });
      }}
    >
      {err ? (
        <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100" role="alert">
          {err}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-white/50" htmlFor="qc-slug">
            Slug
          </label>
          <input
            id="qc-slug"
            name="slug"
            defaultValue={initialRow?.slug ?? suggestedSlug ?? "katsuo-ji"}
            className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 font-mono text-sm text-white outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </div>
        <div className="flex items-center gap-2 sm:col-span-1 sm:justify-end sm:pt-6">
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                try {
                  const json = await getDefaultQuestContentJson();
                  setContentJson(json);
                } catch {
                  setErr("Kon standaardinhoud niet laden.");
                }
              })
            }
            className="rounded-lg border border-white/20 px-3 py-2 text-xs text-white/85 hover:bg-white/10 disabled:opacity-50"
          >
            Standaard Katsuo-inhoud (JSON)
          </button>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-white/50" htmlFor="qc-title">
            Titel
          </label>
          <input
            id="qc-title"
            name="title"
            required
            defaultValue={initialRow?.title ?? "De weg van discipline"}
            className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-white/50" htmlFor="qc-tagline">
            Ondertitel
          </label>
          <input
            id="qc-tagline"
            name="tagline"
            defaultValue={initialRow?.tagline ?? "Tien dagen — van continent tot coördinaat."}
            className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-white/50" htmlFor="qc-prize">
            Prijs (zichtbaar voor spelers aan het begin)
          </label>
          <textarea
            id="qc-prize"
            name="prize_summary"
            rows={2}
            defaultValue={initialRow?.prize_summary ?? ""}
            placeholder="Bijv. +1000 XP · +20% flex · badge The Unbreakable"
            className="w-full resize-y rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-amber-500/50"
          />
          <p className="mt-1 text-[10px] text-white/35">Leeg laten = automatisch uit XP / flex / badge hieronder.</p>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-white/50" htmlFor="qc-starts">
            Start (lokaal)
          </label>
          <input
            id="qc-starts"
            name="starts_at"
            type="datetime-local"
            defaultValue={initialRow ? isoToDatetimeLocal(initialRow.starts_at) : ""}
            className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-white/50" htmlFor="qc-ends">
            Einde (lokaal, optioneel)
          </label>
          <input
            id="qc-ends"
            name="ends_at"
            type="datetime-local"
            defaultValue={initialRow?.ends_at ? isoToDatetimeLocal(initialRow.ends_at) : ""}
            className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-white/50" htmlFor="qc-xp">
            Finale XP
          </label>
          <input
            id="qc-xp"
            name="reward_xp"
            type="number"
            min={0}
            defaultValue={initialRow?.reward_xp ?? 1000}
            className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-white/50" htmlFor="qc-flex">
            Flex bonus (% van maandcap, 20 = 2000 bp)
          </label>
          <input
            id="qc-flex"
            name="reward_flex_bp"
            type="number"
            min={0}
            max={10000}
            defaultValue={initialRow?.reward_flex_percent_bp ?? 2000}
            className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-amber-500/50"
          />
          <p className="mt-1 text-[10px] text-white/35">Opgeslagen als basispunten: 2000 = 20,00%.</p>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-white/50" htmlFor="qc-ach">
            Achievement key
          </label>
          <input
            id="qc-ach"
            name="achievement_key"
            defaultValue={initialRow?.achievement_key ?? "the_unbreakable"}
            className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 font-mono text-sm text-white outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-white/50" htmlFor="qc-badge">
            Badge label
          </label>
          <input
            id="qc-badge"
            name="badge_label"
            defaultValue={initialRow?.badge_label ?? "The Unbreakable"}
            className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </div>
        <div className="space-y-3 sm:col-span-2 rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              id="qc-active"
              name="active"
              type="checkbox"
              defaultChecked={initialRow?.active ?? defaultActiveChecked}
              className="h-4 w-4 rounded border-white/30"
            />
            <label htmlFor="qc-active" className="text-sm text-white/70">
              Actief
            </label>
            <span className="text-xs text-white/40">
              Uitgeschakeld = verborgen voor spelers. Voor <strong className="text-white/60">onmiddellijk beëindigen</strong>{" "}
              gebruik onderaan <strong className="text-white/60">Quest stoppen</strong> (zet actief uit + eindigt nu).
            </span>
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-white/50" htmlFor="qc-json">
            Quest JSON (dagen, raadsels, accepts)
          </label>
          <textarea
            id="qc-json"
            value={contentJson}
            onChange={(e) => setContentJson(e.target.value)}
            rows={18}
            className="w-full resize-y rounded-lg border border-white/15 bg-black/40 px-3 py-2 font-mono text-[11px] leading-relaxed text-white outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-[#050810] hover:bg-amber-400 disabled:opacity-50"
        >
          {pending ? "Opslaan…" : submitButtonLabel}
        </button>
        {initialRow?.id ? (
          <AdminQuestStopButton campaignId={initialRow.id} slug={initialRow.slug ?? undefined} onError={setErr} />
        ) : null}
        <button
          type="button"
          disabled={pending}
          onClick={() => window.location.reload()}
          className="rounded-lg border border-white/25 px-4 py-2 text-sm text-white/80 hover:bg-white/10 disabled:opacity-50"
        >
          Wijzigingen negeren (herladen)
        </button>
        <span className="text-[11px] text-white/35">
          Herlaadt het formulier zonder op te slaan. Stopt de quest niet — gebruik <strong>Quest stoppen</strong> / <strong>Stop</strong> in de tabel.
        </span>
      </div>
    </form>
  );
}
