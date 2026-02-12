"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { ensureUserProfileForSession } from "@/app/actions/auth";

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
    <main className="w-full max-w-[400px]">
      <Link href="/" className="mb-4 inline-block text-sm text-neuro-muted hover:text-neuro-silver transition">
        ← Back to home
      </Link>
      <div className="card-modern p-6 sm:p-8 shadow-xl">
        <div className="text-center mb-8">
          <div className="flex flex-col items-center gap-4">
            <Image src="/app-icon.png" alt="" width={72} height={72} className="h-[4.5rem] w-[4.5rem] rounded-xl object-contain" priority />
            <Image src="/logo-naam.png" alt="NEUROHQ" width={200} height={52} className="h-12 w-auto max-w-[200px] object-contain" priority />
          </div>
          <p className="mt-4 text-sm text-neuro-muted">Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neuro-silver">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1.5 w-full rounded-lg border border-neuro-border bg-neuro-dark px-3 py-2.5 text-neuro-silver placeholder-neuro-muted focus:border-neuro-blue focus:outline-none focus:ring-2 focus:ring-neuro-blue/30"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <div className="flex justify-between items-center">
              <label htmlFor="password" className="block text-sm font-medium text-neuro-silver">
                Password
              </label>
              <Link href="/forgot-password" className="text-xs text-neuro-muted hover:text-neuro-blue">
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
              className="mt-1.5 w-full rounded-lg border border-neuro-border bg-neuro-dark px-3 py-2.5 text-neuro-silver placeholder-neuro-muted focus:border-neuro-blue focus:outline-none focus:ring-2 focus:ring-neuro-blue/30"
            />
          </div>
          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full cursor-pointer rounded-lg py-3 font-medium disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-neuro-muted">
          No account?{" "}
          <Link href="/signup" className="font-medium text-neuro-blue hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
