"use client";

import { useState } from "react";

type Props = { initialError?: string | null };

export function AdminLoginForm({ initialError = null }: Props) {
  const [error, setError] = useState<string | null>(initialError);
  const [loading, setLoading] = useState(false);

  return (
    <form
      action="/api/auth/admin-login"
      method="post"
      className="space-y-4"
      onSubmit={() => {
        setError(null);
        setLoading(true);
      }}
    >
      {error ? (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100" role="alert">
          {error}
        </p>
      ) : null}
      <div>
        <label htmlFor="admin-email" className="mb-1 block text-xs font-medium uppercase tracking-wide text-white/50">
          E-mail
        </label>
        <input
          id="admin-email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none ring-[var(--accent-focus)] placeholder:text-white/35 focus:border-[var(--accent-focus)] focus:ring-2"
          placeholder="admin@voorbeeld.nl"
        />
      </div>
      <div>
        <label htmlFor="admin-password" className="mb-1 block text-xs font-medium uppercase tracking-wide text-white/50">
          Wachtwoord
        </label>
        <input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none ring-[var(--accent-focus)] focus:border-[var(--accent-focus)] focus:ring-2"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-[var(--accent-focus)] px-4 py-2.5 text-sm font-semibold text-[#050810] transition hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Bezig…" : "Inloggen als beheerder"}
      </button>
    </form>
  );
}
