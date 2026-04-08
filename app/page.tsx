import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AuthMascotShell } from "@/components/auth/AuthMascotShell";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="relative min-h-screen">
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[760px] flex-col items-center justify-center p-6">
        <AuthMascotShell className="hq-card-enter">
          <div className="-mt-20 mb-0.5 flex justify-center sm:-mt-24">
            <img
              src="/logo-naam.png"
              alt="NEUROHQ"
              className="h-auto w-full max-w-[190px] select-none object-contain opacity-95"
              draggable={false}
            />
          </div>
          <p className="mb-1 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Welcome to NEUROHQ
          </p>
          <h1 className="text-center text-base font-semibold text-[var(--text-primary)] sm:text-lg">
            Your daily command center
          </h1>
          <p className="mt-3 text-center text-sm text-[var(--text-muted)]">
            The place you open every day. Tasks, energy, learning and finances built for focused execution.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="neon-button inline-flex min-h-[48px] items-center justify-center px-6 py-2.5 text-sm font-semibold text-white"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex min-h-[48px] items-center justify-center rounded-[18px] bg-white/10 px-6 py-2.5 text-sm font-medium text-white hover:bg-white/15"
            >
              Sign up
            </Link>
          </div>
        </AuthMascotShell>
      </div>
    </main>
  );
}
