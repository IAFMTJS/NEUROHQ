"use client";

import Link from "next/link";
import { useDailySnapshot } from "@/components/bootstrap/BootstrapGate";
import { ProfileCommandDeckLayout } from "@/components/profile/ProfileCommandDeckLayout";
import { profileEngineHref, profileHomeHref, profileInsightsHref } from "@/lib/profile-routes";

type Props = {
  main: "home" | "engine" | "insights";
};

export function ProfileSnapshotFallback({ main }: Props) {
  const snapshot = useDailySnapshot();
  const today = snapshot?.date ?? new Date().toISOString().slice(0, 10);

  return (
    <ProfileCommandDeckLayout main={main}>
      <div className="card-simple space-y-3 !rounded-xl p-4 md:p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">
          Loading profile
        </p>
        <p className="text-sm text-[var(--text-secondary)]">
          Restoring cached state for <span className="font-mono">{today}</span>…
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Link
            href={profileHomeHref()}
            className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/30 px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)]/35"
          >
            Profile
          </Link>
          <Link
            href={profileEngineHref("identity")}
            className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/30 px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)]/35"
          >
            Engine
          </Link>
          <Link
            href={profileInsightsHref("overview")}
            className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/30 px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)]/35"
          >
            Insights
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/30 px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)]/35"
          >
            HQ
          </Link>
        </div>
      </div>
    </ProfileCommandDeckLayout>
  );
}

