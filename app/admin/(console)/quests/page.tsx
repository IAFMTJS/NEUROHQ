import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminSessionUser } from "@/lib/admin-auth";
import { AdminQuestCampaignForm } from "@/components/admin/AdminQuestCampaignForm";
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

      {list.length > 1 ? (
        <p className="mb-4 text-xs text-amber-200/80">
          Meerdere rijen in de database — het formulier toont de meest recente campagne (bovenaan). Overweeg oude rijen te
          deactiveren.
        </p>
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
