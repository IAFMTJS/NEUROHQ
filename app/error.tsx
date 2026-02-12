"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const rawMessage = error?.message?.trim() || "";
  const isOmitted = !rawMessage || /error occurred|omitted in production|digest/i.test(rawMessage);
  const message = rawMessage || "Something went wrong.";
  const isAuth = /not authenticated|not signed in|session/i.test(message.toLowerCase());
  const isSchema = /column .* does not exist|relation .* does not|migration/i.test(message.toLowerCase());
  const isSupabaseConfig = /missing supabase|NEXT_PUBLIC_SUPABASE|environment variables/i.test(message.toLowerCase());
  const digest = error?.digest;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg-primary)] px-4">
      <div className="card-modern w-full max-w-sm p-8 text-center shadow-xl">
        <Image src="/app-icon.png" alt="" width={56} height={56} className="mx-auto h-14 w-14 rounded-xl object-contain" />
        <h1 className="mt-4 text-xl font-bold text-neuro-silver">Something went wrong</h1>
        <p className="mt-2 text-sm text-neuro-muted">
          {message}
        </p>
        {isOmitted && (
          <p className="mt-3 text-xs text-neuro-muted text-left">
            Common causes: (1) <strong>Supabase env vars</strong> — in Vercel go to Project → Settings → Environment Variables and set <code className="rounded bg-neuro-dark px-1">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="rounded bg-neuro-dark px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>. (2) <strong>Database</strong> — run migrations in Supabase SQL Editor. See DEPLOY.md.
          </p>
        )}
        {isSupabaseConfig && (
          <p className="mt-2 text-xs text-neuro-muted">
            Add these in Vercel → Project → Settings → Environment Variables, then redeploy.
          </p>
        )}
        {digest && (
          <p className="mt-2 text-[10px] text-neuro-muted/70 font-mono">Digest: {digest}</p>
        )}
        {isAuth && (
          <p className="mt-2 text-xs text-neuro-muted">
            Try signing out and back in, or refresh the page to restore your session.
          </p>
        )}
        {isSchema && (
          <p className="mt-2 text-xs text-neuro-muted">
            The database may need new migrations. Run the SQL in <code className="rounded bg-neuro-dark px-1">supabase/migrations</code> in your Supabase project.
          </p>
        )}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={reset}
            className="btn-primary rounded-lg px-4 py-2.5 text-sm font-medium"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex justify-center rounded-lg border border-neuro-border px-4 py-2.5 text-sm font-medium text-neuro-silver hover:bg-neuro-border/50"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
