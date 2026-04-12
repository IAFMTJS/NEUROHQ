"use client";

import { useTransition, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  adminUpsertQuestCampaign,
  getDefaultQuestContentJson,
  getDictatorQuestContentJson,
} from "@/app/actions/quest-campaign";
import { AdminQuestStopButton } from "@/components/admin/AdminQuestStopButton";
import { AdminQuestContentEditor } from "@/components/admin/AdminQuestContentEditor";
import type { QuestCampaignContent } from "@/lib/quests/types";
import {
  contentToFormattedJson,
  getDefaultContentForEditor,
  parseJsonToContent,
  validateContentForSave,
} from "@/lib/quests/admin-quest-editor-utils";
import {
  KATSUO_ADMIN_ROW_PRESET,
  VIREX_ADMIN_ROW_PRESET,
  rowToAdminPreset,
  type AdminQuestCampaignRowPreset,
} from "@/lib/quests/admin-quest-presets";
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

type EditorMode = "visual" | "json";

function initialCampaignFields(
  row: Row | null,
  suggestedSlug: string | null
): AdminQuestCampaignRowPreset {
  if (row) return rowToAdminPreset(row);
  return {
    ...KATSUO_ADMIN_ROW_PRESET,
    slug: suggestedSlug?.trim() || KATSUO_ADMIN_ROW_PRESET.slug,
  };
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
  const [content, setContent] = useState<QuestCampaignContent | null>(null);
  const [editorMode, setEditorMode] = useState<EditorMode>("visual");
  const [jsonDraft, setJsonDraft] = useState("");
  const [campaignFields, setCampaignFields] = useState<AdminQuestCampaignRowPreset>(() =>
    initialCampaignFields(initialRow, suggestedSlug)
  );

  const applyParsedContent = useCallback((data: QuestCampaignContent) => {
    setContent(data);
    setJsonDraft(contentToFormattedJson(data));
    setErr(null);
  }, []);

  useEffect(() => {
    setCampaignFields(initialCampaignFields(initialRow, suggestedSlug));
  }, [initialRow?.id, suggestedSlug]);

  useEffect(() => {
    if (initialRow?.content != null) {
      try {
        const raw = JSON.stringify(initialRow.content, null, 2);
        const parsed = parseJsonToContent(raw);
        if (parsed.ok) {
          applyParsedContent(parsed.data);
        } else {
          setErr(`Opgeslagen inhoud kon niet worden geladen: ${parsed.error} Pas JSON aan in de tab “Ruwe JSON”.`);
          setJsonDraft(raw);
          setContent(null);
        }
      } catch {
        setContent(null);
        setJsonDraft("{}");
      }
      return;
    }
    void getDefaultQuestContentJson()
      .then((raw) => {
        const parsed = parseJsonToContent(raw);
        if (parsed.ok) applyParsedContent(parsed.data);
        else {
          applyParsedContent(getDefaultContentForEditor());
        }
      })
      .catch(() => applyParsedContent(getDefaultContentForEditor()));
  }, [initialRow, applyParsedContent]);

  const switchToJson = () => {
    if (content) setJsonDraft(contentToFormattedJson(content));
    setEditorMode("json");
  };

  const applyJsonDraft = () => {
    const parsed = parseJsonToContent(jsonDraft);
    if (!parsed.ok) {
      setErr(parsed.error);
      return;
    }
    applyParsedContent(parsed.data);
    setEditorMode("visual");
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setErr(null);
        if (!content) {
          setErr("Quest-inhoud ontbreekt. Laad standaardinhoud of plak geldige JSON.");
          return;
        }
        const v = validateContentForSave(content);
        if (v) {
          setErr(v);
          return;
        }
        const form = e.currentTarget;
        const fd = new FormData(form);
        const slug = campaignFields.slug.trim();
        const title = campaignFields.title.trim();
        const tagline = campaignFields.tagline.trim();
        const startsLocal = String(fd.get("starts_at") ?? "").trim();
        const endsLocal = String(fd.get("ends_at") ?? "").trim();
        const active = fd.get("active") === "on";
        const reward_xp = campaignFields.rewardXp;
        const reward_flex_percent_bp = campaignFields.rewardFlexPercentBp;
        const achievement_key = campaignFields.achievementKey.trim();
        const badge_label = campaignFields.badgeLabel.trim();
        const prize_summary = campaignFields.prizeSummary.trim();

        if (!title) {
          setErr("Titel is verplicht.");
          return;
        }

        const starts_at = startsLocal ? new Date(startsLocal).toISOString() : new Date().toISOString();
        const ends_at = endsLocal ? new Date(endsLocal).toISOString() : null;
        const content_json = contentToFormattedJson(content);

        startTransition(async () => {
          try {
            const { id } = await adminUpsertQuestCampaign({
              slug: slug || undefined,
              title,
              tagline,
              starts_at,
              ends_at,
              active,
              content_json,
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
            value={campaignFields.slug}
            onChange={(e) => setCampaignFields((f) => ({ ...f, slug: e.target.value }))}
            className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 font-mono text-sm text-white outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end sm:pt-6">
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                try {
                  const raw = await getDefaultQuestContentJson();
                  const parsed = parseJsonToContent(raw);
                  if (parsed.ok) {
                    applyParsedContent(parsed.data);
                    setCampaignFields(
                      initialRow
                        ? { ...KATSUO_ADMIN_ROW_PRESET, slug: initialRow.slug }
                        : {
                            ...KATSUO_ADMIN_ROW_PRESET,
                            slug: suggestedSlug?.trim() || KATSUO_ADMIN_ROW_PRESET.slug,
                          }
                    );
                    setEditorMode("visual");
                  } else setErr(parsed.error);
                } catch {
                  setErr("Kon standaardinhoud niet laden.");
                }
              })
            }
            className="rounded-lg border border-white/20 px-3 py-2 text-xs text-white/85 hover:bg-white/10 disabled:opacity-50"
          >
            Standaard Katsuo-quest laden
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                try {
                  const raw = await getDictatorQuestContentJson();
                  const parsed = parseJsonToContent(raw);
                  if (parsed.ok) {
                    applyParsedContent(parsed.data);
                    setCampaignFields(VIREX_ADMIN_ROW_PRESET);
                    setEditorMode("visual");
                  } else setErr(parsed.error);
                } catch {
                  setErr("Kon Dictator-/VIREX-inhoud niet laden.");
                }
              })
            }
            className="rounded-lg border border-rose-500/35 bg-rose-500/10 px-3 py-2 text-xs text-rose-100/95 hover:bg-rose-500/20 disabled:opacity-50"
          >
            VIREX 6-daagse cypher laden
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
            value={campaignFields.title}
            onChange={(e) => setCampaignFields((f) => ({ ...f, title: e.target.value }))}
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
            value={campaignFields.tagline}
            onChange={(e) => setCampaignFields((f) => ({ ...f, tagline: e.target.value }))}
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
            value={campaignFields.prizeSummary}
            onChange={(e) => setCampaignFields((f) => ({ ...f, prizeSummary: e.target.value }))}
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
            value={Number.isFinite(campaignFields.rewardXp) ? campaignFields.rewardXp : 0}
            onChange={(e) =>
              setCampaignFields((f) => ({ ...f, rewardXp: Number(e.target.value) || 0 }))
            }
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
            value={
              Number.isFinite(campaignFields.rewardFlexPercentBp) ? campaignFields.rewardFlexPercentBp : 0
            }
            onChange={(e) =>
              setCampaignFields((f) => ({
                ...f,
                rewardFlexPercentBp: Number(e.target.value) || 0,
              }))
            }
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
            value={campaignFields.achievementKey}
            onChange={(e) => setCampaignFields((f) => ({ ...f, achievementKey: e.target.value }))}
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
            value={campaignFields.badgeLabel}
            onChange={(e) => setCampaignFields((f) => ({ ...f, badgeLabel: e.target.value }))}
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
              gebruik onderaan <strong className="text-white/60">Quest stoppen</strong> (run verwijderen, sjabloon bewaren).
            </span>
          </div>
        </div>

        <div className="sm:col-span-2">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400/90">Quest-inhoud (dagen &amp; antwoorden)</h3>
              <p className="mt-0.5 text-[11px] text-white/40">
                Bewerk per dag: type puzzel, teksten, geaccepteerde antwoorden en feedback na een goede poging.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditorMode("visual");
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  editorMode === "visual"
                    ? "bg-amber-500/25 text-amber-100 ring-1 ring-amber-500/40"
                    : "border border-white/15 text-white/65 hover:bg-white/10"
                }`}
              >
                Visuele editor
              </button>
              <button
                type="button"
                onClick={switchToJson}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  editorMode === "json"
                    ? "bg-amber-500/25 text-amber-100 ring-1 ring-amber-500/40"
                    : "border border-white/15 text-white/65 hover:bg-white/10"
                }`}
              >
                Ruwe JSON
              </button>
            </div>
          </div>

          {editorMode === "visual" ? (
            content ? (
              <AdminQuestContentEditor content={content} onChange={setContent} />
            ) : (
              <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-4 text-sm text-amber-100/90">
                Geen gestructureerde inhoud geladen. Open de tab <strong>Ruwe JSON</strong> om te plakken, of klik{" "}
                <strong>Standaard Katsuo-quest laden</strong> of <strong>VIREX 6-daagse cypher laden</strong>.
              </p>
            )
          ) : (
            <div className="space-y-2 rounded-xl border border-white/10 bg-black/30 p-4">
              <label className="mb-1 block text-xs font-medium text-white/50" htmlFor="qc-json-draft">
                JSON (volledige payload: version, storyEpigraph, days)
              </label>
              <textarea
                id="qc-json-draft"
                value={jsonDraft}
                onChange={(e) => setJsonDraft(e.target.value)}
                rows={22}
                className="w-full resize-y rounded-lg border border-white/15 bg-black/50 px-3 py-2 font-mono text-[11px] leading-relaxed text-white outline-none focus:ring-2 focus:ring-amber-500/50"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-lg bg-amber-500/90 px-3 py-2 text-xs font-semibold text-[#050810] hover:bg-amber-400"
                  onClick={applyJsonDraft}
                >
                  JSON toepassen (terug naar visueel)
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-white/20 px-3 py-2 text-xs text-white/80 hover:bg-white/10"
                  onClick={() => content && setJsonDraft(contentToFormattedJson(content))}
                >
                  Vernieuwen vanuit huidige inhoud
                </button>
              </div>
              <p className="text-[10px] text-white/35">
                Na “Toepassen” wordt de inhoud gevalideerd. Fouten verschijnen rood boven het formulier.
              </p>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
        <button
          type="submit"
          disabled={pending || !content}
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
          Herlaadt het formulier zonder op te slaan. Stopt de quest niet — gebruik <strong>Quest stoppen</strong> / <strong>Stop</strong> in de tabel (run weg, sjabloon blijft).
        </span>
      </div>
    </form>
  );
}
