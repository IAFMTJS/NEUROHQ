"use client";

import Link from "next/link";
import { useDailySnapshot } from "@/components/bootstrap/BootstrapGate";
import { useBootstrapToday } from "@/lib/use-bootstrap-today";
import { getTodayKey } from "@/lib/daily-date";
import { ProfileCommandDeckLayout } from "@/components/profile/ProfileCommandDeckLayout";
import { profileEngineHref, profileHomeHref, profileInsightsHref, profileSpecialEventsHref } from "@/lib/profile-routes";
import { getLoadingMascotSrc } from "@/lib/mascots";

type Props = {
  main: "home" | "engine" | "insights" | "special";
};

export function ProfileSnapshotFallback({ main }: Props) {
  const snapshot = useDailySnapshot();
  const dateKey = snapshot?.date?.trim() || getTodayKey();
  const { data: bootstrapToday } = useBootstrapToday(dateKey, { variant: "core" });
  const today =
    (typeof bootstrapToday?.date === "string" && bootstrapToday.date.trim()) ||
    snapshot?.date ||
    getTodayKey();

  return (
    <ProfileCommandDeckLayout main={main}>
      <div className="card-simple space-y-3 !rounded-xl p-4 md:p-5">
        <div className="flex justify-end">
          <div className="h-12 w-12 rounded-full border border-[rgba(var(--mode-rgb),0.25)] bg-[rgba(6,18,30,0.42)] p-1.5">
            <img src={getLoadingMascotSrc()} alt="" aria-hidden className="h-full w-full object-contain" />
          </div>
        </div>
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
            href={profileSpecialEventsHref()}
            className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/30 px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)]/35"
          >
            Events
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

