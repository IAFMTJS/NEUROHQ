import { randomBytes } from "crypto";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminSessionUser } from "@/lib/admin-auth";
import { AdminQuestCampaignForm } from "@/components/admin/AdminQuestCampaignForm";
import { AdminQuestStopButton } from "@/components/admin/AdminQuestStopButton";
import type { Tables } from "@/types/database.types";

export const dynamic = "force-dynamic";

type Row = Tables<"platform_quest_campaigns">;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Props = { searchParams: Promise<{ new?: string; campaign?: string }> };

export default async function AdminQuestsPage({ searchParams }: Props) {
  const admin = await getAdminSessionUser();
  if (!admin) redirect("/admin/login");

  const sp = await searchParams;
  const wantsNew = sp.new === "1" || sp.new === "true";
  const campaignParam = typeof sp.campaign === "string" ? sp.campaign.trim() : "";

  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("platform_quest_campaigns")
    .select("*")
    .order("starts_at", { ascending: false });

  if (error) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
        <p>Kon quest-campagnes niet laden: {error.message}</p>
        <p className="mt-2 text-xs text-rose-200/80">
          Draai migratie <code className="rounded bg-black/30 px-1">114_platform_quest_campaigns.sql</code>.
        </p>
      </div>
    );
  }

  const list = (rows ?? []) as Row[];
  const primary = list[0] ?? null;

  let formRow: Row | null = null;
  let suggestedSlug: string | null = null;
  let invalidCampaignParam = false;

  if (wantsNew) {
    formRow = null;
    suggestedSlug = `quest-${randomBytes(4).toString("hex")}`;
  } else if (campaignParam && UUID_RE.test(campaignParam)) {
    const found = list.find((r) => r.id === campaignParam) ?? null;
    if (found) {
      formRow = found;
    } else {
      invalidCampaignParam = true;
      formRow = primary;
    }
  } else {
    formRow = primary;
  }

  const defaultActiveChecked = formRow != null ? formRow.active : list.length === 0;
  const submitButtonLabel =
    formRow == null && list.length > 0 && wantsNew ? "Nieuwe campagne aanmaken" : "Campagne opslaan";
  let formHeading: string;
  if (formRow) {
    formHeading = `Campagne bewerken (${formRow.slug})`;
  } else {
    formHeading = "Nieuwe campagne";
  }

  const formKey = formRow
    ? `${formRow.id}-${formRow.active}-${formRow.ends_at ?? ""}-${formRow.updated_at ?? ""}`
    : wantsNew
      ? `new-${suggestedSlug ?? "x"}`
      : "empty-first";

  return (
    <>
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400/90">Quest</p>
          <h1 className="text-xl font-semibold text-white">Multi-day platformquest</h1>
          <p className="mt-1 max-w-2xl text-sm text-white/50">
            Bewerk inhoud (JSON), start- en eindtijd, beloningen en badge. Gebruikers zien een 🧩-icoon op het dashboard
            wanneer er die dag iets open staat; op het profiel blijft de quest altijd bereikbaar tijdens het event.
          </p>
        </div>
        <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
          <Link
            href="/admin/quests?new=1"
            className="rounded-lg border border-amber-500/50 bg-amber-500/15 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-500/25"
          >
            + Nieuwe campagne
          </Link>
          {(wantsNew || campaignParam) && (
            <Link
              href="/admin/quests"
              className="rounded-lg border border-white/20 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
            >
              Standaardweergave
            </Link>
          )}
        </div>
      </header>

      {invalidCampaignParam ? (
        <p className="mb-4 rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-sm text-amber-100/95">
          Campagne-id niet gevonden.{" "}
          <Link href="/admin/quests" className="font-semibold text-amber-50 underline underline-offset-2">
            Terug naar de lijst
          </Link>
          .
        </p>
      ) : null}

      <div className="mb-6 overflow-x-auto rounded-xl border border-white/10 bg-white/[0.03]">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm text-white/85">
          <thead>
            <tr className="border-b border-white/10 text-[10px] font-bold uppercase tracking-wider text-amber-400/90">
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Actief</th>
              <th className="px-4 py-3">Start</th>
              <th className="px-4 py-3">Einde</th>
              <th className="px-4 py-3 text-right">Acties</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-white/45">
                  Nog geen campagnes. Vul het formulier hieronder in of gebruik{" "}
                  <Link href="/admin/quests?new=1" className="text-amber-200/90 underline underline-offset-2">
                    Nieuwe campagne
                  </Link>
                  .
                </td>
              </tr>
            ) : (
              list.map((row) => (
                <tr key={row.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-2 font-mono text-xs text-white/90">{row.slug}</td>
                  <td className="px-4 py-2">{row.active ? "ja" : "nee"}</td>
                  <td className="px-4 py-2 text-xs text-white/60">{row.starts_at?.slice(0, 16) ?? "—"}</td>
                  <td className="px-4 py-2 text-xs text-white/60">{row.ends_at?.slice(0, 16) ?? "—"}</td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Link
                        href={`/admin/quests?campaign=${encodeURIComponent(row.id)}`}
                        className="rounded border border-white/20 bg-white/5 px-2 py-1 text-[11px] font-semibold text-white/90 hover:bg-white/10"
                      >
                        Bewerken
                      </Link>
                      <AdminQuestStopButton campaignId={row.id} slug={row.slug} variant="compact" />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {list.length > 1 ? (
          <p className="border-t border-white/10 px-4 py-2 text-[11px] text-amber-200/80">
            Kies <strong>Bewerken</strong> om een campagne te laden in het formulier, of <strong>+ Nieuwe campagne</strong> voor een
            lege rij met een nieuwe slug. Alleen één actieve campagne tegelijk in het live-venster is gebruikelijk.
          </p>
        ) : null}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-amber-400/90">{formHeading}</h2>
        <AdminQuestCampaignForm
          key={formKey}
          initialRow={formRow}
          suggestedSlug={suggestedSlug}
          defaultActiveChecked={defaultActiveChecked}
          submitButtonLabel={submitButtonLabel}
        />
      </div>
    </>
  );
}
