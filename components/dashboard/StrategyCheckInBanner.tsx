"use client";

import Link from "next/link";

type Props = { show: boolean };

export function StrategyCheckInBanner({ show }: Props) {
  if (!show) return null;
  return (
    <Link
      href="/strategy"
      className="block rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-left transition-opacity hover:opacity-90"
    >
      <p className="text-sm font-medium text-amber-200">
        Strategy check-in — Neem even de tijd om je voortgang te bekijken en je doelen bij te stellen.
      </p>
      <p className="mt-1 text-xs text-amber-200/80">
        Klik om naar Strategy te gaan en je check-in te doen. De melding verdwijnt daarna.
      </p>
    </Link>
  );
}
