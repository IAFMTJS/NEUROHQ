import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-neuro-dark">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(88,166,255,0.06),transparent_50%)]" aria-hidden />
      <div className="relative mx-auto flex min-h-screen max-w-[420px] flex-col items-center justify-center p-6">
        <div className="card-modern w-full max-w-[360px] p-10 text-center shadow-xl">
          <Image src="/app-icon.png" alt="" width={96} height={96} className="mx-auto h-24 w-24 rounded-2xl object-contain" priority />
          <Image src="/logo-naam.png" alt="NEUROHQ" width={220} height={58} className="mx-auto mt-5 h-14 w-auto max-w-[200px] object-contain" priority />
          <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-neuro-muted">Your daily HQ</p>
          <p className="mt-4 text-sm text-neuro-muted">
            The place you open every day. Tasks, energy, learning, finances. Built for focus and energy awareness.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/login" className="btn-primary inline-flex items-center justify-center px-5 py-2.5 text-sm">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg border border-neuro-border bg-transparent px-5 py-2.5 text-sm font-medium text-neuro-silver transition hover:bg-neuro-border/50 hover:border-neuro-border"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
