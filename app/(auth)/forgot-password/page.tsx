"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { IconHQ } from "@/components/hq/NavIcons";
import GlassCard from "@/components/ui/GlassCard";
import PrimaryButton from "@/components/ui/PrimaryButton";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/login`,
      });
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
    setLoading(false);
  }

  if (sent) {
    return (
      <main className="w-full max-w-[380px] hq-card-enter">
        <GlassCard className="p-8 text-center">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-energy)]/20 text-[var(--accent-energy)]"
            aria-hidden
          >
            <span className="text-2xl">✓</span>
          </div>
          <h1 className="mt-5 hq-h2">Check your email</h1>
          <p className="mt-3 text-sm text-[var(--text-muted)] leading-relaxed">
            We sent a password reset link to{" "}
            <span className="font-medium text-[var(--text-primary)]">{email}</span>. Click it to set a new
            password, then sign in.
          </p>
          <Link href="/login" className="neon-button mt-6 inline-flex min-h-[48px] items-center justify-center px-6 py-2.5 text-sm font-semibold text-white">
            Back to sign in
          </Link>
        </GlassCard>
      </main>
    );
  }

  return (
    <main className="w-full max-w-[380px] hq-card-enter" style={{ animationDelay: "50ms" }}>
      <GlassCard className="p-6 sm:p-8">
        <div className="flex flex-col items-center gap-5 mb-8">
          <div className="flex items-center justify-center gap-3">
            <Image
              src="/app-icon.png"
              alt=""
              width={64}
              height={64}
              className="h-16 w-16 rounded-xl object-contain shrink-0"
              priority
            />
            <div>
              <Image
                src="/logo-naam.png"
                alt="NEUROHQ"
                width={180}
                height={48}
                className="h-10 w-auto max-w-[180px] object-contain"
                priority
              />
              <p className="mt-1 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                Reset your password
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[var(--accent-neutral)]/60 bg-[var(--bg-primary)]/60 px-4 py-2">
            <IconHQ active />
            <span className="text-sm font-medium text-[var(--text-secondary)]">We&apos;ll send you a reset link</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="hq-label block mb-1.5">
              Email
            </label>
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
          {error && (
            <div
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400"
              role="alert"
            >
              {error}
            </div>
          )}
          <PrimaryButton type="submit" disabled={loading} className="disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? "Sending…" : "Send reset link"}
          </PrimaryButton>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
          Remember your password?{" "}
          <Link
            href="/login"
            className="font-medium text-[var(--accent-focus)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)] rounded"
          >
            Sign in
          </Link>
        </p>
      </GlassCard>
    </main>
  );
}
