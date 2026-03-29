"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type StrategyTabId = "overview" | "focus" | "alignment" | "review";

/** Volgorde = productie; `shortLabel` past horizontale strip (tasks / budget / hubs). */
const TABS: { id: StrategyTabId; label: string; shortLabel: string }[] = [
  { id: "overview", label: "Overview", shortLabel: "Overview" },
  { id: "focus", label: "Focus & budget", shortLabel: "Focus" },
  { id: "alignment", label: "Alignment & momentum", shortLabel: "Align" },
  { id: "review", label: "Review & archief", shortLabel: "Review" },
];

type Props = {
  overview: React.ReactNode;
  focusBudget: React.ReactNode;
  alignment: React.ReactNode;
  review: React.ReactNode;
  /** e.g. review-due banner */
  banner?: React.ReactNode;
  /** Between tab row and panels (mascot, pace hint) — full hub layout only. */
  belowTabsSlot?: ReactNode;
  /** Sticky tab strip in simplified scroll (zelfde rail als volledige hub). */
  simplifiedLayout?: boolean;
};

export function StrategyTabsShell({
  overview,
  focusBudget,
  alignment,
  review,
  banner,
  belowTabsSlot,
  simplifiedLayout = false,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabFromQuery = searchParams.get("tab");
  const initialTab = TABS.some((t) => t.id === tabFromQuery)
    ? (tabFromQuery as StrategyTabId)
    : "overview";
  const [tab, setTab] = useState<StrategyTabId>(initialTab);

  useEffect(() => {
    if (!tabFromQuery) return;
    if (!TABS.some((t) => t.id === tabFromQuery)) return;
    const next = tabFromQuery as StrategyTabId;
    if (next !== tab) setTab(next);
  }, [tabFromQuery, tab]);

  const panels: Record<StrategyTabId, React.ReactNode> = {
    overview,
    focus: focusBudget,
    alignment,
    review,
  };

  const setTabWithUrl = (nextTab: StrategyTabId) => {
    setTab(nextTab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", nextTab);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const stripOuterClass = simplifiedLayout
    ? "dashboard-top-strip sticky top-0 z-20 border-b border-[var(--card-border)]/50 bg-[var(--bg-surface)]/85 px-1 py-2 backdrop-blur-md supports-[backdrop-filter]:bg-[var(--bg-surface)]/70 sm:px-2"
    : "dashboard-top-strip mt-3";

  const tabBtnClass = (selected: boolean) =>
    `dashboard-mini-btn ${selected ? "dashboard-mini-btn-primary" : "dashboard-mini-btn-secondary"}`;

  return (
    <div className={simplifiedLayout ? "flex min-h-0 flex-1 flex-col gap-0" : "space-y-4"} data-strategy-tabs>
      {banner ? <div className={simplifiedLayout ? "shrink-0" : undefined}>{banner}</div> : null}
      <div className={stripOuterClass}>
        <div className="dashboard-top-strip-track" role="tablist" aria-label="Strategie-secties">
          {TABS.map((t) => {
            const selected = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-label={t.label}
                title={t.label}
                id={`strategy-tab-${t.id}`}
                onClick={() => setTabWithUrl(t.id)}
                className={tabBtnClass(selected)}
              >
                {t.shortLabel}
              </button>
            );
          })}
          <span className="dashboard-mini-strip-label">Tabs</span>
        </div>
      </div>
      {!simplifiedLayout && belowTabsSlot != null ? (
        <div className="space-y-4">{belowTabsSlot}</div>
      ) : null}
      <div
        role="tabpanel"
        className={simplifiedLayout ? "min-h-0 flex-1 space-y-6 pb-2 pt-3" : "min-h-[120px] space-y-6"}
        aria-labelledby={`strategy-tab-${tab}`}
      >
        {panels[tab]}
      </div>
    </div>
  );
}
