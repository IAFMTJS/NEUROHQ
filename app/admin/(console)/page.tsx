import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminSessionUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const shortcuts = [
  {
    href: "/admin/diagnostics",
    title: "Diagnostiek",
    description: "Controleer platformstatistieken, activiteit en RPC-status.",
    prefetch: false as const,
  },
  {
    href: "/admin/events",
    title: "Events",
    description: "Beheer live platform-events en zichtbaarheid in de app.",
    prefetch: true,
  },
  {
    href: "/admin/games",
    title: "Games",
    description: "Stel games in, configureer regels en koppel quest-prijzen.",
    prefetch: true,
  },
  {
    href: "/admin/quests",
    title: "Quest",
    description: "Bewerk campagnes, planning en inhoud voor quest-dagen.",
    prefetch: true,
  },
] as const;

export default async function AdminHomePage() {
  const admin = await getAdminSessionUser();
  if (!admin) redirect("/admin/login");

  return (
    <>
      <header className="mb-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400/90">Admin home</p>
        <h1 className="text-xl font-semibold text-white">Beheercentrum</h1>
        <p className="mt-1 max-w-2xl text-sm text-white/50">
          Gebruik deze startpagina als hub voor beheer. Open een tab hieronder om direct naar diagnostiek, events, games of quest te gaan.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        {shortcuts.map((shortcut) => (
          <Link
            key={shortcut.href}
            href={shortcut.href}
            prefetch={shortcut.prefetch}
            className="group rounded-xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-amber-500/40 hover:bg-amber-500/5"
          >
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-300/90">{shortcut.title}</p>
            <p className="mt-2 text-sm text-white/65">{shortcut.description}</p>
            <p className="mt-4 text-xs font-semibold text-white/60 transition group-hover:text-amber-200">Openen →</p>
          </Link>
        ))}
      </section>
    </>
  );
}
