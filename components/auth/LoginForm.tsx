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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="login-email"
          className="mb-1 block text-xs font-medium uppercase tracking-wide text-violet-200/85"
        >
          Email
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-xl border border-violet-300/25 bg-black/25 px-4 py-2.5 text-sm text-violet-50 placeholder:text-violet-300/45 focus:border-cyan-300/45 focus:outline-none focus:ring-2 focus:ring-cyan-400/25 transition"
          placeholder="you@example.com"
          aria-invalid={!!error}
        />
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label
            htmlFor="login-password"
            className="text-xs font-medium uppercase tracking-wide text-violet-200/85"
          >
            Password
          </label>
          <a
            href="/forgot-password"
            className="text-xs font-medium text-cyan-200/90 hover:text-cyan-100 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded"
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
          className="w-full rounded-xl border border-violet-300/25 bg-black/25 px-4 py-2.5 text-sm text-violet-50 placeholder:text-violet-300/45 focus:border-cyan-300/45 focus:outline-none focus:ring-2 focus:ring-cyan-400/25 transition"
          aria-invalid={!!error}
        />
      </div>
      {error && (
        <div
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-300"
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

