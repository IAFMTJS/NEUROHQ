"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { ensureUserProfileForSession } from "@/app/actions/auth";
import { IconHQ } from "@/components/hq/NavIcons";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      // Full page navigation so cookies are sent and middleware sees the session
      window.location.href = "/dashboard";
      return;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
      setLoading(false);
    }
  }

  return (
    <main className="w-full max-w-[420px] hq-card-enter" style={{ animationDelay: "50ms" }}>
      <div className="hq-card rounded-[var(--hq-card-radius)] p-6 sm:p-8 shadow-[var(--card-shadow)]">
        <div className="flex flex-col items-center gap-5 mb-8">
          <div className="flex flex-col items-center gap-1 -mt-2">
            <Image src="/app-icon.png" alt="" width={400} height={400} className="w-[min(95vw,400px)] h-auto aspect-square rounded-2xl object-contain shrink-0" priority style={{ minHeight: 300 }} />
            <div className="flex flex-col items-center">
              <Image src="/logo-naam.png" alt="NEUROHQ" width={220} height={58} className="h-12 w-auto max-w-[220px] object-contain" priority />
              <p className="mt-1 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Nervous-system-aware HQ</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[var(--accent-neutral)]/60 bg-[var(--bg-primary)]/60 px-4 py-2">
            <IconHQ active />
            <span className="text-sm font-medium text-[var(--text-secondary)]">Sign in to your account</span>
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
          <button
            type="submit"
            disabled={loading}
            className="btn-hq-primary w-full rounded-[var(--hq-btn-radius)] py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
          No account?{" "}
          <Link href="/signup" className="font-medium text-[var(--accent-focus)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)] rounded">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
