"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import GlassCard from "@/components/ui/GlassCard";
import PrimaryButton from "@/components/ui/PrimaryButton";

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
  const message = rawMessage || "Er is iets misgegaan.";
  const isAuth = /not authenticated|not signed in|session/i.test(message.toLowerCase());
  const isSchema = /column .* does not exist|relation .* does not|migration/i.test(message.toLowerCase());
  const isSupabaseConfig = /missing supabase|NEXT_PUBLIC_SUPABASE|environment variables/i.test(message.toLowerCase());
  const digest = error?.digest;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <GlassCard className="w-full max-w-sm p-8 text-center">
        <Image src="/app-icon.png" alt="" width={56} height={56} className="mx-auto h-14 w-14 rounded-xl object-contain" />
        <h1 className="mt-4 text-xl font-bold text-[var(--text-primary)]">Er is iets misgegaan</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          {message}
        </p>
        {isOmitted && (
          <p className="mt-3 text-xs text-[var(--text-muted)] text-left">
            Mogelijke oorzaken: (1) <strong>Supabase env</strong> — in Vercel: Project → Settings → Environment Variables, zet <code className="rounded bg-[var(--bg-elevated)] px-1">NEXT_PUBLIC_SUPABASE_URL</code> en <code className="rounded bg-[var(--bg-elevated)] px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>. (2) <strong>Database</strong> — voer migraties uit in Supabase SQL Editor. Zie DEPLOY.md.
          </p>
        )}
        {isSupabaseConfig && (
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Voeg deze toe in Vercel → Project → Settings → Environment Variables en deploy opnieuw.
          </p>
        )}
        {digest && (
          <p className="mt-2 text-[10px] text-[var(--text-muted)]/70 font-mono">Digest: {digest}</p>
        )}
        {isAuth && (
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Probeer uit te loggen en opnieuw in te loggen, of vernieuw de pagina om je sessie te herstellen.
          </p>
        )}
        {isSchema && (
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            De database heeft mogelijk nieuwe migraties nodig. Voer de SQL in <code className="rounded bg-[var(--bg-elevated)] px-1">supabase/migrations</code> uit in je Supabase-project.
          </p>
        )}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <PrimaryButton type="button" onClick={reset} className="w-auto px-6 py-2.5">
            Opnieuw proberen
          </PrimaryButton>
          <Link
            href="/dashboard"
            className="inline-flex justify-center rounded-lg border border-[var(--card-border)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
          >
            Dashboard
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
