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
};

export function StrategyTabsShell({ overview, focusBudget, alignment, review, banner }: Props) {
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

  return (
    <div className="space-y-4" data-strategy-tabs>
      {banner}
      <div
        role="tablist"
        aria-label="Strategie-secties"
        className="flex flex-wrap gap-2 border-b border-[var(--card-border)] pb-2"
      >
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
              className={`rounded-t-lg px-3 py-2 text-sm font-medium transition-colors ${
                selected
                  ? "border border-b-0 border-[var(--card-border)] bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" className="min-h-[120px] space-y-6" aria-labelledby={`strategy-tab-${tab}`}>
        {panels[tab]}
      </div>
    </div>
  );
}
