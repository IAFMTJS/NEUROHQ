"use client";

import Link from "next/link";
import Image from "next/image";

export default function OfflinePage() {
  return (
    <div className="relative min-h-screen">
      <div className="hq-bg-layer" aria-hidden />
      <div className="hq-vignette" aria-hidden />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-5">
        <div className="hq-card w-full max-w-[360px] rounded-[var(--hq-card-radius)] p-8 text-center shadow-[var(--card-shadow)]">
          <Image
            src="/app-icon.png"
            alt=""
            width={64}
            height={64}
            className="mx-auto h-16 w-16 rounded-xl object-contain opacity-90"
          />
          <h1 className="mt-5 hq-h2">You&apos;re offline</h1>
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            NEUROHQ needs a connection to load. Check your network, then try again.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn-hq-primary inline-block rounded-[var(--hq-btn-radius)] px-6 py-2.5 text-center text-sm font-medium"
            >
              Try again
            </button>
            <Link
              href="/"
              className="inline-block rounded-[var(--hq-btn-radius)] border border-[var(--accent-neutral)] px-6 py-2.5 text-center text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--accent-neutral)]/20 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]"
            >
              Go home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
