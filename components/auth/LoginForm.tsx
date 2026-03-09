"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ensureUserProfileForSession } from "@/app/actions/auth";
import PrimaryButton from "@/components/ui/PrimaryButton";

type Props = {
  initialError?: string | null;
};

export function LoginForm({ initialError = null }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initialError);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
      await ensureUserProfileForSession();
      // Delay so the session cookie is committed before the next request
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
        <label htmlFor="login-email" className="hq-label block mb-1.5">
          Email
        </label>
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
          <label htmlFor="login-password" className="hq-label">
            Password
          </label>
          <a
            href="/forgot-password"
            className="text-xs font-medium text-[var(--accent-focus)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)] rounded"
          >
            Forgot password?
          </a>
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
        {loading ? "Signing in…" : "Sign in"}
      </PrimaryButton>
    </form>
  );
}

