"use client";

import Link from "next/link";
import { getReEngagementBody } from "@/lib/re-engagement-copy";

type Props = {
  daysInactive: number;
  lastCompletionDate: string | null;
};

export function RecoveryCampaignBanner({ daysInactive }: Props) {
  return (
    <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
      <p className="font-medium">🟢 Recovery Campaign</p>
      <p className="mt-1 text-[var(--text-muted)]">
        {daysInactive} dagen inactive. Rebuild momentum met 3 micro-missies (lage druk).
      </p>
      <p className="mt-1 text-[var(--text-muted)]">{getReEngagementBody()}</p>
      <Link
        href="/tasks?add=today"
        className="mt-2 inline-block rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/30"
      >
        Voeg 3 micro-missies toe
      </Link>
    </div>
  );
}
