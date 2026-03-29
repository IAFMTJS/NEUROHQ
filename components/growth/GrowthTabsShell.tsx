"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type GrowthTabId = "command" | "path" | "streams";

const TABS: { id: GrowthTabId; label: string }[] = [
  { id: "command", label: "Commandocentrum" },
  { id: "path", label: "Leerpad" },
  { id: "streams", label: "Stromen" },
];

const HASH_TO_TAB: Record<string, GrowthTabId> = {
  "#growth-command": "command",
  "#growth-path": "path",
  "#growth-streams": "streams",
};

function isTabId(value: string | null | undefined): value is GrowthTabId {
  if (!value) return false;
  return TABS.some((tab) => tab.id === value);
}

type Props = {
  children: (activeTab: GrowthTabId) => ReactNode;
  /** Between tab row and panels: mascot, pace hint, etc. */
  belowTabsSlot?: ReactNode;
};

export function GrowthTabsShell({ children, belowTabsSlot }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tabFromQuery = searchParams.get("tab");
  const initialTab: GrowthTabId = isTabId(tabFromQuery) ? tabFromQuery : "command";
  const [activeTab, setActiveTab] = useState<GrowthTabId>(initialTab);

  const replaceUrl = useCallback(
    (nextTab: GrowthTabId) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", nextTab);
      const nextQuery = params.toString();
      const href = nextQuery ? `${pathname}?${nextQuery}` : pathname;
      router.replace(href, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (isTabId(tabFromQuery)) {
      setActiveTab(tabFromQuery);
      return;
    }
    if (typeof window === "undefined") return;
    const hashTab = HASH_TO_TAB[window.location.hash];
    if (hashTab) {
      setActiveTab(hashTab);
      replaceUrl(hashTab);
    }
  }, [tabFromQuery, replaceUrl]);

  const activeLabel = useMemo(
    () => TABS.find((tab) => tab.id === activeTab)?.label ?? "Groei",
    [activeTab],
  );

  const simplifiedDivider = "border-[rgba(var(--mode-rgb),0.1)]";

  /** Compact single-row tabs; glow kept but tighter so three labels fit one line on most phones. */
  const growthHubTabClass = (selected: boolean) =>
    selected
      ? "h-8 shrink-0 whitespace-nowrap rounded-full border border-[rgba(var(--mode-rgb),0.58)] bg-gradient-to-b from-[rgba(11,57,90,0.96)] to-[rgba(7,38,58,0.98)] px-2.5 py-0 text-center text-[9px] font-bold uppercase leading-8 tracking-[0.05em] text-[#e7f8ff] shadow-[0_0_14px_rgba(var(--mode-rgb),0.32),inset_0_1px_0_rgba(255,255,255,0.12)] [text-shadow:0_0_10px_rgba(var(--mode-rgb),0.45)] ring-1 ring-[rgba(var(--mode-rgb),0.3)] transition-all duration-200 sm:h-8 sm:px-3 sm:text-[10px] sm:tracking-[0.06em]"
      : "h-8 shrink-0 whitespace-nowrap rounded-full border border-[rgba(var(--mode-rgb),0.28)] bg-gradient-to-b from-[rgba(10,36,58,0.88)] to-[rgba(6,22,38,0.92)] px-2 py-0 text-center text-[9px] font-semibold uppercase leading-8 tracking-[0.05em] text-[#c7efff]/90 opacity-[0.92] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all duration-200 hover:border-[rgba(var(--mode-rgb),0.45)] hover:text-[#eaf8ff] hover:opacity-100 hover:shadow-[0_0_12px_rgba(var(--mode-rgb),0.18)] sm:px-2.5 sm:text-[10px]";

  const setTab = (next: GrowthTabId) => {
    if (next === activeTab) return;
    setActiveTab(next);
    replaceUrl(next);
  };

  const tabButtonsPills = (
    <div
      role="tablist"
      aria-label="Groei-secties"
      className={`flex flex-nowrap items-center justify-center gap-1 overflow-x-auto border-b ${simplifiedDivider} bg-[rgba(6,18,30,0.28)] px-1.5 py-1.5 backdrop-blur-sm [scrollbar-width:thin] sm:gap-1.5 sm:px-2`}
    >
      {TABS.map((tab) => {
        const selected = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`growth-tab-btn-${tab.id}`}
            aria-selected={selected}
            aria-current={selected ? "page" : undefined}
            onClick={() => setTab(tab.id)}
            className={growthHubTabClass(selected)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );

  const panel = <section aria-label={`Groei-tab: ${activeLabel}`}>{children(activeTab)}</section>;

  return (
    <div className="space-y-4" data-growth-tabs>
      {tabButtonsPills}
      {belowTabsSlot != null ? <div className="space-y-4">{belowTabsSlot}</div> : null}
      <div className="min-h-[120px] space-y-4">{panel}</div>
    </div>
  );
}
