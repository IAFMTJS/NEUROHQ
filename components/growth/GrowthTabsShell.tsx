"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useHQStore } from "@/lib/hq-store";
import { EnergyRing, type EnergyRingMode } from "@/components/hud-test/EnergyRing";

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

export type GrowthCommandPageHeader = {
  backHref: string;
  /** Single line under the title row (truncate on small viewports). */
  statusLine: string;
  ringProgress: number;
  ringValue: string;
  ringLabel?: string;
  ringMode?: EnergyRingMode;
  actions?: ReactNode;
  /** One short sentence for the warning-style card under the header (before tabs). */
  statusCardMessage: string;
  /** Link target for “Open Strategy” (default /strategy). */
  strategyHref?: string;
};

type Props = {
  children: (activeTab: GrowthTabId) => ReactNode;
  /** Full layout: compact command header + pill tabs (dashboard / budget hub family). */
  commandPageHeader?: GrowthCommandPageHeader;
  /** Between tab row and panels: mascot, pace hint, etc. */
  belowTabsSlot?: ReactNode;
};

const RING_SIZE = 76;

export function GrowthTabsShell({ children, commandPageHeader, belowTabsSlot }: Props) {
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

  /** Compact single-row tabs; glow kept but tighter so three labels fit one line on most phones. */
  const growthHubTabClass = (selected: boolean) =>
    selected
      ? "h-8 shrink-0 whitespace-nowrap rounded-full border border-[rgba(var(--mode-rgb),0.58)] bg-gradient-to-b from-[rgba(11,57,90,0.96)] to-[rgba(7,38,58,0.98)] px-2.5 py-0 text-center text-[9px] font-bold uppercase leading-8 tracking-[0.05em] text-[#e7f8ff] shadow-[0_0_14px_rgba(var(--mode-rgb),0.32),inset_0_1px_0_rgba(255,255,255,0.12)] [text-shadow:0_0_10px_rgba(var(--mode-rgb),0.45)] ring-1 ring-[rgba(var(--mode-rgb),0.3)] transition-all duration-200 sm:h-8 sm:px-3 sm:text-[10px] sm:tracking-[0.06em]"
      : "h-8 shrink-0 whitespace-nowrap rounded-full border border-[rgba(var(--mode-rgb),0.28)] bg-gradient-to-b from-[rgba(10,36,58,0.88)] to-[rgba(6,22,38,0.92)] px-2 py-0 text-center text-[9px] font-semibold uppercase leading-8 tracking-[0.05em] text-[#c7efff]/90 opacity-[0.92] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all duration-200 hover:border-[rgba(var(--mode-rgb),0.45)] hover:text-[#eaf8ff] hover:opacity-100 hover:shadow-[0_0_12px_rgba(var(--mode-rgb),0.18)] sm:px-2.5 sm:text-[10px]";

  /** Simplified shell: match compact one-line strip. */
  const growthCompactTabClass = (selected: boolean) =>
    selected
      ? "h-8 shrink-0 whitespace-nowrap rounded-full border border-[rgba(var(--mode-rgb),0.52)] bg-gradient-to-b from-[rgba(11,57,90,0.92)] to-[rgba(7,38,58,0.95)] px-2.5 py-0 text-[9px] font-bold uppercase leading-8 tracking-[0.05em] text-[#e7f8ff] shadow-[0_0_12px_rgba(var(--mode-rgb),0.26),inset_0_1px_0_rgba(255,255,255,0.08)] [text-shadow:0_0_8px_rgba(var(--mode-rgb),0.35)] ring-1 ring-[rgba(var(--mode-rgb),0.24)] transition-all duration-200 sm:px-3 sm:text-[10px]"
      : "h-8 shrink-0 whitespace-nowrap rounded-full border border-[rgba(var(--mode-rgb),0.2)] bg-gradient-to-b from-[rgba(10,36,58,0.75)] to-[rgba(6,22,38,0.82)] px-2 py-0 text-[9px] font-semibold uppercase leading-8 tracking-[0.05em] text-[#c7efff]/80 opacity-90 transition-all duration-200 hover:border-[rgba(var(--mode-rgb),0.38)] hover:text-[#eaf8ff] hover:opacity-100 hover:shadow-[0_0_10px_rgba(var(--mode-rgb),0.14)] sm:px-2.5 sm:text-[10px]";

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

  const tabButtonsCompact = (
    <nav
      className="relative z-10 -mx-1 flex flex-nowrap items-center justify-center gap-1 overflow-x-auto rounded-xl border border-[rgba(var(--mode-rgb),0.18)] bg-[rgba(6,18,30,0.38)] px-1.5 py-1.5 shadow-[0_0_24px_rgba(var(--mode-rgb),0.08)] backdrop-blur-md [scrollbar-width:thin] sm:gap-1.5 sm:px-2"
      aria-label="Groei-tabs"
    >
      {TABS.map((tab) => {
        const selected = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-current={selected ? "page" : undefined}
            onClick={() => setTab(tab.id)}
            className={growthCompactTabClass(selected)}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );

  const panel = <section aria-label={`Groei-tab: ${activeLabel}`}>{children(activeTab)}</section>;

  if (commandPageHeader) {
    const h = commandPageHeader;
    const ringMode = h.ringMode ?? "default";
    return (
      <div className="space-y-4" data-growth-tabs>
        <section className="space-y-3" aria-label="Growth command">
          <div className="flex items-center justify-between gap-2">
            {h.backHref ? (
              <Link
                href={h.backHref}
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

          <div className="flex min-w-0 items-center justify-between gap-3">
            <h1 className="min-w-0 shrink text-lg font-bold uppercase tracking-[0.16em] text-[var(--text-primary)] [text-shadow:0_0_14px_rgba(var(--mode-rgb),0.35),0_0_28px_rgba(var(--mode-rgb),0.12)] sm:text-xl sm:tracking-[0.18em]">
              GROWTH
            </h1>
            <div
              className="relative shrink-0"
              role="img"
              aria-label={`Weekdoel: ${h.ringValue}`}
            >
              <div
                className="absolute left-1/2 top-1/2 h-[118%] w-[118%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(var(--mode-rgb),0.16)_0%,transparent_62%)] blur-md"
                aria-hidden
              />
              <div className="relative drop-shadow-[0_12px_28px_rgba(0,0,0,0.45)]" aria-hidden>
                <EnergyRing
                  size={RING_SIZE}
                  progress={h.ringProgress}
                  label={h.ringLabel ?? "Week"}
                  value={h.ringValue}
                  mode={ringMode}
                  softGlow
                />
              </div>
            </div>
          </div>

          <p
            className="min-w-0 truncate text-xs leading-snug text-[var(--text-muted)]"
            title={h.statusLine}
          >
            {h.statusLine}
          </p>

          {h.actions != null ? (
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">{h.actions}</div>
          ) : null}
        </section>

        <section
          aria-label="Growth status"
          className="rounded-xl border border-amber-400/55 bg-gradient-to-br from-amber-500/[0.2] via-amber-600/[0.1] to-transparent px-4 py-3 shadow-[0_0_0_1px_rgba(251,191,36,0.12),0_0_28px_rgba(245,158,11,0.16),0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-sm"
        >
          <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-100 [text-shadow:0_0_12px_rgba(251,191,36,0.35)]">
            Growth Status
          </h2>
          <p className="mt-1.5 text-sm leading-snug text-amber-50/95">{h.statusCardMessage}</p>
          <Link
            href={h.strategyHref ?? "/strategy"}
            className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-amber-400/55 bg-amber-500/25 px-4 py-2.5 text-center text-sm font-semibold text-amber-50 shadow-[0_0_18px_rgba(245,158,11,0.22)] transition hover:border-amber-300/70 hover:bg-amber-500/35 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)] sm:w-auto"
          >
            Open Strategy
          </Link>
        </section>

        {tabButtonsPills}
        {belowTabsSlot != null ? <div className="space-y-4">{belowTabsSlot}</div> : null}
        <div className="min-h-[120px] space-y-4">{panel}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-growth-tabs>
      {tabButtonsCompact}
      {panel}
    </div>
  );
}
