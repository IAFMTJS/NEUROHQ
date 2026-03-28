"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useHQStore } from "@/lib/hq-store";

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

export type GrowthCenteredPageHeader = {
  title: string;
  subtitle?: ReactNode;
  backHref?: string;
  actions?: ReactNode;
};

type Props = {
  children: (activeTab: GrowthTabId) => ReactNode;
  /** Full layout (non-simplified): centered title + pill tabs, aligned with Budget/Strategy hubs. */
  centeredPageHeader?: GrowthCenteredPageHeader;
  /** Between tab row and panels: mascot, pace hint, etc. */
  belowTabsSlot?: ReactNode;
};

export function GrowthTabsShell({ children, centeredPageHeader, belowTabsSlot }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mode = useHQStore((s) => s.gameState?.mode?.current ?? "focus");
  const modeLabel =
    mode === "war"
      ? "War mode"
      : mode === "recovery"
        ? "Recovery mode"
        : mode === "overdrive"
          ? "Overdrive mode"
          : "Focus mode";

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
  const growthTitleGlowClass =
    "text-sm font-bold uppercase tracking-[0.2em] text-[var(--text-primary)] [text-shadow:0_0_12px_rgba(var(--mode-rgb),0.38),0_0_26px_rgba(var(--mode-rgb),0.16)] sm:text-[0.9375rem]";

  const tabPillClass = (tab: GrowthTabId) =>
    activeTab === tab
      ? "rounded-full border border-[rgba(var(--mode-rgb),0.28)] bg-[var(--bg-elevated)]/75 px-2.5 py-1.5 text-xs font-semibold text-[var(--text-primary)] sm:px-3"
      : "rounded-full border border-transparent px-2.5 py-1.5 text-xs font-medium text-[var(--text-muted)] transition-colors hover:border-[rgba(var(--mode-rgb),0.15)] hover:bg-[var(--bg-elevated)]/45 hover:text-[var(--text-primary)] sm:px-3";

  const setTab = (next: GrowthTabId) => {
    if (next === activeTab) return;
    setActiveTab(next);
    replaceUrl(next);
  };

  const tabButtonsPills = (
    <div
      className="flex flex-wrap items-center justify-center gap-1.5"
      role="tablist"
      aria-label="Groei-secties"
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
            className={tabPillClass(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );

  const tabButtonsCompact = (
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
            onClick={() => setTab(tab.id)}
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
  );

  const panel = <section aria-label={`Groei-tab: ${activeLabel}`}>{children(activeTab)}</section>;

  if (centeredPageHeader) {
    return (
      <div className="space-y-4" data-growth-tabs>
        <section className="space-y-2" aria-label="Growth navigatie">
          <div className="flex items-center justify-between gap-2 px-3 pt-2 md:px-4">
            {centeredPageHeader.backHref ? (
              <Link
                href={centeredPageHeader.backHref}
                className="shrink-0 text-xs font-semibold text-[var(--text-secondary)] transition hover:text-[var(--text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--mode-rgb),0.45)] focus-visible:ring-offset-0 rounded-md"
              >
                ← HQ
              </Link>
            ) : (
              <span className="w-10 shrink-0" aria-hidden />
            )}
            <span className="inline-flex shrink-0 items-center rounded-full border border-[rgba(var(--mode-rgb),0.18)] bg-[var(--bg-elevated)]/35 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[var(--accent-focus)]">
              {modeLabel}
            </span>
          </div>
          <h1 className={`px-3 text-center md:px-4 ${growthTitleGlowClass}`}>{centeredPageHeader.title}</h1>
          {centeredPageHeader.subtitle != null && (
            <p className="mx-auto max-w-xl px-3 text-center text-xs leading-relaxed text-[var(--text-muted)] md:px-4">
              {typeof centeredPageHeader.subtitle === "string" ? centeredPageHeader.subtitle : centeredPageHeader.subtitle}
            </p>
          )}
          {centeredPageHeader.actions != null && (
            <div className="flex flex-wrap items-center justify-center gap-2 px-3 md:px-4">{centeredPageHeader.actions}</div>
          )}
          <div className={`border-b ${simplifiedDivider} px-2 py-1.5 md:px-3`}>{tabButtonsPills}</div>
        </section>
        {belowTabsSlot != null ? <div className="space-y-4">{belowTabsSlot}</div> : null}
        <div className="min-h-[120px] space-y-4">{panel}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-growth-tabs>
      {/* No sticky: inside dashboard / simplified scrollports sticky tabs paint over the card below. */}
      {tabButtonsCompact}
      {panel}
    </div>
  );
}
