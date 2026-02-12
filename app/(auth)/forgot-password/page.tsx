"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

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
      <main className="w-full max-w-[400px]">
        <Link href="/login" className="mb-4 inline-block text-sm text-neuro-muted hover:text-neuro-silver transition">
          ← Back to sign in
        </Link>
        <div className="card-modern p-8 text-center space-y-5 shadow-xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neuro-blue/20 text-neuro-blue" aria-hidden>
            <span className="text-xl">✓</span>
          </div>
          <h1 className="text-xl font-bold text-neuro-silver">Check your email</h1>
          <p className="text-sm text-neuro-muted leading-relaxed">
            We sent a password reset link to <span className="font-medium text-neuro-silver">{email}</span>. Click it to set a new password, then sign in.
          </p>
          <Link href="/login" className="btn-primary inline-block rounded-lg px-5 py-2.5 text-sm font-medium">
            Back to sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full max-w-[400px]">
      <Link href="/login" className="mb-4 inline-block text-sm text-neuro-muted hover:text-neuro-silver transition">
        ← Back to sign in
      </Link>
      <div className="card-modern p-6 sm:p-8 shadow-xl">
        <div className="text-center mb-8">
          <div className="flex flex-col items-center gap-4">
            <Image src="/app-icon.png" alt="" width={72} height={72} className="h-[4.5rem] w-[4.5rem] rounded-xl object-contain" priority />
            <Image src="/logo-naam.png" alt="NEUROHQ" width={200} height={52} className="h-12 w-auto max-w-[200px] object-contain" priority />
          </div>
          <p className="mt-4 text-sm text-neuro-muted">Reset your password</p>
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
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-neuro-muted">
          Remember your password?{" "}
          <Link href="/login" className="font-medium text-neuro-blue hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
