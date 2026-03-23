import Link from "next/link";

export type InsightsTabId = "overview" | "performance" | "patterns" | "diagnostics";

const TABS: { id: InsightsTabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "performance", label: "Performance" },
  { id: "patterns", label: "Patterns" },
  { id: "diagnostics", label: "Diagnostics" },
];

export function isInsightsTabId(value: string | null | undefined): value is InsightsTabId {
  if (!value) return false;
  return TABS.some((tab) => tab.id === value);
}

function buildTabHref(tab: InsightsTabId, weekStart?: string | null): string {
  const params = new URLSearchParams();
  if (weekStart) params.set("weekStart", weekStart);
  params.set("tab", tab);
  return `/report?${params.toString()}`;
}

type Props = {
  activeTab: InsightsTabId;
  weekStart?: string | null;
  children: React.ReactNode;
};

export function InsightsTabsShell({ activeTab, weekStart, children }: Props) {
  return (
    <div className="space-y-4">
      <nav
        className="sticky top-[calc(env(safe-area-inset-top,0px)+8px)] z-30 -mx-1 flex flex-wrap gap-2 rounded-xl border border-[var(--card-border)]/80 bg-[var(--bg-primary)]/75 px-2 py-2 backdrop-blur-md"
        aria-label="Insights tabs"
      >
        {TABS.map((tab) => {
          const selected = tab.id === activeTab;
          return (
            <Link
              key={tab.id}
              href={buildTabHref(tab.id, weekStart)}
              scroll={false}
              aria-current={selected ? "page" : undefined}
              className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition ${
                selected
                  ? "border-[var(--semantic-ring)]/60 bg-[var(--semantic-accent)]/20 text-[var(--semantic-accent)]"
                  : "border-transparent text-[var(--text-muted)] hover:border-[var(--semantic-ring)]/50 hover:bg-[var(--semantic-accent)]/10 hover:text-[var(--semantic-accent)]"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <section aria-label={`Insights tab: ${activeTab}`}>{children}</section>
    </div>
  );
}
