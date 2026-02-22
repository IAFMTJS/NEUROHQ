/**
 * Mascot assets: one per page. Files in "New styling idea" are named after the pages.
 * Copy that folder into public/mascots/ – see docs/MASCOT_AND_ENGINE_SPEC.md
 */

export type DashboardPage =
  | "dashboard"
  | "tasks"
  | "learning"
  | "assistant"
  | "analytics"
  | "report"
  | "budget"
  | "strategy"
  | "settings"
  | "xp";

/** Page name (route segment) → mascot filename in "New styling idea" */
export const MASCOT_FILE_BY_PAGE: Record<DashboardPage, string> = {
  dashboard: "Homepage Mascotte.png",
  tasks: "Mission page.png",
  learning: "Growth page.png",
  assistant: "page.png",
  analytics: "page.png",
  report: "page.png",
  budget: "Budget page.png",
  strategy: "Strategy page.png",
  settings: "Settings page.png",
  xp: "XP page.PNG",
};

const MASCOTS_BASE = "/mascots";

/** Returns the public URL for a page’s mascot (e.g. /mascots/Budget%20page.png). */
/** Bump this when you edit a mascot image so the browser loads the new file. */
const MASCOT_CACHE_VERSION = 2;

export function getMascotSrcForPage(page: DashboardPage): string {
  const file = MASCOT_FILE_BY_PAGE[page];
  return `${MASCOTS_BASE}/${encodeURIComponent(file)}?v=${MASCOT_CACHE_VERSION}`;
}

/** Parses pathname (e.g. /dashboard, /tasks) to page; returns "dashboard" for unknown. */
export function pageFromPathname(pathname: string): DashboardPage {
  const segment = pathname.replace(/^\//, "").split("/")[0] || "dashboard";
  if (segment in MASCOT_FILE_BY_PAGE) return segment as DashboardPage;
  return "dashboard";
}

/** HeroMascotVariant (UI label) → DashboardPage (route). Used by HeroMascotImage. */
export const MASCOT_VARIANT_TO_PAGE: Record<
  "homepage" | "missions" | "assistant" | "analytics" | "budget" | "report" | "growth" | "strategy" | "settings" | "xp",
  DashboardPage
> = {
  homepage: "dashboard",
  missions: "tasks",
  assistant: "assistant",
  analytics: "analytics",
  budget: "budget",
  report: "report",
  growth: "learning",
  strategy: "strategy",
  settings: "settings",
  xp: "xp",
};
