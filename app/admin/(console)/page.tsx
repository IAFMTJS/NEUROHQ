import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAdminSessionUser } from "@/lib/admin-auth";
import { AdminDiagnosticsView } from "@/components/admin/AdminDiagnosticsView";

export const dynamic = "force-dynamic";

export default async function AdminDiagnosticsPage() {
  const admin = await getAdminSessionUser();
  if (!admin) redirect("/admin/login");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_platform_diagnostics");

  return (
    <>
      <header className="mb-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400/90">Diagnostiek</p>
        <h1 className="text-xl font-semibold text-white">Platformgebruik</h1>
        <p className="mt-1 max-w-xl text-sm text-white/50">
          Samenvatting van taken, carry-over, budget (inkomsten/uitgaven), dagelijkse state, XP, leren en DCIC. Alleen zichtbaar voor
          beheerders.
        </p>
      </header>

      {error ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
          <p className="font-medium">RPC-fout: {error.message}</p>
          <p className="mt-2 text-xs text-rose-200/80">
            Draai migratie <code className="rounded bg-black/30 px-1">109_admin_platform_diagnostics.sql</code> in Supabase als deze functie nog
            niet bestaat.
          </p>
        </div>
      ) : data ? (
        <AdminDiagnosticsView payload={data} />
      ) : (
        <p className="text-sm text-white/50">Geen data ontvangen.</p>
      )}
    </>
  );
}
