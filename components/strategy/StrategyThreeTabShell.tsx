"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type StrategyThreeTabId = "command" | "contract" | "review";

const ITEMS: readonly { id: StrategyThreeTabId; label: string; short: string }[] = [
  { id: "command", label: "Command", short: "Command" },
  { id: "contract", label: "Contract", short: "Contract" },
  { id: "review", label: "Review", short: "Review" },
] as const;

type Props = {
  command: ReactNode;
  contract: ReactNode;
  review: ReactNode;
  simplifiedLayout?: boolean;
  /** When the URL has no `tab` query, use this instead of Command (e.g. onboarding on /strategy). */
  initialTabWhenMissingQuery?: StrategyThreeTabId;
};

export function StrategyThreeTabShell({
  command,
  contract,
  review,
  simplifiedLayout = false,
  initialTabWhenMissingQuery,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabFromQuery = searchParams.get("tab");
  const initial =
    tabFromQuery === "contract" || tabFromQuery === "review" || tabFromQuery === "command"
      ? (tabFromQuery as StrategyThreeTabId)
      : (initialTabWhenMissingQuery ?? "command");
  const [tab, setTab] = useState<StrategyThreeTabId>(initial);

  useEffect(() => {
    if (!tabFromQuery) return;
    if (tabFromQuery !== "command" && tabFromQuery !== "contract" && tabFromQuery !== "review") return;
    const next = tabFromQuery as StrategyThreeTabId;
    if (next !== tab) setTab(next);
  }, [tabFromQuery, tab]);

  const panels: Record<StrategyThreeTabId, ReactNode> = {
    command,
    contract,
    review,
  };

  const setTabWithUrl = (next: StrategyThreeTabId) => {
    setTab(next);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);
    const q = params.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  };

  const stripOuterClass = simplifiedLayout
    ? "dashboard-top-strip sticky top-0 z-20 border-b border-[var(--card-border)]/50 bg-[var(--bg-surface)]/85 px-1 py-2 backdrop-blur-md supports-[backdrop-filter]:bg-[var(--bg-surface)]/70 sm:px-2"
    : "dashboard-top-strip mt-3";

  const tabBtn = (selected: boolean) =>
    `dashboard-mini-btn ${selected ? "dashboard-mini-btn-primary" : "dashboard-mini-btn-secondary"}`;

  return (
    <div className={simplifiedLayout ? "flex min-h-0 flex-1 flex-col gap-0" : "space-y-4"} data-strategy-three-tabs>
      <div className={stripOuterClass}>
        <div className="dashboard-top-strip-track" role="tablist" aria-label="Strategy">
          {ITEMS.map((t) => {
            const selected = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-label={t.label}
                title={t.label}
                id={`strategy-3tab-${t.id}`}
                onClick={() => setTabWithUrl(t.id)}
                className={tabBtn(selected)}
              >
                {t.short}
              </button>
            );
          })}
        </div>
      </div>
      <div
        role="tabpanel"
        className={simplifiedLayout ? "min-h-0 flex-1 space-y-6 pb-2 pt-3" : "min-h-[120px] space-y-6"}
        aria-labelledby={`strategy-3tab-${tab}`}
      >
        {panels[tab]}
      </div>
    </div>
  );
}
