"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getTodayKey } from "@/lib/daily-date";
import { getHubBundle, setHubBundle } from "@/lib/hub-bundles/db";

type BudgetBundleResponse = {
  today: string;
  prefs?: any;
  periodBounds?: any;
  paydayDayOfMonth?: number | null;
  batch?: any;
};

function formatCents(cents: number | null | undefined, currency = "EUR") {
  if (cents == null || Number.isNaN(cents)) return "—";
  const value = cents / 100;
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

export function BudgetLocalFirstPage() {
  const todayStr = useMemo(() => getTodayKey(), []);
  const [bundle, setBundleState] = useState<BudgetBundleResponse | null>(null);
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
          const cached = (await getHubBundle("budget", userId, todayStr).catch(() => null)) as any;
          const cachedPayload = cached?.payload ?? null;
          if (cachedPayload && !cancelled) {
            setBundleState(cachedPayload as BudgetBundleResponse);
            setLoading(false);
          }
        }

        const res = await fetch("/api/budget/bundle", {
          credentials: "include",
          cache: "no-store",
          headers: { "x-neurohq-refresh": "1" },
        });
        if (!res.ok) {
          if (!cancelled) setLoading(false);
          return;
        }
        const fresh = (await res.json()) as BudgetBundleResponse;
        if (cancelled) return;
        setBundleState(fresh);
        setLoading(false);
        if (userId) {
          void setHubBundle("budget", userId, todayStr, { dateStr: todayStr, payload: fresh } as any).catch(() => {});
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

  const settings = bundle?.batch?.budgetSettings;
  const currency = (settings?.currency as string | undefined) ?? "EUR";
  const remaining =
    bundle?.batch?.financeState?.planning?.plannedRemainingCents ??
    bundle?.batch?.financialInsights?.safeDailySpend?.remainingCents ??
    null;

  return (
    <main className="container page page-wide dashboard-cinematic relative z-10 pb-10 pt-4 sm:pt-5">
      <div className="hq-frosted-main-shell">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Budget (Local-first)</p>
              <p className="text-xs text-[var(--text-secondary)]">{bundle?.today ?? todayStr}</p>
            </div>
            <Link className="text-xs font-semibold text-[var(--accent-focus)] underline-offset-2 hover:underline" href="/budget">
              Open full Budget
            </Link>
          </div>

          {loading && !bundle ? (
            <div className="min-h-[220px] animate-pulse rounded-2xl bg-[var(--bg-elevated)]/30" aria-hidden />
          ) : (
            <div className="rounded-2xl border border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(var(--mode-rgb-deep),0.08)] p-4">
              <p className="text-xs text-[var(--text-muted)]">Remaining</p>
              <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">
                {formatCents(remaining, currency)}
              </p>
              <p className="mt-2 text-xs text-[var(--text-secondary)]">
                This is a cached summary bundle. Full budget UI remains server-rendered in this iteration.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

