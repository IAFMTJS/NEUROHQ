import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminSessionUser } from "@/lib/admin-auth";
import { AdminQuestCampaignForm } from "@/components/admin/AdminQuestCampaignForm";
import { AdminQuestStopButton } from "@/components/admin/AdminQuestStopButton";
import type { Tables } from "@/types/database.types";

export const dynamic = "force-dynamic";

type Row = Tables<"platform_quest_campaigns">;

export default async function AdminQuestsPage() {
  const admin = await getAdminSessionUser();
  if (!admin) redirect("/admin/login");

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

  return (
    <>
      <header className="mb-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400/90">Quest</p>
        <h1 className="text-xl font-semibold text-white">Multi-day platformquest</h1>
        <p className="mt-1 max-w-2xl text-sm text-white/50">
          Bewerk inhoud (JSON), start- en eindtijd, beloningen en badge. Gebruikers zien een 🧩-icoon op het dashboard
          wanneer er die dag iets open staat; op het profiel blijft de quest altijd bereikbaar tijdens het event.
        </p>
      </header>

      {list.length > 0 ? (
        <div className="mb-6 overflow-x-auto rounded-xl border border-white/10 bg-white/[0.03]">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm text-white/85">
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
              {list.map((row) => (
                <tr key={row.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-2 font-mono text-xs text-white/90">{row.slug}</td>
                  <td className="px-4 py-2">{row.active ? "ja" : "nee"}</td>
                  <td className="px-4 py-2 text-xs text-white/60">{row.starts_at?.slice(0, 16) ?? "—"}</td>
                  <td className="px-4 py-2 text-xs text-white/60">{row.ends_at?.slice(0, 16) ?? "—"}</td>
                  <td className="px-4 py-2 text-right">
                    <AdminQuestStopButton campaignId={row.id} slug={row.slug} variant="compact" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length > 1 ? (
            <p className="border-t border-white/10 px-4 py-2 text-[11px] text-amber-200/80">
              Het formulier hieronder bewerkt de meest recente campagne (eerste rij). Gebruik <strong>Stop</strong> per rij om
              een andere campagne direct te beëindigen.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-amber-400/90">
          {primary ? `Campagne bewerken (${primary.slug})` : "Nieuwe campagne"}
        </h2>
        <AdminQuestCampaignForm key={primary ? `${primary.id}-${primary.active}-${primary.ends_at ?? ""}` : "new"} initialRow={primary} />
      </div>
    </>
  );
}
