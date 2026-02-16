import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import GlassCard from "@/components/ui/GlassCard";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="relative min-h-screen">
      <div className="relative z-10 mx-auto flex min-h-screen max-w-[420px] flex-col items-center justify-center p-6">
        <GlassCard className="hq-card-enter w-full max-w-[360px] p-10 text-center">
          <Image src="/app-icon.png" alt="" width={96} height={96} className="mx-auto h-24 w-24 rounded-2xl object-contain" priority />
          <Image src="/logo-naam.png" alt="NEUROHQ" width={220} height={58} className="mx-auto mt-5 h-14 w-auto max-w-[200px] object-contain" priority />
          <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-white/60">Your daily HQ</p>
          <p className="mt-4 text-sm text-white/70">
            The place you open every day. Tasks, energy, learning, finances. Built for focus and energy awareness.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/login" className="neon-button inline-flex min-h-[48px] items-center justify-center px-6 py-2.5 text-sm font-semibold text-white">
              Sign in
            </Link>
            <Link href="/signup" className="inline-flex items-center justify-center rounded-[18px] border border-white/20 bg-transparent px-6 py-2.5 text-sm font-medium text-white">
              Sign up
            </Link>
          </div>
        </GlassCard>
      </div>
    </main>
  );
}
