"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import GlassCard from "@/components/ui/GlassCard";
import PrimaryButton from "@/components/ui/PrimaryButton";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.signUp({ email, password });
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
      setLoading(false);
      return;
    }
    setLoading(false);
  }

  if (success) {
    return (
      <main className="w-full max-w-[420px] hq-card-enter" data-ui="dark-commander">
        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <Image src="/app-icon.png" alt="" width={96} height={96} className="h-24 w-24 rounded-2xl object-contain" priority />
            <Image src="/logo-naam.png" alt="NEUROHQ" width={220} height={58} className="h-14 w-auto max-w-[200px] object-contain" priority />
            <p className="text-xs font-semibold uppercase tracking-widest text-white/60">Your daily HQ</p>
          </div>
          <GlassCard className="w-full max-w-[360px] p-8 text-center rounded-2xl border border-[var(--card-border)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-energy)]/20 text-[var(--accent-energy)]" aria-hidden>
              <span className="text-2xl">✓</span>
            </div>
            <h1 className="mt-5 hq-h2">Check your email</h1>
            <p className="mt-3 text-sm text-[var(--text-muted)] leading-relaxed">
              We sent a confirmation link to <span className="font-medium text-[var(--text-primary)]">{email}</span>. Click it to activate your account, then sign in.
            </p>
            <Link href="/login" className="neon-button mt-6 inline-flex min-h-[48px] w-full items-center justify-center px-6 py-2.5 text-sm font-semibold text-white rounded-[var(--hq-btn-radius)]">
              Back to sign in
            </Link>
          </GlassCard>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full max-w-[420px] hq-card-enter" style={{ animationDelay: "50ms" }} data-ui="dark-commander">
      <div className="flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2">
          <Image src="/app-icon.png" alt="" width={96} height={96} className="h-24 w-24 rounded-2xl object-contain" priority />
          <Image src="/logo-naam.png" alt="NEUROHQ" width={220} height={58} className="h-14 w-auto max-w-[200px] object-contain" priority />
          <p className="text-xs font-semibold uppercase tracking-widest text-white/60">Your daily HQ</p>
        </div>

        <GlassCard className="w-full max-w-[360px] p-8 rounded-2xl border border-[var(--card-border)]">
          <h2 className="text-center text-sm font-semibold text-[var(--text-secondary)] mb-6">Create your account</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="signup-email" className="hq-label block mb-1.5">Email</label>
              <input
                id="signup-email"
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
              <label htmlFor="signup-password" className="hq-label block mb-1.5">
                Password <span className="font-normal text-[var(--text-muted)]">(at least 6 characters)</span>
              </label>
              <input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-[var(--hq-btn-radius)] border border-[var(--accent-neutral)] bg-[var(--bg-primary)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30 transition"
                placeholder="At least 6 characters"
                aria-invalid={!!error}
              />
            </div>
            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400" role="alert">
                {error}
              </div>
            )}
            <PrimaryButton type="submit" disabled={loading} className="disabled:opacity-50 disabled:cursor-not-allowed w-full">
              {loading ? "Creating account…" : "Sign up"}
            </PrimaryButton>
          </form>
          <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-[var(--accent-focus)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-focus)] focus-visible:ring-offset-2 rounded">
              Sign in
            </Link>
          </p>
        </GlassCard>
      </div>
    </main>
  );
}
