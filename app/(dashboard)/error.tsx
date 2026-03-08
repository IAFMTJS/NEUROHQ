"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import GlassCard from "@/components/ui/GlassCard";
import PrimaryButton from "@/components/ui/PrimaryButton";

/**
 * Catches client-side errors in the dashboard segment (e.g. after login redirect).
 * Shows a friendly message and "Try again" so users don't see the generic "Application error: a client-side exception has occurred".
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Dashboard error]", error);
  }, [error]);

  const msg = error?.message?.trim() || "";
  const isAuth = /unauthorized|not signed in|session|niet ingelogd/i.test(msg);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <GlassCard className="w-full max-w-sm p-8 text-center">
        <Image src="/app-icon.png" alt="" width={56} height={56} className="mx-auto h-14 w-14 rounded-xl object-contain" />
        <h1 className="mt-4 text-xl font-bold text-[var(--text-primary)]">Er is iets misgegaan</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          {msg || "De pagina kon niet laden. Dit kan na het inloggen soms even duren."}
        </p>
        {isAuth && (
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Probeer opnieuw in te loggen of de pagina te vernieuwen.
          </p>
        )}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <PrimaryButton type="button" onClick={reset} className="w-auto px-6 py-2.5">
            Opnieuw proberen
          </PrimaryButton>
          <Link
            href="/login"
            className="inline-flex justify-center rounded-lg border border-[var(--card-border)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
          >
            Naar login
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
