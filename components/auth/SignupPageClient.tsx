"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { AuthMascotShell } from "@/components/auth/AuthMascotShell";

export default function SignupPageClient() {
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
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/login`
          : process.env.NEXT_PUBLIC_APP_URL
          ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/login`
          : undefined;
      const { error: err } = await supabase.auth.signUp({
        email,
        password,
        options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
      });
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
      <main className="w-full max-w-[760px] hq-card-enter" data-ui="dark-commander">
        <AuthMascotShell>
          <p className="mb-1 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Account Created
          </p>
          <h1 className="text-center text-base font-semibold text-[var(--text-primary)] sm:text-lg">
            Check your email
          </h1>
          <p className="mt-3 text-center text-sm leading-relaxed text-[var(--text-muted)]">
            We sent a confirmation link to{" "}
            <span className="font-medium text-[var(--text-primary)]">{email}</span>. Click it to
            activate your account, then sign in.
          </p>
          <Link
            href="/login"
            className="neon-button mt-6 inline-flex min-h-[48px] w-full items-center justify-center px-6 py-2.5 text-sm font-semibold text-white rounded-[var(--hq-btn-radius)]"
          >
            Back to sign in
          </Link>
        </AuthMascotShell>
      </main>
    );
  }

  return (
    <main
      className="w-full max-w-[760px] hq-card-enter"
      style={{ animationDelay: "50ms" }}
      data-ui="dark-commander"
    >
      <AuthMascotShell>
        <div className="-mt-12 mb-0.5 flex justify-center">
          <img
            src="/logo-naam.png"
            alt="NEUROHQ"
            className="h-auto w-full max-w-[190px] select-none object-contain opacity-95"
            draggable={false}
          />
        </div>
        <p className="mb-1 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
          Commander Access
        </p>
        <h2 className="mb-4 text-center text-sm font-semibold text-[var(--text-secondary)]">
          Create your account
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="signup-email" className="hq-label block mb-1.5">
              Email
            </label>
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
              Password{" "}
              <span className="font-normal text-[var(--text-muted)]">
                (at least 6 characters)
              </span>
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
            <div
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400"
              role="alert"
            >
              {error}
            </div>
          )}
          <PrimaryButton
            type="submit"
            disabled={loading}
            className="disabled:opacity-50 disabled:cursor-not-allowed w-full"
          >
            {loading ? "Creating account…" : "Sign up"}
          </PrimaryButton>
        </form>
        <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-[var(--accent-focus)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-focus)] focus-visible:ring-offset-2 rounded"
          >
            Sign in
          </Link>
        </p>
      </AuthMascotShell>
    </main>
  );
}

