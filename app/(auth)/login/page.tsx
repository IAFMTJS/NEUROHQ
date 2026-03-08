"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ensureUserProfileForSession } from "@/app/actions/auth";
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
      // Delay so the session cookie is committed before the next request (reduces "client-side exception" after redirect on slow networks)
      await new Promise((r) => setTimeout(r, 400));
      window.location.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="login-email" className="hq-label block mb-1.5">Email</label>
        <input
          id="login-email"
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
          <label htmlFor="login-password" className="hq-label">Password</label>
          <Link href="/forgot-password" className="text-xs font-medium text-[var(--accent-focus)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)] rounded">
            Forgot password?
          </Link>
        </div>
        <input
          id="login-password"
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
  );
}

/** Login: same layout as home (one card, logo, one primary CTA). Redirect goes to /dashboard after a short delay so session is recognized. */
export default function LoginPage() {
  return (
    <main
      className="w-full max-w-[420px] hq-card-enter space-y-6"
      style={{ animationDelay: "50ms" }}
      data-ui="dark-commander"
    >
      <div className="flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2">
          <Image
            src="/app-icon.png"
            alt=""
            width={96}
            height={96}
            className="h-24 w-24 rounded-2xl object-contain"
            priority
          />
          <Image
            src="/logo-naam.png"
            alt="NEUROHQ"
            width={220}
            height={58}
            className="h-14 w-auto max-w-[200px] object-contain"
            priority
          />
          <p className="text-xs font-semibold uppercase tracking-widest text-white/60">Your daily HQ</p>
        </div>

        <GlassCard className="w-full max-w-[360px] p-8 rounded-2xl border border-[var(--card-border)]">
          <h2 className="text-center text-sm font-semibold text-[var(--text-secondary)] mb-6">Sign in to your account</h2>
          <Suspense
            fallback={
              <div className="space-y-5 animate-pulse">
                <div className="h-10 rounded bg-white/10" />
                <div className="h-10 rounded bg-white/10" />
                <div className="h-12 rounded bg-white/10" />
              </div>
            }
          >
            <LoginForm />
          </Suspense>
          <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
            No account?{" "}
            <Link href="/signup" className="font-medium text-[var(--accent-focus)] hover:underline rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-focus)] focus-visible:ring-offset-2 rounded">
              Sign up
            </Link>
          </p>
        </GlassCard>
      </div>
    </main>
  );
}
