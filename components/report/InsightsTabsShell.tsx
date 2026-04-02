import Link from "next/link";
import { profileInsightsHref } from "@/lib/profile-routes";

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
  return profileInsightsHref(tab, weekStart);
}

type Props = {
  activeTab: InsightsTabId;
  weekStart?: string | null;
  children: React.ReactNode;
  /** When set (e.g. profile embed), tab links use this instead of `/report?tab=`. */
  resolveTabHref?: (tab: InsightsTabId) => string;
  /** Inside simplified command deck: sticky strip matches budget tab row. */
  simplifiedLayout?: boolean;
};

export function InsightsTabsShell({ activeTab, weekStart, children, resolveTabHref, simplifiedLayout = false }: Props) {
  const navClass = simplifiedLayout
    ? "sticky top-0 z-20 -mx-1 flex flex-wrap gap-2 border-b border-[var(--card-border)]/50 bg-[var(--bg-surface)]/85 px-1 py-2 backdrop-blur-md supports-[backdrop-filter]:bg-[var(--bg-surface)]/70 sm:px-2"
    : "sticky top-[calc(env(safe-area-inset-top,0px)+8px)] z-30 -mx-1 flex flex-wrap gap-2 rounded-xl border border-[var(--card-border)]/80 bg-[var(--bg-primary)]/75 px-2 py-2 backdrop-blur-md";

  const linkClass = (selected: boolean) =>
    simplifiedLayout
      ? `dashboard-mini-btn ${selected ? "dashboard-mini-btn-primary" : "dashboard-mini-btn-secondary"}`
      : `rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition ${
          selected
            ? "border-[var(--semantic-ring)]/60 bg-[var(--semantic-accent)]/20 text-[var(--semantic-accent)]"
            : "border-transparent text-[var(--text-muted)] hover:border-[var(--semantic-ring)]/50 hover:bg-[var(--semantic-accent)]/10 hover:text-[var(--semantic-accent)]"
        }`;

  return (
    <div className="space-y-4">
      <nav className={navClass} aria-label="Insights tabs">
        {TABS.map((tab) => {
          const selected = tab.id === activeTab;
          const href = resolveTabHref ? resolveTabHref(tab.id) : buildTabHref(tab.id, weekStart);
          return (
            <Link
              key={tab.id}
              href={href}
              scroll={false}
              aria-current={selected ? "page" : undefined}
              className={linkClass(selected)}
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
