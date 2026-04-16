"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getTodayKey } from "@/lib/daily-date";
import type { ProfileHomeBundle } from "@/lib/profile-home-types";
import { getProfileHomeCache, setProfileHomeCache } from "@/lib/profile-home-cache";
import { ProfileHomeCompact } from "@/components/profile/ProfileHomeCompact";

type Props = {
  /** Provided by the server wrapper (single prefs read) */
  simplified: boolean;
};

export function ProfileHomeLocalFirst({ simplified }: Props) {
  const todayStr = useMemo(() => getTodayKey(), []);
  const [bundle, setBundle] = useState<ProfileHomeBundle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
        const userId = session?.user?.id ?? null;

        if (userId) {
          const cached = await getProfileHomeCache(userId, todayStr).catch(() => null);
          if (cached && !cancelled) {
            setBundle(cached);
            setLoading(false);
          }
        }

        const res = await fetch("/api/profile/home-bundle", {
          credentials: "include",
          cache: "no-store",
          headers: { "x-neurohq-refresh": "1" },
        });
        if (!res.ok) {
          if (!cancelled) setLoading(false);
          return;
        }
        const fresh = (await res.json()) as ProfileHomeBundle;
        if (cancelled) return;
        setBundle(fresh);
        setLoading(false);
        if (fresh.userId && fresh.dateStr) {
          void setProfileHomeCache(fresh.userId, fresh.dateStr, fresh).catch(() => {});
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [todayStr]);

  if (!bundle) {
    return (
      <div className="min-h-[220px] animate-pulse rounded-xl border border-[rgba(var(--mode-rgb),0.16)] bg-[rgba(var(--mode-rgb-deep),0.10)]" aria-busy="true" />
    );
  }

  return (
    <div className={simplified ? "space-y-4" : ""} data-profile-bundle={loading ? "loading" : "ready"}>
      <ProfileHomeCompact
        identity={bundle.identity}
        insightState={bundle.insightState}
        forecast={bundle.forecast}
        initialMoodLabel={bundle.moodLabel}
        todayStr={bundle.dateStr}
        dailyChallengeContext={bundle.dailyChallengeContext}
      />
    </div>
  );
}

