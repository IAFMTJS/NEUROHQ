import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminSessionUser } from "@/lib/admin-auth";
import { AdminEventCreateForm } from "@/components/admin/AdminEventCreateForm";
import { AdminEventRowActions } from "@/components/admin/AdminEventRowActions";
import type { Tables } from "@/types/database.types";

export const dynamic = "force-dynamic";

type EventRow = Tables<"platform_events">;

export default async function AdminEventsPage() {
  const admin = await getAdminSessionUser();
  if (!admin) redirect("/admin/login");

  const supabase = await createClient();
  const { data: rows, error } = await supabase.from("platform_events").select("*").order("starts_at", { ascending: false });

  if (error) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
        <p>Kon events niet laden: {error.message}</p>
        <p className="mt-2 text-xs text-rose-200/80">
          Draai migratie <code className="rounded bg-black/30 px-1">110_platform_events.sql</code> als de tabel nog ontbreekt.
        </p>
      </div>
    );
  }

  const list = (rows ?? []) as EventRow[];

  return (
    <>
      <header className="mb-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400/90">Events</p>
        <h1 className="text-xl font-semibold text-white">Platform-events</h1>
        <p className="mt-1 max-w-xl text-sm text-white/50">
          Berichten die bij elke ingelogde gebruiker bovenaan de app verschijnen zolang ze actief zijn en binnen start- en eindtijd vallen.
        </p>
      </header>

      <div className="mb-10 rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-amber-400/90">Nieuw event</h2>
        <AdminEventCreateForm />
      </div>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-amber-400/90">Bestaande events</h2>
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase tracking-wide text-white/45">
                <th className="px-3 py-2 font-medium">Titel</th>
                <th className="px-3 py-2 font-medium">Start</th>
                <th className="px-3 py-2 font-medium">Einde</th>
                <th className="px-3 py-2 font-medium">Actief</th>
                <th className="px-3 py-2 font-medium">Live nu</th>
                <th className="px-3 py-2 font-medium w-48">Acties</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-white/45">
                    Nog geen events. Voeg er een toe hierboven.
                  </td>
                </tr>
              ) : (
                list.map((ev) => {
                  const now = Date.now();
                  const live =
                    ev.active &&
                    new Date(ev.starts_at).getTime() <= now &&
                    (ev.ends_at == null || new Date(ev.ends_at).getTime() >= now);
                  return (
                    <tr key={ev.id} className="border-b border-white/[0.06] align-top">
                      <td className="px-3 py-2">
                        <div className="font-medium text-white">{ev.title}</div>
                        <div className="mt-1 line-clamp-2 max-w-md text-xs text-white/50 whitespace-pre-wrap">{ev.body}</div>
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-white/70">{formatNl(ev.starts_at)}</td>
                      <td className="px-3 py-2 font-mono text-xs text-white/70">{ev.ends_at ? formatNl(ev.ends_at) : "—"}</td>
                      <td className="px-3 py-2 text-xs">{ev.active ? "ja" : "nee"}</td>
                      <td className="px-3 py-2 text-xs">{live ? <span className="text-emerald-400">ja</span> : <span className="text-white/40">nee</span>}</td>
                      <td className="px-3 py-2">
                        <AdminEventRowActions id={ev.id} active={ev.active} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function formatNl(iso: string) {
  try {
    return new Date(iso).toLocaleString("nl-NL", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}
