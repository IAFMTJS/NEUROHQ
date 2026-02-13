import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="relative min-h-screen">
      <div className="hq-bg-layer" aria-hidden />
      <div className="hq-vignette" aria-hidden />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-[420px] flex-col items-center justify-center p-6">
        <div className="hq-card hq-card-enter w-full max-w-[360px] rounded-[var(--hq-card-radius)] p-10 text-center shadow-[var(--card-shadow)]">
          <Image src="/app-icon.png" alt="" width={96} height={96} className="mx-auto h-24 w-24 rounded-2xl object-contain" priority />
          <Image src="/logo-naam.png" alt="NEUROHQ" width={220} height={58} className="mx-auto mt-5 h-14 w-auto max-w-[200px] object-contain" priority />
          <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">Your daily HQ</p>
          <p className="mt-4 text-sm text-[var(--text-muted)]">
            The place you open every day. Tasks, energy, learning, finances. Built for focus and energy awareness.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/login" className="btn-hq-primary inline-flex items-center justify-center rounded-[var(--hq-btn-radius)] px-6 py-2.5 text-sm font-medium">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-[var(--hq-btn-radius)] border border-[var(--accent-neutral)] bg-transparent px-6 py-2.5 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--accent-neutral)]/20 hover:border-[var(--accent-focus)]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
