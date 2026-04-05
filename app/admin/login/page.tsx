import Image from "next/image";
import Link from "next/link";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminLoginPage({ searchParams }: Props) {
  const resolved = await searchParams;
  const errorParam = resolved?.error;
  const initialError =
    typeof errorParam === "string" && errorParam.length > 0 ? errorParam : null;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 px-4 py-12">
      <div className="flex flex-col items-center gap-3 text-center">
        <Image src="/app-icon.png" alt="" width={72} height={72} className="h-[72px] w-[72px] rounded-2xl" priority />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400/90">Beheerdersconsole</p>
        <h1 className="text-lg font-semibold text-white">NEUROHQ admin</h1>
        <p className="text-xs text-white/50">Aparte login. Alleen accounts met rol admin in de database.</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-xl backdrop-blur-md">
        <AdminLoginForm initialError={initialError} />
      </div>

      <p className="text-center text-xs text-white/40">
        <Link href="/login" className="text-[var(--accent-focus)] hover:underline">
          Terug naar normale inlog
        </Link>
      </p>
    </main>
  );
}
