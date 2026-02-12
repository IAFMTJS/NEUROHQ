"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

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
      <main className="w-full max-w-[400px]">
        <div className="card-modern p-6 sm:p-8 text-center space-y-4">
          <h1 className="text-xl font-bold text-neuro-silver">Check your email</h1>
          <p className="text-sm text-neutral-400">
            We sent a confirmation link to {email}. Click it to activate your account, then sign in.
          </p>
          <Link href="/login" className="inline-block font-medium text-neuro-blue hover:underline">
            Back to sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full max-w-[400px]">
      <div className="card-modern p-6 sm:p-8">
        <div className="text-center mb-8">
          <div className="flex flex-col items-center gap-3">
            <Image src="/app-icon.png" alt="" width={40} height={40} className="mx-auto h-10 w-10 rounded-lg object-contain" priority />
            <Image src="/logo-naam.png" alt="NEUROHQ" width={160} height={42} className="mx-auto mt-2 h-9 w-auto object-contain" priority />
          </div>
          <p className="mt-3 text-sm text-neutral-400">Create your account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1.5 w-full rounded-lg border border-neuro-border bg-[#0d1117] px-3 py-2.5 text-neuro-silver placeholder-neuro-muted focus:border-neuro-blue focus:outline-none focus:ring-1 focus:ring-neuro-blue"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-neutral-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="mt-1.5 w-full rounded-lg border border-neuro-border bg-[#0d1117] px-3 py-2.5 text-neuro-silver placeholder-neuro-muted focus:border-neuro-blue focus:outline-none focus:ring-1 focus:ring-neuro-blue"
              placeholder="At least 6 characters"
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
            className="btn-primary w-full cursor-pointer py-3 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Sign up"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-neutral-400">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-neuro-blue hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
