import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminSessionUser } from "@/lib/admin-auth";
import { AdminGameCreateForm } from "@/components/admin/AdminGameCreateForm";
import { AdminGamesTable } from "@/components/admin/AdminGamesTable";
import { AdminGamesQuestPrizeForm } from "@/components/admin/AdminGamesQuestPrizeForm";
import type { Tables } from "@/types/database.types";

export const dynamic = "force-dynamic";

type GameRow = Tables<"platform_games">;

export default async function AdminGamesPage() {
  const admin = await getAdminSessionUser();
  if (!admin) redirect("/admin/login");

  const supabase = await createClient();
  const { data: rows, error } = await supabase.from("platform_games").select("*").order("starts_at", { ascending: false });

  if (error) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
        <p>Kon games niet laden: {error.message}</p>
        <p className="mt-2 text-xs text-rose-200/80">
          Draai migratie <code className="rounded bg-black/30 px-1">113_platform_games.sql</code> als de tabel nog ontbreekt.
        </p>
      </div>
    );
  }

  const list = (rows ?? []) as GameRow[];

  const { data: questRows, error: questErr } = await supabase
    .from("platform_quest_campaigns")
    .select("id, slug, title, prize_summary")
    .order("starts_at", { ascending: false });

  const questOptions =
    !questErr && questRows
      ? (questRows as { id: string; slug: string; title: string; prize_summary: string | null }[])
      : [];

  return (
    <>
      <header className="mb-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400/90">Games</p>
        <h1 className="text-xl font-semibold text-white">Platform-games</h1>
        <p className="mt-1 max-w-xl text-sm text-white/50">
          Challenges voor alle gebruikers: start/einde, tekst, en win-voorwaarden. Gebruik de{" "}
          <strong className="text-white/70">preset-builder</strong> voor automatische meting (missies, learning, budget, brain
          check-in, streak, …) per <strong className="text-white/70">hele periode</strong>, <strong className="text-white/70">dagelijks</strong>{" "}
          of momentopname — of handmatig JSON met <code className="rounded bg-black/30 px-1 font-mono text-[11px]">progress.mode</code>{" "}
          <code className="text-white/45">checklist</code>, <code className="text-white/45">answer</code> of <code className="text-white/45">auto</code>.
        </p>
      </header>

      <div className="mb-10 rounded-xl border border-violet-500/25 bg-violet-950/20 p-5">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-violet-300/90">Quest — prijs voor spelers</h2>
        <p className="mb-4 max-w-xl text-sm text-white/50">
          Dit is de beloningstekst die bovenaan de quest staat (dashboard 🧩 en profiel). Leeg laten = automatisch uit XP / flex / badge
          op de Quest-tab.
        </p>
        {questErr ? (
          <p className="text-sm text-rose-200">
            Quest-tabel niet bereikbaar: {questErr.message}. Draai migratie <code className="rounded bg-black/30 px-1">114_platform_quest_campaigns.sql</code> en{" "}
            <code className="rounded bg-black/30 px-1">115_quest_prize_summary.sql</code>.
          </p>
        ) : (
          <AdminGamesQuestPrizeForm quests={questOptions} />
        )}
      </div>

      <div className="mb-10 rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-amber-400/90">Nieuwe game</h2>
        <AdminGameCreateForm />
      </div>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-amber-400/90">Bestaande games</h2>
        <AdminGamesTable rows={list} />
      </section>
    </>
  );
}
