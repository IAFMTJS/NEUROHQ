"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type GrowthTabId =
  | "command"
  | "path"
  | "streams";

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
};

export function GrowthTabsShell({ children }: Props) {
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
    [pathname, router, searchParams]
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
    [activeTab]
  );

  return (
    <div className="space-y-4">
      {/* No sticky: inside dashboard / simplified scrollports sticky tabs paint over the card below. */}
      <nav
        className="relative z-10 -mx-1 flex flex-wrap gap-2 rounded-xl border border-[var(--card-border)]/80 bg-[var(--bg-primary)]/90 px-2 py-2 backdrop-blur-md"
        aria-label="Groei-tabs"
      >
        {TABS.map((tab) => {
          const selected = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                if (selected) return;
                setActiveTab(tab.id);
                replaceUrl(tab.id);
              }}
              aria-pressed={selected}
              className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition ${
                selected
                  ? "border-[var(--semantic-ring)]/60 bg-[var(--semantic-accent)]/20 text-[var(--semantic-accent)]"
                  : "border-transparent text-[var(--text-muted)] hover:border-[var(--semantic-ring)]/50 hover:bg-[var(--semantic-accent)]/10 hover:text-[var(--semantic-accent)]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      <section aria-label={`Groei-tab: ${activeLabel}`}>{children(activeTab)}</section>
    </div>
  );
}
