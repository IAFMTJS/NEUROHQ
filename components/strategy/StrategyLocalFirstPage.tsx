"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getTodayKey } from "@/lib/daily-date";
import { getHubBundle, setHubBundle } from "@/lib/hub-bundles/db";
import { DashboardHubCommandShell } from "@/components/layout/DashboardHubCommandShell";
import { SimplifiedPageShell } from "@/components/layout/SimplifiedPageShell";
import { SIMPLIFIED_VIEWPORT_WRAPPER } from "@/lib/simplified-page-layout";
import { profileInsightsHref } from "@/lib/profile-routes";
import { StrategyContractLockToast } from "@/components/strategy/StrategyContractLockToast";
import { StrategyThesisForm } from "@/components/strategy/StrategyThesisForm";
import { StrategyArchiveHistory } from "@/components/strategy/StrategyArchiveHistory";
import { StrategyThreeTabShell } from "@/components/strategy/StrategyThreeTabShell";

type StrategyBundleResponse = {
  today: string;
  simplified: boolean;
  status: "no-strategy" | "locked" | "ready";
  strategy: any;
  past: any[];
  pressure?: any;
  review?: any;
  quarter?: any;
  alignment?: any;
};

function LoadingBlock() {
  return <div className="min-h-[220px] animate-pulse rounded-2xl bg-[var(--bg-elevated)]/30" aria-hidden />;
}

export function StrategyLocalFirstPage() {
  const todayStr = useMemo(() => getTodayKey(), []);
  const [bundle, setBundleState] = useState<StrategyBundleResponse | null>(null);
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
          const cached = (await getHubBundle("strategy", userId, todayStr).catch(() => null)) as any;
          const cachedPayload = cached?.payload ?? null;
          if (cachedPayload && !cancelled) {
            setBundleState(cachedPayload as StrategyBundleResponse);
            setLoading(false);
          }
        }

        const res = await fetch("/api/strategy/bundle", {
          credentials: "include",
          cache: "no-store",
          headers: { "x-neurohq-refresh": "1" },
        });
        if (!res.ok) {
          if (!cancelled) setLoading(false);
          return;
        }
        const fresh = (await res.json()) as StrategyBundleResponse;
        if (cancelled) return;
        setBundleState(fresh);
        setLoading(false);
        if (userId) {
          void setHubBundle("strategy", userId, todayStr, { dateStr: todayStr, payload: fresh } as any).catch(
            () => {}
          );
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

  const simplified = bundle?.simplified === true;

  const body = bundle ? (
    bundle.status === "no-strategy" ? (
      <div className="space-y-6">
        <StrategyThreeTabShell
          simplifiedLayout={simplified}
          initialTabWhenMissingQuery="contract"
          command={
            <div className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-elevated)]/50 p-6 text-center text-sm text-[var(--text-muted)]">
              <p className="font-medium text-[var(--text-primary)]">Nog geen actieve strategie</p>
              <p className="mt-2 max-w-md mx-auto">
                Open het tabblad Contract om je thesis en focus vast te leggen. Daarna vult Command zich met je kwartaalvoortgang.
              </p>
            </div>
          }
          contract={<StrategyThesisForm />}
          review={<StrategyArchiveHistory past={bundle.past ?? []} />}
        />
      </div>
    ) : bundle.status === "locked" ? (
      <div className="space-y-6">
        <StrategyContractLockToast show />
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <strong>Strategy is vergrendeld</strong>
          <p className="mt-1 text-[var(--text-secondary)]">
            Vul je kwartaalcontract in op het tabblad Contract om Command en Review te ontgrendelen.
          </p>
        </div>
        <StrategyThesisForm />
        <StrategyArchiveHistory past={bundle.past ?? []} />
      </div>
    ) : (
      <div className="space-y-6">
        {/* For the first iteration, use the existing Strategy page for full richness. */}
        <p className="text-sm text-[var(--text-muted)]">
          Strategy is klaar. Deze local-first shell toont cached status; de volledige Strategy UI blijft server-rendered in deze iteratie.
        </p>
        <a className="text-sm font-semibold text-[var(--accent-focus)] underline" href="/strategy">
          Reload Strategy
        </a>
      </div>
    )
  ) : (
    <LoadingBlock />
  );

  if (simplified) {
    return (
      <div className={SIMPLIFIED_VIEWPORT_WRAPPER}>
        <SimplifiedPageShell
          title="Strategy"
          hideTitleBar
          footerLinks={[
            { href: "/tasks", label: "Missions" },
            { href: "/strategy?tab=contract#strategy-contract", label: "Contract" },
            { href: profileInsightsHref("overview"), label: "Insights" },
            { href: "/budget", label: "Budget" },
          ]}
        >
          {loading && !bundle ? <LoadingBlock /> : body}
        </SimplifiedPageShell>
      </div>
    );
  }

  return <DashboardHubCommandShell hubLabel="Strategy" showBridgeLabel={false}>{loading && !bundle ? <LoadingBlock /> : body}</DashboardHubCommandShell>;
}

