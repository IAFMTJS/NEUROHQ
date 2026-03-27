"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type StrategyTabId = "overview" | "focus" | "alignment" | "review";

const TABS: { id: StrategyTabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "focus", label: "Focus & budget" },
  { id: "alignment", label: "Alignment & momentum" },
  { id: "review", label: "Review & archief" },
];

type Props = {
  overview: React.ReactNode;
  focusBudget: React.ReactNode;
  alignment: React.ReactNode;
  review: React.ReactNode;
  /** e.g. review-due banner */
  banner?: React.ReactNode;
  /** Sticky tab strip inside simplified command scroll (matches budget/tasks). */
  simplifiedLayout?: boolean;
};

export function StrategyTabsShell({ overview, focusBudget, alignment, review, banner, simplifiedLayout = false }: Props) {
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

  const tabListClass = simplifiedLayout
    ? "dashboard-top-strip sticky top-0 z-20 flex flex-wrap gap-2 border-b border-[var(--card-border)]/50 bg-[var(--bg-surface)]/85 px-1 py-2 backdrop-blur-md supports-[backdrop-filter]:bg-[var(--bg-surface)]/70 sm:px-2"
    : "flex flex-wrap gap-2 border-b border-[var(--card-border)] pb-2";

  const tabBtnClass = (selected: boolean) =>
    simplifiedLayout
      ? `dashboard-mini-btn ${selected ? "dashboard-mini-btn-primary" : "dashboard-mini-btn-secondary"}`
      : `rounded-t-lg px-3 py-2 text-sm font-medium transition-colors ${
          selected
            ? "border border-b-0 border-[var(--card-border)] bg-[var(--bg-elevated)] text-[var(--text-primary)]"
            : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        }`;

  return (
    <div className={simplifiedLayout ? "flex min-h-0 flex-1 flex-col gap-0" : "space-y-4"} data-strategy-tabs>
      {banner ? <div className={simplifiedLayout ? "shrink-0" : undefined}>{banner}</div> : null}
      <div role="tablist" aria-label="Strategie-secties" className={tabListClass}>
        {TABS.map((t) => {
          const selected = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={selected}
              id={`strategy-tab-${t.id}`}
              onClick={() => setTabWithUrl(t.id)}
              className={tabBtnClass(selected)}
            >
              {t.label}
            </button>
          );
        })}
      </div>
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
