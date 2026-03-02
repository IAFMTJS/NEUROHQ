"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ensureUserProfileForSession } from "@/app/actions/auth";
import { MascotImg } from "@/components/MascotImg";
import GlassCard from "@/components/ui/GlassCard";
import PrimaryButton from "@/components/ui/PrimaryButton";

/** Form that reads error from URL (useSearchParams); must be inside Suspense for prerender. */
function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const err = searchParams.get("error");
    if (err) setError(decodeURIComponent(err));
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
      await ensureUserProfileForSession();
      // Full page nav so proxy sees cookies; home will redirect to dashboard when authenticated
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
      setLoading(false);
    }
  }

  return (
    <GlassCard className="glass-card glass-card-3d p-6 sm:p-8 rounded-2xl border border-[var(--card-border)]">
      <h2 className="text-center text-sm font-semibold text-[var(--text-secondary)] mb-5">Sign in to your account</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="hq-label block mb-1.5">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-[var(--hq-btn-radius)] border border-[var(--accent-neutral)] bg-[var(--bg-primary)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30 transition"
              placeholder="you@example.com"
              aria-invalid={!!error}
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="password" className="hq-label">Password</label>
              <Link href="/forgot-password" className="text-xs font-medium text-[var(--accent-focus)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)] rounded">
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-[var(--hq-btn-radius)] border border-[var(--accent-neutral)] bg-[var(--bg-primary)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30 transition"
              aria-invalid={!!error}
            />
          </div>
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400" role="alert">
              {error}
            </div>
          )}
          <PrimaryButton type="submit" disabled={loading} className="disabled:opacity-50 disabled:cursor-not-allowed w-full">
            {loading ? "Signing in…" : "Sign in"}
          </PrimaryButton>
        </form>
        <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
          No account?{" "}
          <Link href="/signup" className="font-medium text-[var(--accent-focus)] hover:underline rounded">
            Sign up
          </Link>
        </p>
      </GlassCard>
  );
}

/** Client-side signIn then redirect to / so proxy sees cookies (same flow as when deploy worked). */
export default function LoginPage() {
  return (
    <main
      className="w-full max-w-[420px] hq-card-enter space-y-6"
      style={{ animationDelay: "50ms" }}
      data-ui="dark-commander"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="flex flex-col items-center gap-2">
          <Image
            src="/logo-naam.png"
            alt="NEUROHQ"
            width={280}
            height={74}
            className="h-10 w-auto max-w-[260px] sm:h-12 sm:max-w-[300px] object-contain drop-shadow-[0_0_18px_rgba(56,189,248,0.55)]"
            priority
          />
          <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
            Nervous-system-aware HQ
          </p>
        </div>

        <div className="relative w-full pt-4">
          <Suspense
            fallback={
              <GlassCard className="glass-card glass-card-3d p-6 sm:p-8 rounded-2xl border border-[var(--card-border)] animate-pulse min-h-[280px]" />
            }
          >
            <LoginForm />
          </Suspense>

          <section
            className="login-mascot pointer-events-none absolute left-1/2 top-0 flex -translate-x-1/2 translate-y-[35%] justify-center"
            aria-hidden
          >
            <MascotImg
              page="login"
              className="mascot-img max-h-[140px] w-auto object-contain drop-shadow-[0_18px_45px_rgba(15,23,42,0.85)]"
            />
          </section>
        </div>
      </div>
    </main>
  );
}
