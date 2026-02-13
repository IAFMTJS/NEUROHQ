"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { IconHQ } from "@/components/hq/NavIcons";

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
    const supabase = createClient();
    const { error: err } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSuccess(true);
  }

  if (success) {
    return (
      <main className="w-full max-w-[380px] hq-card-enter">
        <div className="hq-card rounded-[var(--hq-card-radius)] p-8 text-center shadow-[var(--card-shadow)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-energy)]/20 text-[var(--accent-energy)]" aria-hidden>
            <span className="text-2xl">✓</span>
          </div>
          <h1 className="mt-5 hq-h2">Check your email</h1>
          <p className="mt-3 text-sm text-[var(--text-muted)] leading-relaxed">
            We sent a confirmation link to <span className="font-medium text-[var(--text-primary)]">{email}</span>. Click it to activate your account, then sign in.
          </p>
          <Link href="/login" className="btn-hq-primary mt-6 inline-block rounded-[var(--hq-btn-radius)] px-6 py-2.5 text-sm font-medium">
            Back to sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full max-w-[380px] hq-card-enter" style={{ animationDelay: "50ms" }}>
      <div className="hq-card rounded-[var(--hq-card-radius)] p-6 sm:p-8 shadow-[var(--card-shadow)]">
        <div className="flex flex-col items-center gap-5 mb-8">
          <div className="flex items-center justify-center gap-3">
            <Image src="/app-icon.png" alt="" width={64} height={64} className="h-16 w-16 rounded-xl object-contain shrink-0" priority />
            <div>
              <Image src="/logo-naam.png" alt="NEUROHQ" width={180} height={48} className="h-10 w-auto max-w-[180px] object-contain" priority />
              <p className="mt-1 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Create your account</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[var(--accent-neutral)]/60 bg-[var(--bg-primary)]/60 px-4 py-2">
            <IconHQ active />
            <span className="text-sm font-medium text-[var(--text-secondary)]">Join NEUROHQ</span>
          </div>
        </div>
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
            <label htmlFor="password" className="hq-label block mb-1.5">
              Password <span className="font-normal text-[var(--text-muted)]">(at least 6 characters)</span>
            </label>
            <input
              id="password"
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
          <button
            type="submit"
            disabled={loading}
            className="btn-hq-primary w-full rounded-[var(--hq-btn-radius)] py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account…" : "Sign up"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[var(--accent-focus)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)] rounded">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
