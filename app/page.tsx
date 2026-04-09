import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AuthMascotShell } from "@/components/auth/AuthMascotShell";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth
    .getUser()
    .catch(() => ({ data: { user: null } }));
  if (user) redirect("/dashboard");

  return (
    <main className="relative min-h-screen overflow-hidden bg-transparent">
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <AuthMascotShell className="hq-card-enter">
          <div className="mb-3 flex justify-center">
            <img
              src="/logo-naam.png"
              alt="NEUROHQ"
              className="h-auto w-full max-w-[160px] select-none object-contain opacity-95"
              draggable={false}
            />
          </div>
          <p className="text-center text-xs font-semibold uppercase tracking-[0.28em] text-violet-100/85">
            Welcome to NEUROHQ
          </p>
          <p className="mt-1 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-200/65">
            Daily command center
          </p>
          <h1 className="mt-3 text-center text-base font-semibold text-violet-50 sm:text-lg">
            Your daily command center
          </h1>
          <p className="mt-2 text-center text-sm leading-relaxed text-violet-100/75">
            The place you open every day. Tasks, energy, learning and finances built for focused execution.
          </p>
          <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="neon-button inline-flex min-h-[48px] items-center justify-center px-6 py-2.5 text-sm font-semibold text-white"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-violet-300/35 bg-violet-950/35 px-6 py-2.5 text-sm font-medium text-violet-100 hover:bg-violet-900/45 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/45"
            >
              Sign up
            </Link>
          </div>
        </AuthMascotShell>
      </div>
    </main>
  );
}
